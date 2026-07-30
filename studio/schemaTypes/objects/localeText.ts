import {defineField, defineType} from 'sanity'

/** Longer plain text (a description, a paragraph) translated into all three site languages. */
export const localeText = defineType({
  name: 'localeText',
  title: 'Localized text (long)',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'sr', title: 'Serbian', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'hu', title: 'Hungarian', type: 'text', rows: 4, validation: (r) => r.required()}),
  ],
})
