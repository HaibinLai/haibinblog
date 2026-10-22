import { visit } from 'unist-util-visit';

/**
 * Add browser-native loading hints to images rendered from Markdown or raw HTML.
 * Existing author-provided values remain authoritative.
 */
export default function rehypeImageLoading() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;

      node.properties ??= {};
      node.properties.loading ??= 'lazy';
      node.properties.decoding ??= 'async';
    });
  };
}
