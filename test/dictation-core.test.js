import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWords, splitTextIntoSegments, textForSpeech } from '../src/dictation-core.js';

test('splits text into exact requested sections', () => {
  const segments = splitTextIntoSegments('one two three four five six seven', 3);
  assert.equal(segments.length, 3);
  assert.deepEqual(segments.map(segment => segment.text), ['one two three', 'four five six', 'seven']);
});

test('normalizes words for exact highlight matching', () => {
  assert.deepEqual(normalizeWords('Hello, WORLD! 123'), ['hello', 'world', '123']);
});

test('expands dictation punctuation', () => {
  const spoken = textForSpeech('Hello, world! Are we ready?');
  assert.match(spoken, /comma/);
  assert.match(spoken, /exclamation mark/);
  assert.match(spoken, /question mark/);
});
