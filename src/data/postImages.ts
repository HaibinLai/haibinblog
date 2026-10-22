import type { CollectionEntry } from 'astro:content';

const FALLBACK_IMAGE = 'images/blog-cover.jpg';

const firstBodyImage = (post: CollectionEntry<'posts'>) => (
  post.body?.match(/<img\b[^>]*?\bsrc=["']([^"']+)/i)?.[1]
);

export const resolveImageSource = (source: string, base: string) => {
  if (/^(?:https?:)?\/\//i.test(source) || source.startsWith('data:')) return source;
  if (source.startsWith(base)) return source;
  return `${base}${source.replace(/^\/+/, '')}`;
};

export const postCardImage = (post: CollectionEntry<'posts'>, base: string) => resolveImageSource(
  post.data.cardImage
    ?? post.data.featuredBannerImage
    ?? post.data.featuredImage
    ?? firstBodyImage(post)
    ?? FALLBACK_IMAGE,
  base,
);

export const postFeaturedImage = (post: CollectionEntry<'posts'>, base: string) => resolveImageSource(
  post.data.featuredBannerImage
    ?? post.data.featuredImage
    ?? post.data.cardImage
    ?? firstBodyImage(post)
    ?? FALLBACK_IMAGE,
  base,
);
