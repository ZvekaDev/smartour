import {defineField, defineType} from 'sanity'

/** Singleton document — contact details, social links, partner orgs, page hero
 * images and marketing copy for pages that don't have their own document. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    {name: 'heroes', title: 'Page hero images', default: true},
    {name: 'copyHome', title: 'Home page copy'},
    {name: 'copyOffers', title: 'Offers page copy'},
    {name: 'copyBlogs', title: 'Blogs page copy'},
    {name: 'copyContact', title: 'Contact page copy'},
    {name: 'copyFooter', title: 'Footer copy'},
    {name: 'contact', title: 'Contact & social'},
  ],
  fields: [
    defineField({
      name: 'pageHeroes',
      title: 'Page hero background images',
      description: 'Background photo for pages that don\'t have their own document (Home, Offers, Blogs, Contact — About Us and Transport have their own hero image field).',
      type: 'object',
      group: 'heroes',
      fields: [
        {name: 'home', title: 'Home', type: 'image', options: {hotspot: true}},
        {name: 'offers', title: 'Offers', type: 'image', options: {hotspot: true}},
        {name: 'blogs', title: 'Blogs', type: 'image', options: {hotspot: true}},
        {name: 'contact', title: 'Contact', type: 'image', options: {hotspot: true}},
      ],
    }),
    defineField({
      name: 'homeCopy',
      title: 'Home page text',
      type: 'object',
      group: 'copyHome',
      fields: [
        {name: 'heroTagline', title: 'Hero tagline (small pill above title)', type: 'localeString'},
        {name: 'heroTitle', title: 'Hero title', type: 'localeString'},
        {name: 'heroSubtitle', title: 'Hero subtitle', type: 'localeString'},
        {name: 'offersHeading', title: '"Offers" section heading', type: 'localeString'},
        {name: 'storiesHeading', title: '"Stories and blogs" section heading', type: 'localeString'},
        {name: 'joinHeading', title: 'Join-the-community CTA heading', type: 'localeString'},
        {name: 'joinText', title: 'Join-the-community CTA text', type: 'localeText'},
      ],
    }),
    defineField({
      name: 'offersCopy',
      title: 'Offers page text',
      type: 'object',
      group: 'copyOffers',
      fields: [
        {name: 'heroTitle', title: 'Hero title', type: 'localeString'},
        {name: 'heroSubtitle', title: 'Hero subtitle', type: 'localeString'},
      ],
    }),
    defineField({
      name: 'blogsCopy',
      title: 'Blogs page text',
      type: 'object',
      group: 'copyBlogs',
      fields: [
        {name: 'heroTitle', title: 'Hero title', type: 'localeString'},
        {name: 'heroSubtitle', title: 'Hero subtitle', type: 'localeString'},
        {name: 'featuredHeading', title: '"Featured" heading', type: 'localeString'},
        {name: 'allPostsHeading', title: '"All Posts" heading', type: 'localeString'},
      ],
    }),
    defineField({
      name: 'contactCopy',
      title: 'Contact page text',
      type: 'object',
      group: 'copyContact',
      fields: [
        {name: 'heroTitle', title: 'Hero title', type: 'localeString'},
        {name: 'heroSubtitle', title: 'Hero subtitle', type: 'localeString'},
        {name: 'emailCardTitle', title: '"Email Us" card title', type: 'localeString'},
        {name: 'emailCardText', title: '"Email Us" card text', type: 'localeString'},
        {name: 'callCardTitle', title: '"Call Us" card title', type: 'localeString'},
        {name: 'callCardText', title: '"Call Us" card text', type: 'localeString'},
        {name: 'visitCardTitle', title: '"Visit Us" card title', type: 'localeString'},
        {name: 'visitCardText', title: '"Visit Us" card text', type: 'localeString'},
        {name: 'formHeading', title: 'Form heading', type: 'localeString'},
        {name: 'formText', title: 'Form intro text', type: 'localeText'},
      ],
    }),
    defineField({
      name: 'footerCopy',
      title: 'Footer text',
      type: 'object',
      group: 'copyFooter',
      fields: [
        {name: 'tagline', title: 'Brand tagline (under logo)', type: 'localeText'},
        {name: 'quote', title: 'Pull-quote (italic, above disclaimer)', type: 'localeString'},
        {name: 'disclaimer', title: 'EU funding disclaimer paragraph', type: 'localeText'},
      ],
    }),
    defineField({
      name: 'siteContact',
      title: 'Site contact',
      type: 'object',
      group: 'contact',
      fields: [
        {name: 'email', title: 'Email', type: 'string'},
        {name: 'phone', title: 'Phone', type: 'string'},
        {name: 'location', title: 'Location', type: 'localeString'},
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'contact',
      of: [
        {
          type: 'object',
          name: 'socialLink',
          fields: [
            {name: 'label', title: 'Label', type: 'string'},
            {name: 'href', title: 'URL', type: 'url'},
          ],
        },
      ],
    }),
    defineField({
      name: 'partners',
      title: 'Partner organizations',
      description: 'Shown in the footer\'s "Contact Us" column.',
      type: 'array',
      group: 'contact',
      of: [
        {
          type: 'object',
          name: 'partner',
          fields: [
            {name: 'name', title: 'Name', type: 'localeString'},
            {name: 'email', title: 'Email', type: 'string'},
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site settings'}),
  },
})
