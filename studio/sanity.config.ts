import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import type {StructureBuilder} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes, singletonTypes} from './schemaTypes'

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Offers')
        .child(S.documentTypeList('offer').title('Offers')),
      S.listItem()
        .title('Blog posts')
        .child(S.documentTypeList('blogPost').title('Blog posts')),
      S.divider(),
      S.listItem()
        .title('Taxonomy')
        .child(
          S.list()
            .title('Taxonomy')
            .items([
              S.listItem().title('Categories').child(S.documentTypeList('category').title('Categories')),
              S.listItem().title('Countries').child(S.documentTypeList('country').title('Countries')),
              S.listItem().title('Counties').child(S.documentTypeList('county').title('Counties')),
              S.listItem().title('Towns').child(S.documentTypeList('town').title('Towns')),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('About Us page')
        .child(S.document().schemaType('aboutUs').documentId('aboutUs')),
      S.listItem()
        .title('Transport page')
        .child(S.document().schemaType('transportPage').documentId('transportPage')),
      S.listItem()
        .title('Site settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ])

export default defineConfig({
  name: 'default',
  title: 'SMARTour',

  projectId: 'yrilioxt',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Singletons can't be created/deleted like normal documents — there's exactly one of each.
    templates: (templates) => templates.filter(({schemaType}) => !singletonTypes.has(schemaType)),
  },

  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : input,
  },
})
