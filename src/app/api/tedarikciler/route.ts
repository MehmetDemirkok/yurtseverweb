import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCompanyAccess } from '@/lib/auth';

// GET - Tüm tedarikçileri listele
export async function GET() {
  try {
    const user = await requireCompanyAccess();
    
    const tedarikciler = await prisma.tedarikci.findMany({
      where: {
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ tedarikciler });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Tedarikçiler alınamadı:', error);
    return NextResponse.json(
      { error: 'Tedarikçiler alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni tedarikçi ekle
export async function POST(request: NextRequest) {
  try {
    const user = await requireCompanyAccess();
    const body = await request.json();
    const { 
      sirketAdi, 
      yetkiliKisi, 
      email, 
      telefon, 
      adres, 
      sehir, 
      ulke, 
      vergiNo, 
      vergiDairesi, 
      hizmetTuru, 
      notlar, 
      durum 
    } = body;

    // Validasyon
    if (!sirketAdi) {
      return NextResponse.json(
        { error: 'Şirket adı alanı zorunludur' },
        { status: 400 }
      );
    }

    // Email validasyonu (varsa)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Geçersiz email formatı' },
          { status: 400 }
        );
      }
    }

    const tedarikci = await prisma.tedarikci.create({
      data: {
        sirketAdi,
        yetkiliKisi: yetkiliKisi || null,
        email: email || null,
        telefon: telefon || null,
        adres: adres || null,
        sehir: sehir || null,
        ulke: ulke || 'Türkiye',
        vergiNo: vergiNo || null,
        vergiDairesi: vergiDairesi || null,
        hizmetTuru: hizmetTuru || null,
        notlar: notlar || null,
        durum: durum || 'AKTIF',
        companyId: user.companyId // Şirket bazlı veri izolasyonu
      }
    });

    return NextResponse.json({ tedarikci }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (error.message === 'Company access denied') {
      return NextResponse.json({ error: 'Şirket erişimi reddedildi' }, { status: 403 });
    }
    
    console.error('Tedarikçi oluşturulamadı:', error);
    return NextResponse.json(
      { error: 'Tedarikçi oluşturulamadı' },
      { status: 500 }
    );
  }
}
