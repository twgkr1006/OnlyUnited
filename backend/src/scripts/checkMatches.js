const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const finished = await p.match.count({ where: { status: 'FINISHED' } });
  const upcoming = await p.match.count({ where: { status: { in: ['TIMED', 'SCHEDULED'] } } });
  console.log('FINISHED:', finished, '/ UPCOMING:', upcoming);
  await p.$disconnect();
}
main();
