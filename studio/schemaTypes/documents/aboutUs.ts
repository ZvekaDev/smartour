import {defineField, defineType} from 'sanity'

/** Singleton document — one record holds all About Us page content. */
export const aboutUs = defineType({
  name: 'aboutUs',
  title: 'About Us page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'whoWeAre', title: 'Who We Are'},
    {name: 'mission', title: 'Mission & Vision'},
    {name: 'offer', title: 'What We Offer'},
    {name: 'story', title: 'Our Story'},
    {name: 'cta', title: 'CTA'},
  ],
  fields: [
    defineField({name: 'heroTitle', title: 'Hero title', type: 'localeString', group: 'hero'}),
    defineField({name: 'heroSubtitle', title: 'Hero subtitle', type: 'localeString', group: 'hero'}),

    defineField({name: 'whoWeAreTagline', title: 'Tagline', type: 'localeString', group: 'whoWeAre'}),
    defineField({name: 'whoWeAreHeading', title: 'Heading', type: 'localeString', group: 'whoWeAre'}),
    defineField({name: 'whoWeAreParagraphs', title: 'Paragraphs', type: 'localeParagraphs', group: 'whoWeAre'}),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [{type: 'statItem'}],
      group: 'whoWeAre',
    }),

    defineField({name: 'missionTagline', title: 'Mission tagline', type: 'localeString', group: 'mission'}),
    defineField({name: 'missionParagraph', title: 'Mission paragraph', type: 'localeText', group: 'mission'}),
    defineField({name: 'visionTagline', title: 'Vision tagline', type: 'localeString', group: 'mission'}),
    defineField({name: 'visionParagraph', title: 'Vision paragraph', type: 'localeText', group: 'mission'}),

    defineField({name: 'offerHeading', title: 'Heading', type: 'localeString', group: 'offer'}),
    defineField({name: 'offerSubheading', title: 'Subheading', type: 'localeString', group: 'offer'}),
    defineField({
      name: 'offerCards',
      title: 'Cards',
      type: 'array',
      of: [{type: 'iconCard'}],
      group: 'offer',
    }),

    defineField({name: 'storyTagline', title: 'Tagline', type: 'localeString', group: 'story'}),
    defineField({name: 'storyHeading', title: 'Heading', type: 'localeString', group: 'story'}),
    defineField({name: 'storyParagraph', title: 'Paragraph', type: 'localeText', group: 'story'}),

    defineField({name: 'ctaHeading', title: 'Heading', type: 'localeString', group: 'cta'}),
    defineField({name: 'ctaText', title: 'Text', type: 'localeText', group: 'cta'}),
  ],
  preview: {
    prepare: () => ({title: 'About Us page'}),
  },
})
