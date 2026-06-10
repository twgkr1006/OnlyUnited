const fs = require('fs');
const c = fs.readFileSync('e:/OnlyUnited/frontend/src/pages/PlayerDetailPage.tsx', 'utf8');
// Find 'label=' followed by quote then backslash-like char
const match = c.match(/label='(.)u[0-9a-f]{4}/i);
if (match) {
  const ch = match[1];
  console.log('Char before "u":', ch, '| codePoint:', ch.codePointAt(0), '| hex:', ch.codePointAt(0).toString(16));
  console.log('Is backslash (005C):', ch.codePointAt(0) === 0x5C);
  console.log('Is Won sign (20A9):', ch.codePointAt(0) === 0x20A9);
} else {
  console.log('No match found');
}
