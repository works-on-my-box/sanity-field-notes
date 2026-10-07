import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons/Tag'

// Плоская таксономия: свободные метки, много на заметку.
export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
  ],
})
