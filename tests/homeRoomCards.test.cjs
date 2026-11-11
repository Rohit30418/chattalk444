const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Guard the prop contract that previously caused the homepage's active-room
// cards to render nothing even when /api/rooms returned valid rooms.
test('homepage passes each room using the RoomCard prop contract', () => {
  const home = fs.readFileSync(path.join(__dirname, '../src/Home/ActiveRooms.jsx'), 'utf8');
  const card = fs.readFileSync(path.join(__dirname, '../src/room/components/RoomCard.jsx'), 'utf8');

  assert.match(card, /const RoomCard = \(\{ roomdata \}\)/);
  assert.match(home, /<RoomCard\s+key=\{room\.id \|\| room\._id\}\s+roomdata=\{room\}\s*\/>/);
  assert.doesNotMatch(home, /<RoomCard[^>]*\sroom=\{room\}/);
});
