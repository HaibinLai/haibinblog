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
    language: z.enum(['zh-CN', 'en']).optional(),
    translationKey: z.string().trim().min(1).optional(),
    wordpressId: z.number().int().optional(),
    sourceUrl: z.string().url().optional(),
    cardImage: z.string().url().optional(),
    featuredImage: z.string().url().optional(),
    featuredRank: z.number().int().min(1).max(3).optional(),
    featuredTitle: z.string().trim().min(1).optional(),
    featuredLabel: z.string().trim().min(1).optional(),
    featuredBannerImage: z.string().trim().min(1).optional(),
    imageMirrorIncludeHosts: z.array(z.string().trim().min(1)).default([]),
    imageMirrorOpaqueWebpQuality: z.number().int().min(1).max(100).optional(),
    commentCount: z.number().int().nonnegative().default(0),
    viewCount: z.number().int().nonnegative().default(0),
    likeCount: z.number().int().nonnegative().default(0),
    dislikeCount: z.number().int().nonnegative().default(0),
    comments: z.array(z.object({
      author: z.string(),
      replyTo: z.string().default(''),
      content: z.string(),
    })).default([]),
    showCitation: z.boolean().default(true),
    importedFromWordPress: z.boolean().default(false),
  }).superRefine((data, context) => {
    if (data.translationKey && !data.language) {
      context.addIssue({
        code: 'custom',
        path: ['language'],
        message: 'language is required when translationKey is set',
      });
    }
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
