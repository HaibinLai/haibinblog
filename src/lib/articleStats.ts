/**
 * Match the WordPress theme's article word count:
 * Chinese characters plus ASCII words, excluding links, URLs and markup.
 */
export function countArticleWords(source: string): number {
  let content = source;

  // WordPress removes linked text entirely before counting. Do the same for
  // both imported HTML and Markdown links.
  content = content.replace(/<a\s+[^>]*>.*?<\/a>/gis, ' ');
  content = content.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  content = content.replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
  content = content.replace(/\[[^\]]*\]\[[^\]]*\]/g, ' ');

  // Remove HTML tags, shortcodes, URLs and email addresses before counting.
  content = content.replace(/<[^>]*>/g, ' ');
  content = content.replace(/\[[\s\S]*?\]/g, ' ');
  content = content.replace(/https?:\/\/[^\s)]+/gi, ' ');
  content = content.replace(/www\.[^\s)]+/gi, ' ');
  content = content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ');

  const chineseCharacters = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const englishContent = content
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .match(/[A-Za-z0-9_]+/g);
  const englishWords = englishContent?.length ?? 0;

  return chineseCharacters + englishWords;
}
