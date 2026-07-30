import {localeString} from './objects/localeString'
import {localeText} from './objects/localeText'
import {localeParagraphs} from './objects/localeParagraphs'
import {videoEmbed} from './objects/videoEmbed'
import {videoFile} from './objects/videoFile'
import {statItem} from './objects/statItem'
import {iconCard} from './objects/iconCard'
import {transportLink} from './objects/transportLink'
import {transportBlock} from './objects/transportBlock'

import {country} from './documents/country'
import {county} from './documents/county'
import {town} from './documents/town'
import {category} from './documents/category'
import {offer} from './documents/offer'
import {blogPost} from './documents/blogPost'
import {aboutUs} from './documents/aboutUs'
import {transportPage} from './documents/transportPage'
import {siteSettings} from './documents/siteSettings'

export const schemaTypes = [
  // reusable objects
  localeString,
  localeText,
  localeParagraphs,
  videoEmbed,
  videoFile,
  statItem,
  iconCard,
  transportLink,
  transportBlock,

  // taxonomy documents
  country,
  county,
  town,
  category,

  // content documents
  offer,
  blogPost,

  // singletons
  aboutUs,
  transportPage,
  siteSettings,
]

/** Document type names that should only ever have a single instance. */
export const singletonTypes = new Set(['aboutUs', 'transportPage', 'siteSettings'])
