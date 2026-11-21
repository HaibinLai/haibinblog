import assert from 'node:assert/strict';
import test from 'node:test';
import rehypeLegacyMath from './rehype-legacy-math.mjs';

test('converts imported WordPress formula tags without changing other code', () => {
  const inline = { type: 'element', tagName: 'code', properties: { className: ['mathjax-inline', 'language-mathjax'] }, children: [] };
  const block = { type: 'element', tagName: 'code', properties: { className: ['language-katex'] }, children: [] };
  const other = { type: 'element', tagName: 'code', properties: { className: ['language-js'] }, children: [] };
  const tree = { type: 'root', children: [inline, block, other] };

  rehypeLegacyMath()(tree);

  assert.deepEqual(inline.properties.className, ['math-inline']);
  assert.deepEqual(block.properties.className, ['language-math']);
  assert.deepEqual(other.properties.className, ['language-js']);
});
