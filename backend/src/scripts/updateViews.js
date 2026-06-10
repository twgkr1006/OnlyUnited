const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const updates = [
  [1,312,47],[2,198,31],[3,445,62],[4,267,38],
  [5,521,89],[6,389,71],[7,234,45],
  [8,467,93],[9,356,78],[10,288,56],[11,342,67],[12,421,82],
  [13,634,112],[14,789,134],[15,456,88],
  [16,892,178],[17,1203,245],[18,567,98]
];
Promise.all(updates.map(([id,views,likes]) =>
  p.post.update({ where: { id }, data: { views, likes } })
)).then(r => {
  console.log('views/likes updated for ' + r.length + ' posts');
  p.$disconnect();
}).catch(e => { console.error(e); p.$disconnect(); });
