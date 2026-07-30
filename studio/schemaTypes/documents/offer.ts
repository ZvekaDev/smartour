import {defineField, defineType} from 'sanity'

export const offer = defineType({
  name: 'offer',
  title: 'Offer',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Photos & Videos'},
    {name: 'location', title: 'Location'},
    {name: 'contact', title: 'Contact'},
  ],
  fields: [
    defineField({name: 'title', title: 'Title', type: 'localeString', group: 'content'}),
    defineField({
      name: 'slugs',
      title: 'Slugs',
      type: 'object',
      group: 'content',
      fields: [
        {name: 'en', title: 'English slug', type: 'slug', options: {source: 'title.en'}},
        {name: 'sr', title: 'Serbian slug', type: 'slug', options: {source: 'title.sr'}},
        {name: 'hu', title: 'Hungarian slug', type: 'slug', options: {source: 'title.hu'}},
      ],
    }),
    defineField({name: 'description', title: 'Description', type: 'localeText', group: 'content'}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
      validation: (r) => r.required(),
    }),

    defineField({
      name: 'photos',
      title: 'Photo gallery',
      type: 'array',
      group: 'media',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
        },
      ],
    }),
    defineField({
      name: 'videos',
      title: 'Video gallery',
      type: 'array',
      group: 'media',
      of: [{type: 'videoEmbed'}, {type: 'videoFile'}],
      description: 'Add one or more videos, each either a YouTube/Vimeo link or an uploaded file.',
    }),

    defineField({
      name: 'country',
      title: 'Country',
      type: 'reference',
      to: [{type: 'country'}],
      group: 'location',
      validation: (r) => r.required(),
    }),
    defineField({name: 'county', title: 'County', type: 'reference', to: [{type: 'county'}], group: 'location'}),
    defineField({name: 'town', title: 'Town', type: 'reference', to: [{type: 'town'}], group: 'location'}),
    defineField({name: 'address', title: 'Address', type: 'string', group: 'location'}),
    defineField({name: 'zip', title: 'ZIP / postal code', type: 'string', group: 'location'}),
    defineField({name: 'location', title: 'Map coordinates', type: 'geopoint', group: 'location'}),

    defineField({name: 'phone', title: 'Phone', type: 'string', group: 'contact'}),
    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact'}),
    defineField({name: 'website', title: 'Website', type: 'url', group: 'contact'}),
    defineField({name: 'facebook', title: 'Facebook', type: 'url', group: 'contact'}),
    defineField({name: 'instagram', title: 'Instagram', type: 'url', group: 'contact'}),
    defineField({name: 'tiktok', title: 'TikTok', type: 'url', group: 'contact'}),
  ],
  preview: {
    select: {title: 'title.en', category: 'category.names.en', media: 'photos.0'},
    prepare: ({title, category, media}) => ({title, subtitle: category, media}),
  },
})
