import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Tüm satışları listele
export async function GET() {
  const sales = await prisma.sale.findMany({
    include: {
      accommodation: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Accommodation verisi olmayan satışlar için accommodationData'dan bilgileri çıkar
  const enhancedSales = sales.map(sale => {
    // Eğer accommodation ilişkisi yoksa ve accommodationData varsa
    if (!sale.accommodation && sale.accommodationData) {
      try {
        // accommodationData'yı parse et
        const accommodationData = JSON.parse(sale.accommodationData);
        // Sale nesnesine accommodation verilerini ekle
        return {
          ...sale,
          accommodation: accommodationData
        };
      } catch (e) {
        console.error('JSON parse hatası:', e);
        return sale;
      }
    }
    return sale;
  });
  
  return NextResponse.json(enhancedSales);
}

// Satışa aktarma (bir veya birden fazla konaklama kaydı)
export async function POST(request: Request) {
  // --- İZİN KONTROLÜ ---
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string; permissions?: string[] };
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    // Kullanıcıyı DB'den çekip permissions kontrolü yap
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { permissions: true }
    });
    if (!user || !user.permissions || !user.permissions.includes('sales')) {
      return NextResponse.json({ error: 'Satışa aktarma yetkiniz yok.' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Yetki kontrolü başarısız.' }, { status: 401 });
  }
  const data = await request.json();
  // data: { sales: [{ accommodationId, fiyat }], organizasyonAdi: string }
  const { sales, organizasyonAdi } = data;
  if (!sales || !Array.isArray(sales) || !organizasyonAdi) {
    return NextResponse.json({ error: 'Eksik veri.' }, { status: 400 });
  }
  const accommodationIds = sales.map(s => s.accommodationId);
  // Aynı organizasyonda daha önce satışa aktarılan konaklamaları bul
  const existingSales = await prisma.sale.findMany({
    where: {
      accommodationId: { in: accommodationIds },
      organizasyonAdi,
    },
  });
  const alreadySoldAccommodationIds = existingSales.map(sale => sale.accommodationId);
  const newSales = sales.filter(s => !alreadySoldAccommodationIds.includes(s.accommodationId));
  if (newSales.length === 0) {
    return NextResponse.json({ error: 'Seçili kayıtlar zaten bu organizasyonda satışa aktarılmış.' }, { status: 400 });
  }
  
  // Satış kayıtlarını oluştur ve konaklama kayıtlarını sakla
  try {
    // Önce aktarılacak konaklama kayıtlarını al
    const accommodationsToTransfer = await prisma.accommodation.findMany({
      where: {
        id: { in: newSales.map(s => s.accommodationId) },
        organizasyonAdi,
      },
    });
    
    // Satış kayıtlarını oluştur
    const createdSales = await prisma.$transaction(async (tx) => {
      // Önce satış kayıtlarını oluştur
      const sales = await Promise.all(
        newSales.map(async ({ accommodationId, fiyat }) => {
          return tx.sale.create({
            data: {
              accommodationId,
              organizasyonAdi,
              fiyat,
              status: 'AKTARILDI',
              // Konaklama kaydının tüm verilerini JSON olarak sakla
              accommodationData: JSON.stringify(
                accommodationsToTransfer.find(a => a.id === accommodationId)
              ),
            },
          });
        })
      );
      
      // Sonra konaklama kayıtlarını sil
      await tx.accommodation.deleteMany({
        where: {
          id: { in: newSales.map(s => s.accommodationId) },
          organizasyonAdi,
        },
      });
      
      return sales;
    });
    
    return NextResponse.json({ success: true, createdSales });
  } catch (error) {
    console.error('Satışa aktarma hatası:', error);
    return NextResponse.json({ error: 'Satışa aktarma işlemi sırasında bir hata oluştu.' }, { status: 500 });
  }
}

// Satış fiyatı güncelle (PATCH)
export async function PATCH(request: Request) {
  const data = await request.json();
  const { id, fiyat } = data;
  if (!id || typeof fiyat !== 'number') {
    return NextResponse.json({ error: 'Eksik veri.' }, { status: 400 });
  }
  try {
    const updated = await prisma.sale.update({
      where: { id: Number(id) },
      data: { fiyat },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}

// Satış sil (DELETE) ve konaklama kaydını geri yükle
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id, ids, returnToAccommodation = true } = data;
    
    if (ids && Array.isArray(ids)) {
      // Çoklu silme
      // Önce silinecek satışları bul
      const sales = await prisma.sale.findMany({ where: { id: { in: ids.map(Number) } } });
      if (!sales.length) {
        return NextResponse.json({ error: 'Silinecek satış kaydı bulunamadı.' }, { status: 404 });
      }
      
      // Konaklama kayıtlarını geri yükle (eğer returnToAccommodation true ise)
      if (returnToAccommodation) {
        // Konaklama verilerini içeren satışları filtrele
        const salesWithAccommodationData = sales.filter(sale => sale.accommodationData);
        
        // Konaklama kayıtlarını geri yükle
        if (salesWithAccommodationData.length > 0) {
          await prisma.$transaction(
            // Promise.all kullanarak ve null değerleri önceden filtreleyerek düzeltme
            async () => {
              const promises = salesWithAccommodationData
                .map(sale => {
                  try {
                    const accommodationData = JSON.parse(sale.accommodationData || '{}');
                    // Eğer geçerli veri varsa konaklama kaydını oluştur
                    if (accommodationData && accommodationData.id) {
                      return prisma.accommodation.create({
                        data: {
                          ...accommodationData,
                          // id'yi yeniden oluşturmasını önlemek için
                          id: undefined,
                          // Satış durumunu güncelle
                          faturaEdildi: false
                        }
                      });
                    }
                    return null;
                  } catch (e) {
                    console.error('JSON parse hatası:', e);
                    return null;
                  }
                })
                .filter(Boolean); // null değerleri filtrele
              
              return Promise.all(promises);
            }
          );
        }
      }
      
      // Satışları sil
      await prisma.sale.deleteMany({ where: { id: { in: ids.map(Number) } } });
      
      return NextResponse.json({ success: true, deletedCount: sales.length });
    } else if (id) {
      // Tekli silme
      const sale = await prisma.sale.findUnique({ where: { id: Number(id) } });
      if (!sale) {
        return NextResponse.json({ error: 'Satış kaydı bulunamadı.' }, { status: 404 });
      }
      
      // Konaklama kaydını geri yükle (eğer returnToAccommodation true ise)
      if (returnToAccommodation && sale.accommodationData) {
        try {
          const accommodationData = JSON.parse(sale.accommodationData);
          if (accommodationData && accommodationData.id) {
            await prisma.accommodation.create({
              data: {
                ...accommodationData,
                // id'yi yeniden oluşturmasını önlemek için
                id: undefined,
                // Satış durumunu güncelle
                faturaEdildi: false
              }
            });
          }
        } catch (e) {
          console.error('JSON parse hatası:', e);
        }
      }
      
      // Satışı sil
      await prisma.sale.delete({ where: { id: Number(id) } });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Eksik veri: id veya ids gerekli.' }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}