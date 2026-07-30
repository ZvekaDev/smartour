// One-off migration: pushes the site's existing static JSON/TS data into
// Sanity as documents matching studio/schemaTypes. Safe to re-run — every
// document uses a deterministic _id and is written with createOrReplace, so
// reruns update in place rather than duplicating content.
//
// Usage: node --env-file=.env scripts/migrate-to-sanity.mjs

import {createClient} from '@sanity/client';

import offersData from '../src/data/generated/offers.json' with {type: 'json'};
import taxonomyData from '../src/data/generated/taxonomy.json' with {type: 'json'};
import transportData from '../src/data/generated/transport.json' with {type: 'json'};
import {extraCategories} from '../src/data/categoriesExtra.ts';
import {aboutUs} from '../src/data/aboutUs.ts';
import {partners, siteContact, socialLinks} from '../src/data/partners.ts';
import {blogPosts} from '../src/data/blog/posts.ts';

const LOCALES = ['en', 'sr', 'hu'];

// Mirrors src/lib/offers.ts categoryIcon — kept as a literal copy here so this
// migration script has no dependency on Astro's Vite-only JSON import syntax.
const categoryIcon = {
  'events-and-festivals': '🎉',
  'religious-and-spiritual-tourism': '⛪',
  'educational-and-research-tourism': '🎓',
  restaurants: '🍽️',
  'industrial-and-technical-heritage': '🏭',
  'active-and-sports-tourism': '🚴',
  'food-and-wine-producers': '🍷',
  'creative-and-experience-based-tourism': '🎨',
  'health-and-wellness-tourism': '💆',
  'eco-and-sustainable-tourism-initiatives': '🌿',
  'tourism-information-infrastructure': 'ℹ️',
  'smart-mobility-and-green-transport': '🚲',
  'digital-and-smart-infrastructure': '📡',
  'accessible-tourism-infrastructure': '♿',
  'local-crafts-and-intangible-heritage': '🧵',
  'cross-border-routes-and-twin-offers': '🌉',
  'film-induced-tourism-locations': '🎬',
  accommodations: '🛏️',
};

const {SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN} = process.env;
if (!SANITY_PROJECT_ID || !SANITY_API_TOKEN) {
  console.error(
    'Missing SANITY_PROJECT_ID or SANITY_API_TOKEN.\n' +
      'Copy .env.example to .env, fill in a write-enabled token, then run:\n' +
      '  node --env-file=.env scripts/migrate-to-sanity.mjs',
  );
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: SANITY_API_TOKEN,
  useCdn: false,
});

function localeObject(record) {
  return {en: record.en, sr: record.sr, hu: record.hu};
}

function slugField(value) {
  return {_type: 'slug', current: value};
}

function ref(id) {
  return {_type: 'reference', _ref: id};
}

/** Commits an array of documents in fixed-size batches via a transaction. */
async function writeAll(label, docs, batchSize = 50) {
  let written = 0;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const tx = client.transaction();
    for (const doc of batch) tx.createOrReplace(doc);
    await tx.commit();
    written += batch.length;
    process.stdout.write(`\r${label}: ${written}/${docs.length}`);
  }
  console.log('');
}

