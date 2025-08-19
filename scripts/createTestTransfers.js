/*
  10 adet test transferi oluşturur.
  Kullanım: node scripts/createTestTransfers.js [--company <id>]
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function pickOneOrNull(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

async function main() {
  const args = process.argv.slice(2);
  const companyIdArgIndex = args.indexOf('--company');
  let targetCompanyId = null;
  if (companyIdArgIndex !== -1 && args[companyIdArgIndex + 1]) {
    targetCompanyId = parseInt(args[companyIdArgIndex + 1], 10);
  }

  let company = null;
  if (targetCompanyId) {
    company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
    if (!company) {
      throw new Error(`Belirtilen companyId bulunamadı: ${targetCompanyId}`);
    }
  } else {
    company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Demo Şirket',
          email: `demo_${Date.now()}@example.com`,
          phone: '+90 212 000 0000',
          address: 'İstanbul',
          city: 'İstanbul',
          country: 'Türkiye',
          status: 'ACTIVE',
        },
      });
      console.log(`Şirket oluşturuldu: ${company.name} (#${company.id})`);
    }
  }

  console.log(`Hedef şirket: ${company.name} (#${company.id})`);

  const [araclar, soforler, cariler, tedarikciler] = await Promise.all([
    prisma.arac.findMany({ where: { companyId: company.id } }),
    prisma.sofor.findMany({ where: { companyId: company.id } }),
    prisma.cari.findMany({ where: { companyId: company.id } }),
    prisma.tedarikci.findMany({ where: { companyId: company.id } }),
  ]);

  const kalkisYerleri = [
    'İstanbul Havalimanı',
    'Sabiha Gökçen Havalimanı',
    'Ankara Esenboğa',
    'İzmir Adnan Menderes',
    'Antalya Havalimanı',
  ];
  const varisYerleri = [
    'İstanbul Merkez',
    'Ankara Merkez',
    'İzmir Merkez',
    'Antalya Merkez',
    'Bursa Merkez',
  ];

  const created = [];
  for (let i = 0; i < 10; i++) {
    const kalkisYeri = kalkisYerleri[Math.floor(Math.random() * kalkisYerleri.length)];
    const varisYeri = varisYerleri[Math.floor(Math.random() * varisYerleri.length)];
    const kalkisTarihi = new Date();
    kalkisTarihi.setDate(kalkisTarihi.getDate() + (i + 1)); // gelecek günler
    const kalkisSaati = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const yolcuSayisi = Math.floor(Math.random() * 4) + 1;

    const arac = await pickOneOrNull(araclar);
    const sofor = await pickOneOrNull(soforler);
    const cari = await pickOneOrNull(cariler);
    const tedarikci = Math.random() > 0.7 ? await pickOneOrNull(tedarikciler) : null;

    const yolcularCreate = Array.from({ length: yolcuSayisi }).map((_, idx) => ({
      ad: `Yolcu${i + 1}-${idx + 1}`,
      soyad: 'Test',
      telefon: `05${Math.floor(Math.random() * 9) + 1}${Math.floor(10000000 + Math.random() * 89999999)}`,
      ucusSaati: kalkisSaati,
      ucusTkKodu: `TK${1000 + Math.floor(Math.random() * 9000)}`,
    }));

    const transfer = await prisma.transfer.create({
      data: {
        kalkisYeri,
        varisYeri,
        kalkisSaati,
        kalkisTarihi,
        yolcuSayisi,
        aracId: arac ? arac.id : null,
        soforId: sofor ? sofor.id : null,
        durum: 'BEKLEMEDE',
        notlar: `Script ile eklenen demo transfer ${i + 1}`,
        fiyat: Math.floor(Math.random() * 900) + 100,
        tahsisli: Math.random() > 0.5,
        cariId: cari ? cari.id : null,
        tedarikciId: tedarikci ? tedarikci.id : null,
        tedarikciyeYaptirilacak: Boolean(tedarikci),
        companyId: company.id,
        yolcular: { create: yolcularCreate },
      },
    });

    created.push(transfer);
    console.log(`Transfer oluşturuldu #${transfer.id}: ${kalkisYeri} → ${varisYeri} (${kalkisSaati})`);
  }

  console.log(`\nToplam ${created.length} transfer oluşturuldu.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


