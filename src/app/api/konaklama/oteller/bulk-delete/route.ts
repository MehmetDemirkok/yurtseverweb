import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
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

    // Otelleri sil
    const result = await prisma.hotel.deleteMany({
      where: {
        id: {
          in: hotelIds
        }
      }
    });

    console.log(`✅ ${result.count} otel başarıyla silindi!`);

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} otel başarıyla silindi!`
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
