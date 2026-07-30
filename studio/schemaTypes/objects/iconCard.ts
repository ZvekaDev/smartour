import {defineField, defineType} from 'sanity'

/** A small card with an emoji icon, a title and body text — used for "What We Offer" etc. */
export const iconCard = defineType({
  name: 'iconCard',
  title: 'Icon card',
  type: 'object',
  fields: [
    defineField({name: 'icon', title: 'Icon (emoji)', type: 'string'}),
    defineField({name: 'title', title: 'Title', type: 'localeString'}),
    defineField({name: 'text', title: 'Text', type: 'localeText'}),
  ],
  preview: {
    select: {icon: 'icon', title: 'title.en'},
    prepare: ({icon, title}) => ({title: `${icon ?? ''} ${title}`.trim()}),
  },
})
