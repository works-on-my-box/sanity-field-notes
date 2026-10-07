import { defineQuery } from 'groq';

// Только действующие правила: устаревшие заметки видны лишь по прямой ссылке.
export const NOTES_QUERY = defineQuery(`
  *[_type == "note" && status == "current"] | order(observedAt desc) {
    _id, title, "slug": slug.current, observedAt,
    "area": area->{title, "slug": slug.current},
    "tags": tags[]->{title, "slug": slug.current}
  }
`);

export const AREAS_QUERY = defineQuery(`
  *[_type == "area"] | order(title asc) {
    _id, title, "slug": slug.current, description,
    "count": count(*[_type == "note" && status == "current" && references(^._id)])
  }
`);

export const NOTE_QUERY = defineQuery(`
  *[_type == "note" && slug.current == $slug][0] {
    _id, title, "slug": slug.current, observedAt, status, symptom, cause, rule,
    "area": area->{title, "slug": slug.current},
    "tags": tags[]->{title, "slug": slug.current},
    "supersedes": supersedes->{title, "slug": slug.current},
    "supersededBy": *[_type == "note" && references(^._id) && status == "current"][0]{title, "slug": slug.current}
  }
`);

export const NOTE_SLUGS_QUERY = defineQuery(`
  *[_type == "note" && defined(slug.current)]{ "params": { "slug": slug.current } }
`);
