import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel'; // excel veya pdf
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {
      companyId: user.companyId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.financialTransaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Başlık
      doc.setFontSize(18);
      doc.text('Finansal İşlemler Raporu', 14, 22);
      
      // Tarih aralığı
      if (startDate || endDate) {
        doc.setFontSize(10);
        doc.text(
          `Tarih: ${startDate || 'Başlangıç'} - ${endDate || 'Bitiş'}`,
          14,
          30
        );
      }

      // Tablo verileri
      const tableData = transactions.map((t) => [
        new Date(t.date).toLocaleDateString('tr-TR'),
        t.type === 'GELIR' ? 'Gelir' : 'Gider',
        getCategoryLabel(t.category),
        t.description,
        t.amount.toFixed(2) + ' ₺',
        t.user?.name || '-',
      ]);

      autoTable(doc, {
        head: [['Tarih', 'Tip', 'Kategori', 'Açıklama', 'Tutar', 'Kullanıcı']],
        body: tableData,
        startY: startDate || endDate ? 35 : 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Toplamlar
      const totalIncome = transactions
        .filter((t) => t.type === 'GELIR')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'GIDER')
        .reduce((sum, t) => sum + t.amount, 0);
      const profit = totalIncome - totalExpense;

      // Son tablo pozisyonunu al
      const finalY = (doc as any).lastAutoTable?.finalY || (startDate || endDate ? 35 : 30) + (tableData.length * 10);
      doc.setFontSize(10);
      doc.text(`Toplam Gelir: ${totalIncome.toFixed(2)} ₺`, 14, finalY + 10);
      doc.text(`Toplam Gider: ${totalExpense.toFixed(2)} ₺`, 14, finalY + 16);
      doc.text(`Net Kar: ${profit.toFixed(2)} ₺`, 14, finalY + 22);

      const pdfOutput = doc.output('arraybuffer');
      const pdfBuffer = Buffer.from(pdfOutput);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="finans-raporu-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    } else {
      // Excel export
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Finansal İşlemler');

      // Başlık
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = 'Finansal İşlemler Raporu';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Tarih aralığı
      if (startDate || endDate) {
        worksheet.mergeCells('A2:F2');
        worksheet.getCell('A2').value = `Tarih: ${startDate || 'Başlangıç'} - ${endDate || 'Bitiş'}`;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
      }

      // Başlık satırı
      const headerRow = worksheet.addRow([
        'Tarih',
        'Tip',
        'Kategori',
        'Açıklama',
        'Tutar',
        'Kullanıcı',
        'Notlar',
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Veri satırları
      transactions.forEach((transaction) => {
        worksheet.addRow([
          new Date(transaction.date).toLocaleDateString('tr-TR'),
          transaction.type === 'GELIR' ? 'Gelir' : 'Gider',
          getCategoryLabel(transaction.category),
          transaction.description,
          transaction.amount,
          transaction.user?.name || '-',
          transaction.notes || '-',
        ]);
      });

      // Toplam satırı
      const totalIncome = transactions
        .filter((t) => t.type === 'GELIR')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'GIDER')
        .reduce((sum, t) => sum + t.amount, 0);
      const profit = totalIncome - totalExpense;

      worksheet.addRow([]);
      const summaryRow = worksheet.addRow([
        '',
        '',
        '',
        'TOPLAM',
        '',
        '',
        '',
      ]);
      summaryRow.font = { bold: true };

      worksheet.addRow(['', '', '', 'Toplam Gelir:', totalIncome, '', '']);
      worksheet.addRow(['', '', '', 'Toplam Gider:', totalExpense, '', '']);
      worksheet.addRow(['', '', '', 'Net Kar:', profit, '', '']);

      // Sütun genişlikleri
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="finans-raporu-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export hatası' }, { status: 500 });
  }
}

function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    KONAKLAMA: 'Konaklama',
    TRANSFER: 'Transfer',
    OFIS_GIDERLERI: 'Ofis Giderleri',
    TEDARIKCI_ODEMESI: 'Tedarikçi Ödemesi',
    MAAŞ: 'Maaş',
    VERGI: 'Vergi',
    DİĞER: 'Diğer',
  };
  return labels[category] || category;
}

