import {defineField, defineType} from 'sanity'

export const county = defineType({
  name: 'county',
  title: 'County',
  type: 'document',
  fields: [
    defineField({name: 'names', title: 'Name', type: 'localeString'}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'names.en'},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'reference',
      to: [{type: 'country'}],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {title: 'names.en', country: 'country.names.en'},
    prepare: ({title, country}) => ({title, subtitle: country}),
  },
})
