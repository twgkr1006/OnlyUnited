const fs = require('fs');
const c = fs.readFileSync('e:/OnlyUnited/frontend/src/pages/PlayerDetailPage.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  // Find lines with \uXXXX in JSX attribute strings (outside {})
  if (/label=\\?'[^']*\\u[0-9a-f]{4}/i.test(l) || /sub=\\?'[^']*\\u[0-9a-f]{4}/i.test(l)) {
    console.log(i + 1, l.trim().substring(0, 100));
  }
});
console.log('Done checking');
