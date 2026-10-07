import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {contextPlugin} from '@sanity/context/studio'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Field Notes',

  projectId: 'krbdaikf',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), contextPlugin({insights: false})],

  schema: {
    types: schemaTypes,
  },
})
