import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Articles are PDFs listed on /artikler (and the three newest on the home page).
 * To add one: append an entry to src/content/articles.json. `order` controls the
 * position in the list (the original site is curated, not strictly by year).
 */
const articles = defineCollection({
  loader: file('src/content/articles.json'),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    summary: z.string(),
    authors: z.string(),
    year: z.number().int().min(1990).max(2100),
    pdf: z.url(),
  }),
});

/** "Nyheter" cards on the home page. `image` is optional (text-only variant). */
const news = defineCollection({
  loader: file('src/content/news.json'),
  schema: ({ image }) =>
    z
      .object({
        order: z.number().int(),
        title: z.string(),
        body: z.string(),
        image: image().optional(),
        imageAlt: z.string().optional(),
      })
      .refine((n) => !n.image || n.imageAlt !== undefined, {
        message: 'News items with an image need imageAlt (use "" if purely decorative).',
      }),
});

export const collections = { articles, news };
