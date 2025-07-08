import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm konaklama kayıtlarını listele
export async function GET() {
  // Tüm konaklama kayıtlarını çek
  const records = await prisma.accommodation.findMany();
  // Her konaklama için ilgili Sale kaydı var mı kontrol et
  const recordsWithStatus = await Promise.all(records.map(async (record) => {
    const sale = await prisma.sale.findFirst({ where: { accommodationId: record.id } });
    return { ...record, faturaEdildi: !!sale };
  }));
  return NextResponse.json(recordsWithStatus);
}

// Yeni konaklama kaydı ekle
export async function POST(request: Request) {
  const data = await request.json();
  try {
    console.log('POST /api/accommodation başladı', { dataType: Array.isArray(data) ? 'array' : 'object' });
    
    // Kullanıcı bilgilerini al
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
        console.log('Token doğrulandı, userId:', userId);
      } catch (e) {
        console.error('Token çözme hatası:', e);
      }
    }

    if (Array.isArray(data)) {
      // Toplu kayıt ekleme
      console.log(`Toplu kayıt ekleme başladı, ${data.length} kayıt`);
      // Her kayıtta faturaEdildi alanı yoksa false olarak ekle
      const dataWithFatura = data.map((record) => ({
        ...record,
        faturaEdildi: typeof record.faturaEdildi === 'boolean' ? record.faturaEdildi : false
      }));
      const createdRecords = await prisma.$transaction(async (tx) => {
        const records = [];
        for (const record of dataWithFatura) {
          console.log('Kayıt oluşturuluyor:', { adiSoyadi: record.adiSoyadi });
          const createdRecord = await tx.accommodation.create({ data: record });
          records.push(createdRecord);
          
          // Her kayıt için finans işlemi oluştur
          if (record.organizasyonAdi && record.kurumCari) {
            const totalAmount = record.toplamUcret || (record.gecelikUcret * (record.numberOfNights || 1));
            console.log('Finans işlemi oluşturuluyor:', { 
              kurumCari: record.kurumCari, 
              organizasyonAdi: record.organizasyonAdi,
              amount: totalAmount 
            });
            await tx.transaction.create({
              data: {
                type: 'SATIS',
                description: `${record.kurumCari} | ${record.organizasyonAdi} - ${record.adiSoyadi} (Konaklama)`,
                amount: totalAmount,
                date: new Date().toISOString().slice(0, 10),
                userId: userId
              }
            });
          }
        }
        return records;
      });
      console.log('Toplu kayıt ekleme tamamlandı');
      return NextResponse.json(createdRecords);
    } else {
      // Tek kayıt ekleme
      console.log('Tek kayıt ekleme başladı:', { adiSoyadi: data.adiSoyadi });
      // faturaEdildi alanı yoksa false olarak ekle
      const dataWithFatura = {
        ...data,
        faturaEdildi: typeof data.faturaEdildi === 'boolean' ? data.faturaEdildi : false
      };
      const record = await prisma.$transaction(async (tx) => {
        const createdRecord = await tx.accommodation.create({ data: dataWithFatura });
        console.log('Kayıt oluşturuldu, ID:', createdRecord.id);
        
        // Finans işlemi oluştur
        if (dataWithFatura.organizasyonAdi && dataWithFatura.kurumCari) {
          const totalAmount = dataWithFatura.toplamUcret || (dataWithFatura.gecelikUcret * (dataWithFatura.numberOfNights || 1));
          console.log('Finans işlemi oluşturuluyor:', { 
            kurumCari: data.kurumCari, 
            organizasyonAdi: data.organizasyonAdi,
            amount: totalAmount 
          });
          await tx.transaction.create({
            data: {
              type: 'SATIS',
              description: `${data.kurumCari} | ${data.organizasyonAdi} - ${data.adiSoyadi} (Konaklama)`,
              amount: totalAmount,
              date: new Date().toISOString().slice(0, 10),
              userId: userId
            }
          });
        }
        
        return createdRecord;
      });
      console.log('Tek kayıt ekleme tamamlandı');
      return NextResponse.json(record);
    }
  } catch (error: unknown) {
    console.error('POST /api/accommodation hatası:', error);
    if (error instanceof Error) {
      console.error('Hata detayları:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json({ 
        error: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Kayıt güncelle (PATCH)
export async function PATCH(request: Request) {
  const data = await request.json();
  const { id, ...updateData } = data;
  if (!id) {
    return NextResponse.json({ error: 'ID zorunlu' }, { status: 400 });
  }
  try {
    // Kullanıcı bilgilerini al
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch (e) {
        console.error('Token çözme hatası:', e);
      }
    }

    // Mevcut kaydı al
    const existingRecord = await prisma.accommodation.findUnique({
      where: { id: Number(id) }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    // Kaydı güncelle ve ilgili finans kaydını da güncelle
    const updated = await prisma.$transaction(async (tx) => {
      // Konaklama kaydını güncelle
      const updatedRecord = await tx.accommodation.update({
        where: { id: Number(id) },
        data: updateData,
      });

      // Eğer fiyat bilgisi değiştiyse ve organizasyon/kurum bilgisi varsa
      if ((updateData.toplamUcret !== undefined || updateData.gecelikUcret !== undefined || updateData.numberOfNights !== undefined) && 
          (updatedRecord.organizasyonAdi && updatedRecord.kurumCari)) {
        
        // Yeni toplam ücreti hesapla
        const totalAmount = updatedRecord.toplamUcret || 
                          (updatedRecord.gecelikUcret * (updatedRecord.numberOfNights || 1));
        
        // İlgili finans kaydını bul
        const existingTransaction = await tx.transaction.findFirst({
          where: {
            description: {
              contains: `${updatedRecord.kurumCari} | ${updatedRecord.organizasyonAdi} - ${updatedRecord.adiSoyadi}`
            }
          }
        });

        if (existingTransaction) {
          // Finans kaydını güncelle
          await tx.transaction.update({
            where: { id: existingTransaction.id },
            data: {
              amount: totalAmount,
              description: `${updatedRecord.kurumCari} | ${updatedRecord.organizasyonAdi} - ${updatedRecord.adiSoyadi} (Konaklama)`,
              date: new Date().toISOString().slice(0, 10),
            }
          });
        } else if (updateData.organizasyonAdi || updateData.kurumCari) {
          // Eğer organizasyon veya kurum bilgisi değiştiyse ve finans kaydı yoksa yeni kayıt oluştur
          await tx.transaction.create({
            data: {
              type: 'SATIS',
              description: `${updatedRecord.kurumCari} | ${updatedRecord.organizasyonAdi} - ${updatedRecord.adiSoyadi} (Konaklama)`,
              amount: totalAmount,
              date: new Date().toISOString().slice(0, 10),
              userId: userId
            }
          });
        }
      }

      return updatedRecord;
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Toplu silme işlemi için DELETE
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { ids } = data;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Geçerli IDs dizisi zorunlu' }, { status: 400 });
    }
    
    // Kullanıcı bilgilerini al
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch (e) {
        console.error('Token çözme hatası:', e);
      }
    }
    
    // IP ve User-Agent bilgilerini al
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Toplu silme işlemi
    // Önce silinecek kayıtları bul ve logla
    const recordsToDelete = await prisma.accommodation.findMany({
      where: { id: { in: ids.map(Number) } },
    });
    
    await prisma.$transaction(async (tx) => {
      // Log kayıtlarını oluştur
      await Promise.all(recordsToDelete.map(record => {
        return tx.log.create({
          data: {
            action: 'DELETE',
            modelName: 'Accommodation',
            recordId: record.id,
            recordData: JSON.stringify(record),
            userId,
            ipAddress,
            userAgent
          }
        });
      }));
      
      // İlgili finans kayıtlarını bul ve sil
      for (const record of recordsToDelete) {
        if (record.organizasyonAdi && record.kurumCari) {
          const transactionsToDelete = await tx.transaction.findMany({
            where: {
              description: {
                contains: `${record.kurumCari} | ${record.organizasyonAdi} - ${record.adiSoyadi}`
              }
            }
          });
          
          if (transactionsToDelete.length > 0) {
            await tx.transaction.deleteMany({
              where: {
                id: {
                  in: transactionsToDelete.map(t => t.id)
                }
              }
            });
          }
        }
      }
      
      // Kayıtları sil
      await tx.accommodation.deleteMany({
        where: { id: { in: ids.map(Number) } },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}