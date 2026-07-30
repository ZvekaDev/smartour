import {defineField, defineType} from 'sanity'

/** A video hosted on YouTube or Vimeo, embedded by link. */
export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video link (YouTube / Vimeo)',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'A YouTube or Vimeo link, e.g. https://www.youtube.com/watch?v=...',
      validation: (r) => r.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {title: 'url'},
    prepare: ({title}) => ({title: title ?? 'Video link', subtitle: 'YouTube / Vimeo embed'}),
  },
})
