import {defineField, defineType} from 'sanity'

/** Singleton document — one record holds all Transport page content. */
export const transportPage = defineType({
  name: 'transportPage',
  title: 'Transport page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'quickCards', title: 'Quick cards'},
    {name: 'blocks', title: 'Sections'},
    {name: 'cta', title: 'CTA'},
  ],
  fields: [
    defineField({name: 'heroTitle', title: 'Title', type: 'localeString', group: 'hero'}),
    defineField({name: 'heroSubtitle', title: 'Subtitle', type: 'localeString', group: 'hero'}),

    defineField({
      name: 'quickCards',
      title: 'Quick cards',
      description: 'Small jump-link cards near the top of the page (icon, anchor, title, text).',
      type: 'array',
      group: 'quickCards',
      of: [
        {
          type: 'object',
          name: 'quickCard',
          fields: [
            {name: 'icon', title: 'Icon class', type: 'string'},
            {name: 'anchor', title: 'Anchor (e.g. #section-train)', type: 'string'},
            {name: 'title', title: 'Title', type: 'localeString'},
            {name: 'text', title: 'Text', type: 'localeString'},
          ],
        },
      ],
    }),

    defineField({
      name: 'blocks',
      title: 'Sections',
      type: 'array',
      group: 'blocks',
      of: [{type: 'transportBlock'}],
    }),

    defineField({name: 'ctaTitle', title: 'Title', type: 'localeString', group: 'cta'}),
    defineField({name: 'ctaText', title: 'Text', type: 'localeText', group: 'cta'}),
    defineField({name: 'ctaPrimaryText', title: 'Primary button text', type: 'localeString', group: 'cta'}),
    defineField({name: 'ctaSecondaryText', title: 'Secondary button text', type: 'localeString', group: 'cta'}),
  ],
  preview: {
    prepare: () => ({title: 'Transport page'}),
  },
})
