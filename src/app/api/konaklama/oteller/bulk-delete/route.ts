import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT token'dan kullanıcı bilgisini al
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN ve MUDUR kullanıcılar toplu silme yapabilir
    if (!['ADMIN', 'MUDUR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { hotelIds } = await request.json();

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Geçerli otel ID\'leri gerekli!' 
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ ${hotelIds.length} otel siliniyor...`);

    // Önce otellerin bu şirkete ait olup olmadığını kontrol et
    const existingHotels = await prisma.hotel.findMany({
      where: {
        id: {
          in: hotelIds
        },
        companyId: user.companyId
      },
      select: {
        id: true,
        adi: true
      }
    });

    const foundIds = existingHotels.map(hotel => hotel.id);
    const notFoundIds = hotelIds.filter(id => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      console.log(`⚠️ ${notFoundIds.length} otel bulunamadı:`, notFoundIds);
    }

    // Sadece bulunan otelleri sil
    const result = await prisma.hotel.deleteMany({
      where: {
        id: {
          in: foundIds
        }
      }
    });

    console.log(`✅ ${result.count} otel başarıyla silindi!`);

    // Log kaydı
    if (result.count > 0) {
      await prisma.log.create({
        data: {
          action: 'BULK_DELETE',
          modelName: 'Hotel',
          recordId: 0, // Toplu işlem için 0
          recordData: JSON.stringify({
            deletedCount: result.count,
            hotelIds: foundIds,
            notFoundIds: notFoundIds
          }),
          userId: user.id,
          companyId: user.companyId,
          ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      notFoundCount: notFoundIds.length,
      message: `${result.count} otel başarıyla silindi!${notFoundIds.length > 0 ? ` ${notFoundIds.length} otel bulunamadı.` : ''}`
    });

  } catch (error) {
    console.error('❌ Toplu silme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Toplu silme işlemi başarısız oldu!',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
