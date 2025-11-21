import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// GET - Satış kayıtlarını getir
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();

    const sales = await prisma.accommodationSale.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error('AccommodationSale GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// POST - Yeni satış kaydı oluştur veya toplu satışa aktar
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    const data = await request.json();

    // Toplu satışa aktarma
    if (data.accommodationIds && Array.isArray(data.accommodationIds)) {
      const result = await prisma.$transaction(async (tx) => {
        const sales = [];

        for (const accommodationId of data.accommodationIds) {
          // Alış kaydını getir
          const accommodation = await tx.accommodation.findUnique({
            where: { id: accommodationId },
          });

          if (!accommodation) {
            throw new Error(`Accommodation ID ${accommodationId} bulunamadı`);
          }

          // Varsayılan satış fiyatı %20 kar marjı ile
          const satisFiyati = accommodation.gecelikUcret * 1.2;
          const toplamSatisFiyati = accommodation.toplamUcret * 1.2;
          const kar = toplamSatisFiyati - accommodation.toplamUcret;
          const karOrani = (kar / accommodation.toplamUcret) * 100;

          // Satış kaydı oluştur
          const sale = await tx.accommodationSale.create({
            data: {
              accommodationId: accommodation.id,
              adiSoyadi: accommodation.adiSoyadi,
              unvani: accommodation.unvani,
              ulke: accommodation.ulke,
              sehir: accommodation.sehir,
              girisTarihi: accommodation.girisTarihi,
              cikisTarihi: accommodation.cikisTarihi,
              odaTipi: accommodation.odaTipi,
              konaklamaTipi: accommodation.konaklamaTipi,
              otelAdi: accommodation.otelAdi,
              alisFiyati: accommodation.gecelikUcret,
              toplamAlisFiyati: accommodation.toplamUcret,
              satisFiyati: satisFiyati,
              toplamSatisFiyati: toplamSatisFiyati,
              kar: kar,
              karOrani: karOrani,
              kalanTutar: toplamSatisFiyati,
              companyId: user.companyId,
            },
          });

          // Log kaydı
          await tx.log.create({
            data: {
              action: 'CREATE',
              modelName: 'AccommodationSale',
              recordId: sale.id,
              recordData: JSON.stringify(sale),
              userId: user.id,
              companyId: user.companyId,
            },
          });

          sales.push(sale);
        }

        return sales;
      });

      return NextResponse.json({
        message: `${result.length} kayıt satışa aktarıldı`,
        sales: result,
      });
    }

    // Tekli satış kaydı oluşturma
    const sale = await prisma.accommodationSale.create({
      data: {
        ...data,
        companyId: user.companyId,
        kalanTutar: data.toplamSatisFiyati - (data.odenenTutar || 0),
      },
    });

    await prisma.log.create({
      data: {
        action: 'CREATE',
        modelName: 'AccommodationSale',
        recordId: sale.id,
        recordData: JSON.stringify(sale),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error('AccommodationSale POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
