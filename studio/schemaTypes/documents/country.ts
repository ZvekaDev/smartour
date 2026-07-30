import {defineField, defineType} from 'sanity'

export const country = defineType({
  name: 'country',
  title: 'Country',
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
  ],
  preview: {select: {title: 'names.en'}},
})
