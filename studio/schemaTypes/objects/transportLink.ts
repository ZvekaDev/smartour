import {defineField, defineType} from 'sanity'

export const transportLink = defineType({
  name: 'transportLink',
  title: 'Transport link',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon class',
      type: 'string',
      description: 'Bootstrap Icons class, e.g. "bi bi-globe2" — mapped to an emoji at render time.',
    }),
    defineField({name: 'href', title: 'URL', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'text', title: 'Link text', type: 'localeString'}),
    defineField({name: 'description', title: 'Description', type: 'localeText'}),
  ],
  preview: {
    select: {title: 'text.en', href: 'href'},
    prepare: ({title, href}) => ({title, subtitle: href}),
  },
})
