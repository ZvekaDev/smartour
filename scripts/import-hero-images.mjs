import { createClient } from "@sanity/client";
import fs from "node:fs";

const projectId = process.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_TOKEN;
const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token, useCdn: false });

async function uploadAsset(filePath) {
  const asset = await client.assets.upload("image", fs.createReadStream(filePath));
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

const home = await uploadAsset("/tmp/hero_images/home.jpg");
const offers = await uploadAsset("/tmp/hero_images/offers.jpg");
const blogs = await uploadAsset("/tmp/hero_images/blogs.jpg");
const contact = await uploadAsset("/tmp/hero_images/contact.jpg");
const transport = await uploadAsset("/tmp/hero_images/transport.jpg");
const aboutUsImg = await uploadAsset("/tmp/hero_images/aboutus.jpg");

await client
  .patch("siteSettings")
  .setIfMissing({ pageHeroes: {} })
  .set({
    "pageHeroes.home": home,
    "pageHeroes.offers": offers,
    "pageHeroes.blogs": blogs,
    "pageHeroes.contact": contact,
  })
  .commit();
console.log("OK: siteSettings.pageHeroes (home/offers/blogs/contact)");

await client.patch("transportPage").set({ heroImage: transport }).commit();
console.log("OK: transportPage.heroImage");

await client.patch("aboutUs").set({ heroImage: aboutUsImg }).commit();
console.log("OK: aboutUs.heroImage");
