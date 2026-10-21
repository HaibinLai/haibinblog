import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().default('Research'),
    categories: z.array(z.string()).default([]),
    author: z.string().default('Haibin Lai'),
    draft: z.boolean().default(false),
    slug: z.string().optional(),
    legacySlug: z.string().optional(),
    oldSlugs: z.array(z.string()).default([]),
    wordpressId: z.number().int().optional(),
    sourceUrl: z.string().url().optional(),
    featuredImage: z.string().url().optional(),
    commentCount: z.number().int().nonnegative().default(0),
    viewCount: z.number().int().nonnegative().default(0),
    likeCount: z.number().int().nonnegative().default(0),
    dislikeCount: z.number().int().nonnegative().default(0),
    showCitation: z.boolean().default(true),
    importedFromWordPress: z.boolean().default(false),
  }),
});

const moments = defineCollection({
  loader: glob({ base: './src/content/moments', pattern: '**/*.md' }),
  schema: z.object({
    publishedAt: z.coerce.date(),
    images: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, moments };
