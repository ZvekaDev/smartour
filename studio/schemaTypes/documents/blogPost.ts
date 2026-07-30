import {defineField, defineType} from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'One slug shared across all three languages.',
      options: {source: 'title.en'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'excerpt', title: 'Excerpt', type: 'localeText'}),
    defineField({name: 'body', title: 'Body (paragraphs)', type: 'localeParagraphs'}),
    defineField({name: 'category', title: 'Category label', type: 'string'}),
    defineField({name: 'author', title: 'Author', type: 'string'}),
    defineField({name: 'date', title: 'Date', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'coverGradient',
      title: 'Cover gradient (fallback, Tailwind classes)',
      type: 'string',
      description: 'Used when no cover image is set, e.g. "from-emerald-700 via-emerald-600 to-lime-600".',
    }),
  ],
  preview: {
    select: {title: 'title.en', date: 'date', media: 'coverImage'},
    prepare: ({title, date, media}) => ({title, subtitle: date, media}),
  },
})
