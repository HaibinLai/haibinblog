import { visit } from 'unist-util-visit';

/** Map formula code tags imported from WordPress to the classes rehype-katex understands. */
export default function rehypeLegacyMath() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'code') return;

      const classes = node.properties?.className;
      if (!Array.isArray(classes)) return;

      if (classes.includes('mathjax-inline')) {
        node.properties.className = ['math-inline'];
      } else if (classes.includes('language-katex')) {
        node.properties.className = ['language-math'];
      }
    });
  };
}
