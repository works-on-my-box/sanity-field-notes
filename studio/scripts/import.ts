// Импорт заметок из NDJSON в Content Lake.
// Запуск: npx sanity exec scripts/import.ts --with-user-token -- <path/to/notes.ndjson>
// Идемпотентно: area/tag/note ищутся по slug, заметки обновляются (createOrReplace по найденному _id).
import {readFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {getCliClient} from 'sanity/cli'

type Raw = {
  slug: string
  title: string
  date: string
  area: string
  tags: string[]
  symptom: string
  cause: string
  rule: string
  source_heading: string
  supersedes: string | null
  status: 'current' | 'superseded'
}

const client = getCliClient({apiVersion: '2026-10-01'})
const file = process.argv[2]
if (!file) throw new Error('usage: import.ts <notes.ndjson>')

const rows: Raw[] = readFileSync(file, 'utf8')
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l))

const AREA_TITLES: Record<string, string> = {
  puppeteer: 'Puppeteer',
  chrome: 'Chrome & DevTools Protocol',
  'linux-services': 'Linux services',
  node: 'Node.js',
  email: 'Email (IMAP/SMTP)',
  shell: 'Shell',
  git: 'Git',
  postgres: 'PostgreSQL',
  'windows-wsl': 'Windows & WSL',
  'web-forms': 'Web forms',
  'coding-agents': 'Coding agents',
}

// Абзац с `код` → Portable Text: обычные спаны и спаны с маркой code.
function toBlocks(text: string) {
  const children: {_type: 'span'; _key: string; text: string; marks: string[]}[] = []
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean)
  for (const part of parts) {
    const isCode = part.startsWith('`') && part.endsWith('`') && part.length > 2
    children.push({
      _type: 'span',
      _key: randomUUID().slice(0, 12),
      text: isCode ? part.slice(1, -1) : part,
      marks: isCode ? ['code'] : [],
    })
  }
  return [{_type: 'block', _key: randomUUID().slice(0, 12), style: 'normal', markDefs: [], children}]
}

async function upsertTaxonomy(type: 'area' | 'tag', slug: string, title: string) {
  const existing = await client.fetch<{_id: string} | null>(
    `*[_type == $type && slug.current == $slug][0]{_id}`,
    {type, slug},
  )
  if (existing?._id) return existing._id
  const doc = await client.create({_type: type, title, slug: {_type: 'slug', current: slug}})
  return doc._id
}

async function main() {
  const areaIds = new Map<string, string>()
  const tagIds = new Map<string, string>()
  const noteIds = new Map<string, string>()

  for (const r of rows) {
    if (!areaIds.has(r.area)) areaIds.set(r.area, await upsertTaxonomy('area', r.area, AREA_TITLES[r.area] ?? r.area))
    for (const t of r.tags) if (!tagIds.has(t)) tagIds.set(t, await upsertTaxonomy('tag', t, t))
  }
  console.log(`areas ${areaIds.size}, tags ${tagIds.size}, notes ${rows.length}`)

  // Первый проход — без ссылок supersedes (цель может ещё не существовать).
  for (const r of rows) {
    const existing = await client.fetch<{_id: string} | null>(
      `*[_type == "note" && slug.current == $slug][0]{_id}`,
      {slug: r.slug},
    )
    const doc = {
      _type: 'note',
      title: r.title,
      slug: {_type: 'slug', current: r.slug},
      observedAt: r.date,
      area: {_type: 'reference', _ref: areaIds.get(r.area)!},
      tags: r.tags.map((t) => ({_type: 'reference', _key: t.slice(0, 12), _ref: tagIds.get(t)!})),
      symptom: toBlocks(r.symptom),
      cause: toBlocks(r.cause),
      rule: toBlocks(r.rule),
      status: r.status,
      source: {file: 'LESSONS.md'}, // заголовок-источник в публичный датасет не кладём
    }
    const saved = existing?._id
      ? await client.createOrReplace({_id: existing._id, ...doc})
      : await client.create(doc)
    noteIds.set(r.slug, saved._id)
  }

  // Второй проход — ссылки supersedes.
  let links = 0
  for (const r of rows) {
    if (!r.supersedes) continue
    const target = noteIds.get(r.supersedes)
    if (!target) {
      console.warn(`supersedes target missing: ${r.slug} -> ${r.supersedes}`)
      continue
    }
    await client.patch(noteIds.get(r.slug)!).set({supersedes: {_type: 'reference', _ref: target}}).commit()
    links++
  }
  console.log(`done: ${noteIds.size} notes, ${links} supersedes links`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
