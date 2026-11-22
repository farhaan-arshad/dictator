export function normalizeWords(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []);
}

export function splitTextIntoSegments(text, wordsPerSection = 6) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const chunks = [];
  const tokens = clean.match(/\S+/g) || [];
  const count = Math.min(20, Math.max(1, Number(wordsPerSection) || 6));

  for (let index = 0; index < tokens.length; index += count) {
    const chunk = tokens.slice(index, index + count);
    const chunkText = chunk.join(' ');
    chunks.push({
      text: chunkText,
      words: normalizeWords(chunkText),
    });
  }

  return chunks;
}

export function textForSpeech(text) {
  return text
    .replace(/\.{3}/g, ' ellipsis ')
    .replace(/([.!?])(?=\s|$)/g, match => ({
      '.': ' period',
      '!': ' exclamation mark',
      '?': ' question mark',
    })[match])
    .replace(/,/g, ' comma')
    .replace(/;/g, ' semicolon')
    .replace(/:/g, ' colon')
    .replace(/—/g, ' em dash ')
    .replace(/\(/g, ' open parenthesis ')
    .replace(/\)/g, ' close parenthesis ')
    .replace(/"/g, ' quote ')
    .replace(/\s+/g, ' ')
    .trim();
}
