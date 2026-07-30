import {defineField, defineType} from 'sanity'

export const transportBlock = defineType({
  name: 'transportBlock',
  title: 'Transport section',
  type: 'object',
  fields: [
    defineField({
      name: 'anchorId',
      title: 'Anchor ID',
      type: 'string',
      description: 'Used for the quick-card jump link, e.g. "section-train".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon class',
      type: 'string',
      description: 'Bootstrap Icons class, e.g. "bi bi-train-front" — mapped to an emoji at render time.',
    }),
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'localeText'}),
    defineField({name: 'links', title: 'Links', type: 'array', of: [{type: 'transportLink'}]}),
  ],
  preview: {
    select: {title: 'title.en'},
  },
})
