import {defineField, defineType} from 'sanity'

/** A list of paragraphs (e.g. blog post body), translated into all three site languages. */
export const localeParagraphs = defineType({
  name: 'localeParagraphs',
  title: 'Localized paragraphs',
  type: 'object',
  fields: [
    defineField({
      name: 'en',
      title: 'English',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'sr',
      title: 'Serbian',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'hu',
      title: 'Hungarian',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      validation: (r) => r.required().min(1),
    }),
  ],
})
