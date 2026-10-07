// Создаёт (или обновляет) документ Sanity Context: что видит агент и как ему искать.
// Запуск: npx sanity exec scripts/context-doc.ts --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-01'})

const instructions = `This dataset is a knowledge base of short engineering field notes.
Each "note" has three Portable Text fields: symptom (what was observed), cause (the mechanism), rule (what to do instead).
Notes reference one "area" (e.g. Puppeteer, Chrome & DevTools Protocol, Linux services, Email) and several "tag" documents.
Only notes with status == "current" are exposed; a note may reference an earlier note it supersedes via the "supersedes" field.
When a user describes a problem, search symptom text first, then cause; quote the rule verbatim and name the note title.
Prefer GROQ filters on area->slug.current and tags[]->slug.current over free-text search when the user names a tool.
Dates are in observedAt (YYYY-MM-DD); newer notes win when two rules conflict.`

async function main() {
  const existing = await client.fetch<{_id: string} | null>(
    `*[_type == "sanity.agentContext" && slug.current == "field-notes"][0]{_id}`,
  )
  const doc = {
    _type: 'sanity.agentContext',
    name: 'Field notes assistant',
    slug: {_type: 'slug', current: 'field-notes'},
    groqFilter: '_type in ["note", "area", "tag"] && (_type != "note" || status == "current")',
    instructions,
  }
  const saved = existing?._id
    ? await client.createOrReplace({_id: existing._id, ...doc})
    : await client.create(doc)
  console.log('context document', saved._id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
