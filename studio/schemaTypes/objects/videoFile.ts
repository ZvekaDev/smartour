import {defineField, defineType} from 'sanity'

/** A video file uploaded directly into Sanity's asset library. */
export const videoFile = defineType({
  name: 'videoFile',
  title: 'Uploaded video file',
  type: 'object',
  fields: [
    defineField({name: 'file', title: 'Video file', type: 'file', validation: (r) => r.required()}),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {title: 'file.asset.originalFilename', caption: 'caption'},
    prepare: ({title, caption}) => ({
      title: title ?? 'Uploaded video',
      subtitle: caption ?? 'Video file',
    }),
  },
})
