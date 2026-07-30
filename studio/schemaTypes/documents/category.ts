import {defineField, defineType} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
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
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
      description: 'Single emoji shown as the category icon, e.g. 🎉',
    }),
  ],
  preview: {
    select: {title: 'names.en', icon: 'icon'},
    prepare: ({title, icon}) => ({title: `${icon ?? ''} ${title}`.trim()}),
  },
})
