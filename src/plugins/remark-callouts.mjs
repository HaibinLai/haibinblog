import { visit } from 'unist-util-visit';

const CALLOUTS = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]*\n[ \t]*|[ \t]+|$)/i;

/**
 * Turn GitHub-style Markdown alerts into styled blog callouts.
 *
 * > [!NOTE]
 * > Callout content.
 */
export default function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const firstParagraph = node.children?.[0];
      const firstText = firstParagraph?.type === 'paragraph'
        ? firstParagraph.children?.[0]
        : null;

      if (firstText?.type !== 'text') return;
      const match = firstText.value.match(MARKER);
      if (!match) return;

      const type = match[1].toLowerCase();
      const remaining = firstText.value.slice(match[0].length);
      firstText.value = remaining;

      if (!remaining && firstParagraph.children.length === 1) {
        node.children.shift();
      }

      node.data = {
        ...(node.data || {}),
        hProperties: {
          ...(node.data?.hProperties || {}),
          className: ['blog-callout', `blog-callout--${type}`],
          'data-callout': type,
        },
      };

      node.children.unshift({
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['blog-callout__title'] },
        },
        children: [{ type: 'text', value: CALLOUTS[type] }],
      });
    });
  };
}
