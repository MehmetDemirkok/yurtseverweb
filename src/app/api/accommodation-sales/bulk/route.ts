import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// DELETE - Toplu satış kayıtlarını sil
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
    }

    // Rol kontrolü - sadece MUDUR ve ADMIN silebilir
    if (!['ADMIN', 'MUDUR'].includes(user.role)) {
      return NextResponse.json({ error: 'Toplu silme yetkiniz yok' }, { status: 403 });
    }

    const data = await request.json();
    const { ids } = data;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Silinecek kayıt ID\'leri gerekli' }, { status: 400 });
    }

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const deletedIds: number[] = [];
          const errors: string[] = [];

          for (const id of ids) {
            try {
              // Önce kaydın var olup olmadığını ve şirkete ait olup olmadığını kontrol et
              const sale = await tx.accommodationSale.findFirst({
                where: {
                  id: id,
                  companyId: user.companyId,
                },
              });

              if (!sale) {
                errors.push(`ID ${id}: Kayıt bulunamadı veya yetkiniz yok`);
                continue;
              }

              // Kaydı sil
              await tx.accommodationSale.delete({
                where: { id: id },
              });

              // Log kaydı
              await tx.log.create({
                data: {
                  action: 'DELETE',
                  modelName: 'AccommodationSale',
                  recordId: id,
                  recordData: JSON.stringify(sale),
                  userId: user.id,
                  companyId: user.companyId,
                  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                  userAgent: request.headers.get('user-agent') || 'unknown',
                },
              });

              deletedIds.push(id);
            } catch (itemError: any) {
              console.error(`Sale ID ${id} silinirken hata:`, itemError);
              errors.push(`ID ${id}: ${itemError.message}`);
            }
          }

          if (deletedIds.length === 0 && errors.length > 0) {
            throw new Error(`Hiçbir kayıt silinemedi: ${errors.join(', ')}`);
          }

          return { deletedIds, errors };
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      if (result.errors && result.errors.length > 0) {
        return NextResponse.json({
          message: `${result.deletedIds.length} kayıt silindi, ${result.errors.length} kayıt silinemedi`,
          deletedIds: result.deletedIds,
          errors: result.errors,
          warning: true,
        });
      }

      return NextResponse.json({
        message: `${result.deletedIds.length} kayıt başarıyla silindi`,
        deletedIds: result.deletedIds,
      });
    } catch (error: any) {
      console.error('Bulk delete transaction error:', error);
      return NextResponse.json(
        { error: error.message || 'Toplu silme sırasında hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

