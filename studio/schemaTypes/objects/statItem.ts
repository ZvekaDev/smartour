import {defineField, defineType} from 'sanity'

export const statItem = defineType({
  name: 'statItem',
  title: 'Stat',
  type: 'object',
  fields: [
    defineField({name: 'number', title: 'Number', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'label', title: 'Label', type: 'localeString'}),
  ],
  preview: {
    select: {number: 'number', label: 'label.en'},
    prepare: ({number, label}) => ({title: `${number} ${label}`}),
  },
})
