import {defineField, defineType} from 'sanity'

export const town = defineType({
  name: 'town',
  title: 'Town',
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
      name: 'county',
      title: 'County',
      type: 'reference',
      to: [{type: 'county'}],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: {title: 'names.en', county: 'county.names.en'},
    prepare: ({title, county}) => ({title, subtitle: county}),
  },
})
