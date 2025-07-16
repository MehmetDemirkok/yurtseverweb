import prisma from '../src/lib/prisma';

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: { description: { contains: 'test', mode: 'insensitive' } }
  });
  if (transactions.length === 0) {
    console.log('Silinecek test transaction kaydı bulunamadı.');
    return;
  }
  console.log('Silinecek transaction kayıtları:', transactions.map((t: any) => ({ id: t.id, description: t.description })));
  const ids = transactions.map((t: any) => t.id);
  await prisma.transaction.deleteMany({ where: { id: { in: ids } } });
  console.log('Test transaction kayıtları silindi.');
}

main().finally(() => prisma.$disconnect()); 