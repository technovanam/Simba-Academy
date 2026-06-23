import { prisma } from './src/config/database.ts';
async function clean() {
  const notifs = await prisma.studentNotification.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  const seen = new Set();
  let deleted = 0;
  for (const n of notifs) {
    if (n.title === 'New story book available') {
        const key = n.userId + '|' + n.storyBookId + '|' + n.fileId + '|' + n.title + '|' + n.message;
        if (seen.has(key)) {
          await prisma.studentNotification.delete({ where: { id: n.id } });
          deleted++;
        } else {
          seen.add(key);
        }
    }
  }
  console.log('Deleted ' + deleted + ' duplicate notifications');
}
clean().catch(console.error).finally(() => prisma.$disconnect());
