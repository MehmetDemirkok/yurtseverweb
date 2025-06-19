const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('SeninSifren123', 10);
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'test',
      password,
    },
  });
  console.log('Kullanıcı eklendi!');
}

main().finally(() => prisma.$disconnect()); 