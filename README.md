# Field notes

Short engineering notes, each one a symptom, a cause and a rule, from a browser-automation stack that runs unattended on a small VPS: Puppeteer, Chrome under Xvfb, systemd units, IMAP polling. 119 notes in 11 areas, modeled in Sanity, served by a static Astro site and exposed to coding agents through Sanity Context.

- `data/notes.ndjson`: the notes, one JSON object per line.
- `studio/`: Sanity Studio, the schema (`note`, `area`, `tag`) and two scripts: `scripts/import.ts` loads the notes, `scripts/context-doc.ts` creates the Context document.
- `web/`: the Astro site. Static build, reads the dataset at build time, published from the `gh-pages` branch.
- `.mcp.json` and `.agents/skills`: the Sanity MCP server and the Sanity agent skills that Claude Code used while this was built.

Project `krbdaikf`, dataset `production` (public, read access without a token).

## Why

The notes started as one Markdown file with about 280 entries. A newer entry sometimes replaces an older one. The old entry stays in the file and nothing lets a tool filter it out, so an agent that searches the file can land on a rule that no longer applies.

In the dataset a replacement is a `supersedes` reference from the new note to the old one, the old note carries `status: superseded`, and the GROQ filter on the Context document hides superseded notes. An agent that reads through Context sees only the current rules. The site shows both and links them in both directions.

## Content model

`studio/schemaTypes/note.ts`:

- `title`, `slug`, `observedAt` (the day the behaviour was observed).
- `area`: a reference to one `area` document (Puppeteer, Chrome & DevTools Protocol, Linux services, Node.js, Email, Shell, Git, PostgreSQL, Windows & WSL, Web forms, Coding agents).
- `tags`: 1 to 8 references to `tag` documents, unique.
- `symptom`, `cause`, `rule`: Portable Text, one paragraph each, with only `code` and `em` marks. No headings, no lists.
- `status`: `current` or `superseded`, a radio button in the Studio.
- `supersedes`: a reference to the note this one replaces or narrows. A custom validation rule rejects a note that references itself.
- `source`: file and heading the note came from. Kept for provenance, not shown to agents.

Why both a reference and a status: `status` is what the Context filter checks, so hiding superseded notes costs one comparison and no join. `supersedes` says which note replaced the old one, so the site can link both ways and an agent that still meets an old note can follow it to the current rule. The import sets both from the same field in the data.

## Data and import

`data/notes.ndjson` has 119 notes, 7 of them superseded. Fields: `slug`, `title`, `date`, `area`, `tags`, `symptom`, `cause`, `rule`, `status`, `supersedes`. Inline code is written with backticks and becomes a `code` span in Portable Text.

```
cd studio
npm install
npx sanity exec scripts/import.ts --with-user-token -- ../data/notes.ndjson
```

The script creates missing areas and tags, upserts notes by slug, then sets the `supersedes` references in a second pass, because the target note may not exist during the first one. Running it twice updates the notes in place.

## Context for agents

```
cd studio
npx sanity exec scripts/context-doc.ts --with-user-token
```

This creates a `sanity.agentContext` document with slug `field-notes`, the filter

```
_type in ["note", "area", "tag"] && (_type != "note" || status == "current")
```

and instructions: search `symptom` first, then `cause`, quote the `rule` verbatim, prefer GROQ filters on `area->slug.current` and `tags[]->slug.current` when the user names a tool, and let the newer note win when two rules conflict.

Context serves the dataset over MCP at `https://api.sanity.io/v2026-03-03/context/mcp/<projectId>/<dataset>/field-notes` with a project Viewer token. It needs the Studio deployed to Sanity hosting: set `studioHost` in `studio/sanity.cli.ts` and run `npx sanity deploy`. The `contextPlugin` in `studio/sanity.config.ts` adds the Context documents to the Studio.

## Site

```
cd web
npm install
cp .env.example .env
npm run build
```

`astro.config.mjs` sets `site` and `base` for GitHub Pages; internal links use `import.meta.env.BASE_URL`. The index page groups notes by area, each note page shows the three fields, the tags and the supersedes links in both directions.

## Use it with your own notes

Change `projectId` and `dataset` in `studio/sanity.cli.ts`, `studio/sanity.config.ts` and `web/.env`, write your notes in the NDJSON format above, run the import and the Context script. Everything else stays the same.
