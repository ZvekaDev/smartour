import {defineField, defineType} from 'sanity'

/** Singleton document — contact details, social links and partner orgs shown in the footer/contact page. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteContact',
      title: 'Site contact',
      type: 'object',
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
