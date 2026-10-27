// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeImageLoading from './src/plugins/rehype-image-loading.mjs';
import remarkCallouts from './src/plugins/remark-callouts.mjs';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://haibinlai.github.io',
  base: process.env.PUBLIC_BASE_PATH || '/haibinblog/',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkCallouts],
      // Parse imported WordPress HTML before applying defaults to media/embed nodes.
      rehypePlugins: [rehypeKatex, rehypeRaw, rehypeImageLoading],
    }),
  },
});
