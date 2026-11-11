const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Source-level regression guards for the virtuoso horizontal layout.
// Browser rendering at narrow widths still needs a manual smoke test.
const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('chat list places horizontal gutters inside items, not on Virtuoso scroller', () => {
  const chat = read('src/components/chat/Chat.jsx');
  const scroller = chat.match(/className="premium-chat-scrollbar ([^"]+)"/)?.[1] || '';

  assert.match(scroller, /overflow-x-hidden/);
  assert.doesNotMatch(scroller, /\bpx-\d+\b/, 'scroller padding can shift virtualized message rows');
  assert.match(chat, /className="box-border w-full min-w-0 px-3"/);
});

test('rich message rows cannot exceed the chat width and long text wraps', () => {
  const rich = read('src/components/chat/RichChatPrimitives.jsx');
  assert.match(rich, /box-border flex w-full min-w-0 max-w-full overflow-x-clip/);
  assert.match(rich, /group relative min-w-0 max-w-full break-words \[overflow-wrap:anywhere\]/);
});