async function main() {
  // --- Taxonomy -----------------------------------------------------------
  const countries = taxonomyData.countries.map((c) => ({
    _id: `country-${c.slug}`,
    _type: 'country',
    names: localeObject(c.names),
    slug: slugField(c.slug),
  }));
  await writeAll('Countries', countries);

  const counties = taxonomyData.counties.map((c) => ({
    _id: `county-${c.slug}`,
    _type: 'county',
    names: localeObject(c.names),
    slug: slugField(c.slug),
    country: ref(`country-${c.countrySlug}`),
  }));
  await writeAll('Counties', counties);

  const towns = taxonomyData.towns.map((t) => ({
    _id: `town-${t.slug}`,
    _type: 'town',
    names: localeObject(t.names),
    slug: slugField(t.slug),
    county: ref(`county-${t.countySlug}`),
  }));
  await writeAll('Towns', towns);

  const allCategories = [...taxonomyData.categories, ...extraCategories];
  const categories = allCategories.map((c) => ({
    _id: `category-${c.slug}`,
    _type: 'category',
    names: localeObject(c.names),
    slug: slugField(c.slug),
    icon: categoryIcon[c.slug] ?? null,
  }));
  await writeAll('Categories', categories);

  // --- Offers ---------------------------------------------------------------
  const offers = offersData.map((o) => ({
    _id: `offer-${o.id}`,
    _type: 'offer',
    title: localeObject(o.title),
    slugs: {
      en: slugField(o.slugs.en),
      sr: slugField(o.slugs.sr),
      hu: slugField(o.slugs.hu),
    },
    description: localeObject(o.description),
    category: ref(`category-${o.category}`),
    photos: [],
    videos: [],
    country: ref(`country-${o.countrySlug}`),
    county: o.countySlug ? ref(`county-${o.countySlug}`) : undefined,
    town: o.townSlug ? ref(`town-${o.townSlug}`) : undefined,
    address: o.address ?? undefined,
    zip: o.zip ?? undefined,
    location: o.lat != null && o.lng != null ? {_type: 'geopoint', lat: o.lat, lng: o.lng} : undefined,
    phone: o.phone ?? undefined,
    email: o.email ?? undefined,
    website: o.website ?? undefined,
    facebook: o.facebook ?? undefined,
    instagram: o.instagram ?? undefined,
    tiktok: o.tiktok ?? undefined,
  }));
  await writeAll('Offers', offers);

  // --- Blog posts -------------------------------------------------------
  const posts = blogPosts.map((p) => ({
    _id: `blogPost-${p.slug}`,
    _type: 'blogPost',
    title: localeObject(p.title),
    slug: slugField(p.slug),
    excerpt: localeObject(p.excerpt),
    body: {en: p.body.en, sr: p.body.sr, hu: p.body.hu},
    category: p.category,
    author: p.author,
    date: p.date,
    coverGradient: p.coverGradient,
  }));
  await writeAll('Blog posts', posts);

  // --- About Us (singleton) ----------------------------------------------
  await client.createOrReplace({
    _id: 'aboutUs',
    _type: 'aboutUs',
    heroTitle: localeObject(aboutUs.heroTitle),
    heroSubtitle: localeObject(aboutUs.heroSubtitle),
    whoWeAreTagline: localeObject(aboutUs.whoWeAreTagline),
    whoWeAreHeading: localeObject(aboutUs.whoWeAreHeading),
    whoWeAreParagraphs: {
      en: aboutUs.whoWeAreParagraphs.en,
      sr: aboutUs.whoWeAreParagraphs.sr,
      hu: aboutUs.whoWeAreParagraphs.hu,
    },
    stats: aboutUs.stats.map((s) => ({
      _type: 'statItem',
      _key: s.label.en.toLowerCase().replace(/\s+/g, '-'),
      number: s.number,
      label: localeObject(s.label),
    })),
    missionTagline: localeObject(aboutUs.missionTagline),
    missionParagraph: localeObject(aboutUs.missionParagraph),
    visionTagline: localeObject(aboutUs.visionTagline),
    visionParagraph: localeObject(aboutUs.visionParagraph),
    offerHeading: localeObject(aboutUs.offerHeading),
    offerSubheading: localeObject(aboutUs.offerSubheading),
    offerCards: aboutUs.offerCards.map((c, i) => ({
      _type: 'iconCard',
      _key: `card-${i}`,
      icon: c.icon,
      title: localeObject(c.title),
      text: localeObject(c.text),
    })),
    storyTagline: localeObject(aboutUs.storyTagline),
    storyHeading: localeObject(aboutUs.storyHeading),
    storyParagraph: localeObject(aboutUs.storyParagraph),
    ctaHeading: localeObject(aboutUs.ctaHeading),
    ctaText: localeObject(aboutUs.ctaText),
  });
  console.log('About Us page: done');

  // --- Transport page (singleton) -----------------------------------------
  const t = transportData;
  await client.createOrReplace({
    _id: 'transportPage',
    _type: 'transportPage',
    heroTitle: {en: t.en.hero.title, sr: t.sr.hero.title, hu: t.hu.hero.title},
    heroSubtitle: {en: t.en.hero.subtitle, sr: t.sr.hero.subtitle, hu: t.hu.hero.subtitle},
    quickCards: t.en.quickCards.map((card, i) => ({
      _type: 'quickCard',
      _key: `quick-${i}`,
      icon: card.icon,
      anchor: card.anchor,
      title: {en: t.en.quickCards[i].title, sr: t.sr.quickCards[i].title, hu: t.hu.quickCards[i].title},
      text: {en: t.en.quickCards[i].text, sr: t.sr.quickCards[i].text, hu: t.hu.quickCards[i].text},
    })),
    blocks: t.en.blocks.map((block, bi) => ({
      _type: 'transportBlock',
      _key: `block-${bi}`,
      anchorId: block.id,
      icon: block.icon,
      title: {en: t.en.blocks[bi].title, sr: t.sr.blocks[bi].title, hu: t.hu.blocks[bi].title},
      subtitle: {en: t.en.blocks[bi].subtitle, sr: t.sr.blocks[bi].subtitle, hu: t.hu.blocks[bi].subtitle},
      links: block.links.map((link, li) => ({
        _type: 'transportLink',
        _key: `link-${bi}-${li}`,
        icon: link.icon,
        href: link.href,
        text: {
          en: t.en.blocks[bi].links[li].text,
          sr: t.sr.blocks[bi].links[li].text,
          hu: t.hu.blocks[bi].links[li].text,
        },
        description: {
          en: t.en.blocks[bi].links[li].description,
          sr: t.sr.blocks[bi].links[li].description,
          hu: t.hu.blocks[bi].links[li].description,
        },
      })),
    })),
    ctaTitle: {en: t.en.cta.title, sr: t.sr.cta.title, hu: t.hu.cta.title},
    ctaText: {en: t.en.cta.text, sr: t.sr.cta.text, hu: t.hu.cta.text},
    ctaPrimaryText: {en: t.en.cta.primaryText, sr: t.sr.cta.primaryText, hu: t.hu.cta.primaryText},
    ctaSecondaryText: {en: t.en.cta.secondaryText, sr: t.sr.cta.secondaryText, hu: t.hu.cta.secondaryText},
  });
  console.log('Transport page: done');

  // --- Site settings (singleton) ------------------------------------------
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteContact: {
      email: siteContact.email,
      phone: siteContact.phone,
      location: localeObject(siteContact.location),
    },
    socialLinks: socialLinks.map((s, i) => ({
      _type: 'socialLink',
      _key: `social-${i}`,
      label: s.label,
      href: s.href,
    })),
    partners: partners.map((p, i) => ({
      _type: 'partner',
      _key: `partner-${i}`,
      name: localeObject(p.name),
      email: p.email,
    })),
  });
  console.log('Site settings: done');

  console.log('\nMigration complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
