// 20 farklı organizasyon için demo Accommodation kaydı ekler
// Çalıştırmak için: node scripts/demoAccommodation.js

const today = new Date();
const addDays = (d, n) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c.toISOString().split('T')[0];
};

const orgs = [
  'U14 Türkiye Şampiyonası Eskişehir',
  'Bayi Toplantısı 2025',
  'Eğitim Zirvesi Ankara',
  'Spor Festivali İzmir',
  'Teknoloji Konferansı İstanbul',
  'Sağlık Çalıştayı Bursa',
  'Gastronomi Günleri Gaziantep',
  'Kariyer Fuarı Antalya',
  'Mimarlık Sempozyumu Trabzon',
  'Girişimcilik Kampı Bodrum',
  'Yazılım Hackathonu Ankara',
  'Sanat Buluşması Mardin',
  'Müzik Festivali Edirne',
  'Tıp Kongresi Samsun',
  'Otomotiv Zirvesi Sakarya',
  'Finans Forumu İstanbul',
  'Turizm Çalıştayı Nevşehir',
  'Edebiyat Günleri Kars',
  'Gençlik Kampı Bolu',
  'Güreş Federasyonu Konaklama'
];
const odaTipleri = ['Single Oda', 'Double Oda', 'Suite', 'Deluxe'];
const konaklamaTipleri = ['BB', 'HB', 'FB', 'UHD'];

const records = orgs.map((org, i) => {
  const start = addDays(today, i * 2);
  const end = addDays(today, i * 2 + 3);
  const gecelikUcret = 1000 + i * 50;
  const numberOfNights = 3;
  return {
    adiSoyadi: `Demo Kullanıcı ${i + 1}`,
    unvani: 'Katılımcı',
    ulke: 'Türkiye',
    sehir: org.split(' ').pop(),
    girisTarihi: start,
    cikisTarihi: end,
    odaTipi: odaTipleri[i % odaTipleri.length],
    konaklamaTipi: konaklamaTipleri[i % konaklamaTipleri.length],
    faturaEdildi: false,
    gecelikUcret,
    organizasyonAdi: org,
    otelAdi: `Otel ${i + 1}`,
    kurumCari: `Kurum ${i + 1}`,
    numberOfNights,
    toplamUcret: gecelikUcret * numberOfNights
  };
});

(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/accommodation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });
    const data = await res.json();
    console.log('Demo kayıtlar eklendi:', data);
  } catch (err) {
    console.error('Hata:', err);
  }
})(); 