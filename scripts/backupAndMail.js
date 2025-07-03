require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');

// ENV değişkenleri
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const MAIL_TO = process.env.MAIL_TO;

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elle tablo isimlerini yaz
const TABLES = [
  'Sale',
  'Accommodation',
  // Diğer tabloları buraya ekleyebilirsin
];

async function getAllTableNames() {
  return TABLES;
}

async function getTableData(tableName) {
  // Her tablonun tüm verisini çek
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Tablo okunamadı: ${tableName}`, error.message);
    return [];
  }
  return data;
}

async function createExcelBackup(tables) {
  const workbook = new ExcelJS.Workbook();
  for (const tableName of tables) {
    const data = await getTableData(tableName);
    const worksheet = workbook.addWorksheet(tableName);
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
      data.forEach(row => worksheet.addRow(row));
    } else {
      worksheet.addRow(['No data']);
    }
  }
  const fileName = `yurtsever-backup-${new Date().toISOString().slice(0,10)}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
  return fileName;
}

async function sendMailWithAttachment(filePath, tables) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });

  console.log(`E-posta şu alıcılara gönderiliyor: ${MAIL_TO}`);

  const today = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  const htmlBody = `
    <h3>Yurtsever Konaklama Platformu Haftalık Veritabanı Yedeği</h3>
    <p>Merhaba,</p>
    <p><b>${today}</b> tarihli haftalık veritabanı yedeği başarıyla oluşturulmuş ve ektedir.</p>
    <p>Bu yedek aşağıdaki tabloları içermektedir:</p>
    <ul>
      ${tables.map(table => `<li>${table}</li>`).join('')}
    </ul>
    <p>Lütfen bu yedeği güvenli bir yerde saklayınız.</p>
    <br>
    <p>İyi çalışmalar,</p>
    <p><b>Yurtsever Otomasyon Sistemi</b></p>
  `;

  await transporter.sendMail({
    from: `"Yurtsever Platform" <${GMAIL_USER}>`,
    to: MAIL_TO,
    subject: 'Yurtsever konaklama platformu haftalık database yedeği',
    html: htmlBody,
    attachments: [
      {
        filename: filePath,
        path: `./${filePath}`
      }
    ]
  });
  console.log('Yedek başarıyla e-posta ile gönderildi!');
}

async function main() {
  try {
    console.log('Tablo isimleri alınıyor...');
    const tables = await getAllTableNames();
    console.log('Tablolar:', tables);
    console.log('Excel dosyası oluşturuluyor...');
    const filePath = await createExcelBackup(tables);
    console.log('E-posta gönderiliyor...');
    await sendMailWithAttachment(filePath, tables);
  } catch (err) {
    console.error('Hata:', err.message);
  }
}

main(); 