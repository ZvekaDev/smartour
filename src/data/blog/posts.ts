import { sanityClient } from "../../lib/sanity";

export interface BlogPost {
  slug: string;
  category: string;
  author: string;
  date: string; // ISO date
  coverGradient: string; // Tailwind gradient classes — used when there's no cover image
  title: Record<"en" | "sr" | "hu", string>;
  excerpt: Record<"en" | "sr" | "hu", string>;
  body: Record<"en" | "sr" | "hu", string[]>; // paragraphs
}

const BLOG_POSTS_QUERY = /* groq */ `
*[_type == "blogPost"] | order(date desc) {
  "slug": slug.current,
  category,
  author,
  date,
  coverGradient,
  title,
  excerpt,
  body
}`;

export const blogPosts: BlogPost[] = await sanityClient.fetch(BLOG_POSTS_QUERY);
