import {defineField, defineType} from 'sanity'
import {FolderIcon} from '@sanity/icons/Folder'

// Область инженерии, к которой относится заметка (одна на заметку).
export const area = defineType({
  name: 'area',
  title: 'Area',
  type: 'document',
  icon: FolderIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', type: 'text', rows: 2}),
  ],
})
