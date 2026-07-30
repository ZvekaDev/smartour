import {defineField, defineType} from 'sanity'

/** Short text (title, label, heading) translated into all three site languages. */
export const localeString = defineType({
  name: 'localeString',
  title: 'Localized text',
  type: 'object',
  fields: [
    defineField({name: 'en', title: 'English', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'sr', title: 'Serbian', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'hu', title: 'Hungarian', type: 'string', validation: (r) => r.required()}),
  ],
})
