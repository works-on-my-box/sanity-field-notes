import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

// Короткий абзац с инлайн-кодом: Portable Text без заголовков и списков.
const shortProse = defineArrayMember({
  type: 'block',
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [
      {title: 'Code', value: 'code'},
      {title: 'Emphasis', value: 'em'},
    ],
    annotations: [],
  },
})

// Заметка: симптом → причина → правило. Единица знания, а не страница.
export const note = defineType({
  name: 'note',
  title: 'Field note',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'States the mechanism in one line, e.g. "Chrome drops CDP input while another window covers it".',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title', maxLength: 60},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'observedAt',
      title: 'Observed on',
      type: 'date',
      description: 'The day the behaviour was observed. Newer notes may supersede older ones.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'area',
      type: 'reference',
      to: [{type: 'area'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'tag'}]})],
      validation: (rule) => rule.min(1).max(8).unique(),
    }),
    defineField({
      name: 'symptom',
      type: 'array',
      of: [shortProse],
      description: 'What was observed, as seen from the outside.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cause',
      type: 'array',
      of: [shortProse],
      description: 'The mechanism behind the symptom.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rule',
      type: 'array',
      of: [shortProse],
      description: 'What to do instead. This is what an agent should quote.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          {title: 'Current', value: 'current'},
          {title: 'Superseded', value: 'superseded'},
        ],
        layout: 'radio',
      },
      initialValue: 'current',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'supersedes',
      type: 'reference',
      to: [{type: 'note'}],
      description: 'An earlier note whose rule this note replaces or narrows.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const id = context.document?._id?.replace(/^drafts\./, '')
          if (value && (value as {_ref?: string})._ref === id) return 'A note cannot supersede itself'
          return true
        }),
    }),
    defineField({
      name: 'source',
      type: 'object',
      description: 'Where this note came from (kept for provenance, not shown to agents).',
      fields: [
        defineField({name: 'file', type: 'string'}),
        defineField({name: 'heading', type: 'string'}),
      ],
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'observedAtDesc', by: [{field: 'observedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'area.title', status: 'status'},
    prepare({title, subtitle, status}) {
      return {title, subtitle: status === 'superseded' ? `${subtitle} · superseded` : subtitle}
    },
  },
})
