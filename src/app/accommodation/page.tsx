'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import PageHeader from "../components/PageHeader";
import AccommodationTableSection from "../components/AccommodationTableSection";

export default function AccommodationPage() {
  const [showPuantajFilterModal, setShowPuantajFilterModal] = useState<boolean>(false);
  const [puantajFilters, setPuantajFilters] = useState<{
    organizasyonAdi: string;
    baslangicTarihi: string;
    bitisTarihi: string;
  }>({
    organizasyonAdi: '',
    baslangicTarihi: '',
    bitisTarihi: ''
  });
  const [records, setRecords] = useState<any[]>([]);
  const [organizasyonOptions, setOrganizasyonOptions] = useState<string[]>([]);
  const [showOrganizasyonOptions, setShowOrganizasyonOptions] = useState(false);
  
  // Organizasyon seçeneklerini kapatmak için referans
  const organizasyonRef = useRef<HTMLDivElement>(null);
  
  // Tıklama dışı olayını dinle
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (organizasyonRef.current && !organizasyonRef.current.contains(event.target as Node)) {
        setShowOrganizasyonOptions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // API'den kayıtları ve organizasyon seçeneklerini çek
  useEffect(() => {
    const fetchRecords = () => {
      fetch('/api/accommodation')
        .then(res => res.json())
        .then(data => setRecords(data));
    };

    fetchRecords();

    fetch('/api/organizations')
      .then(res => res.json())
      .then(data => setOrganizasyonOptions(data));

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRecords();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Puantaj raporu oluşturma fonksiyonu
  const handlePuantajRaporu = () => {
    // Varsayılan tarih aralığını belirle (tüm kayıtları kapsayacak şekilde)
    if (records.length > 0) {
      // En erken giriş tarihi ve en geç çıkış tarihini bul
      const allDates = records.flatMap(record => [new Date(record.girisTarihi), new Date(record.cikisTarihi)]);
      const minDate = new Date(Math.min(...allDates.map(date => date.getTime())));
      const maxDate = new Date(Math.max(...allDates.map(date => date.getTime())));
      
      // Tarihleri YYYY-MM-DD formatına çevir
      const minDateStr = minDate.toISOString().split('T')[0];
      const maxDateStr = maxDate.toISOString().split('T')[0];
      
      // Filtreleme değerlerini güncelle
      setPuantajFilters(prev => ({
        ...prev,
        baslangicTarihi: minDateStr,
        bitisTarihi: maxDateStr
      }));
    }
    
    // Filtreleme modalını aç
    setShowPuantajFilterModal(true);
  };

  // Puantaj raporu Excel dosyası oluşturma fonksiyonu
  const generatePuantajRaporu = () => {
    const { organizasyonAdi, baslangicTarihi, bitisTarihi } = puantajFilters;
    
    // Kayıtları filtrele
    let filteredRecords = [...records];
    
    // Metin bazlı filtreler
    if (organizasyonAdi) {
      filteredRecords = filteredRecords.filter(record => 
        record.organizasyonAdi?.toLowerCase().includes(organizasyonAdi.toLowerCase())
      );
    }
    
    // Tarih aralığı filtresi
    if (baslangicTarihi && bitisTarihi) {
      const baslangicDate = new Date(baslangicTarihi);
      const bitisDate = new Date(bitisTarihi);
      
      // Tarih aralığında en az bir gün kesişen kayıtları filtrele
      filteredRecords = filteredRecords.filter(record => {
        const recordBaslangic = new Date(record.girisTarihi);
        const recordBitis = new Date(record.cikisTarihi);
        
        // İki tarih aralığının kesişimi var mı kontrol et
        return (
          (recordBaslangic <= bitisDate && recordBitis >= baslangicDate)
        );
      });
    }

    // Tüm kayıtları tarih aralıklarına göre düzenle
    const sortedRecords = [...filteredRecords].sort((a, b) => {
      // Önce giriş tarihine göre sırala
      const dateA = new Date(a.girisTarihi).getTime();
      const dateB = new Date(b.girisTarihi).getTime();
      return dateA - dateB;
    });

    // Tüm tarihleri bul (benzersiz giriş ve çıkış tarihleri)
    const allDatesSet = new Set<string>();
    sortedRecords.forEach(record => {
      // Giriş ve çıkış tarihleri arasındaki tün günleri ekle
      const startDate = new Date(record.girisTarihi);
      const endDate = new Date(record.cikisTarihi);
      
      // Her gün için döngü
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        allDatesSet.add(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD formatında ekle
        currentDate.setDate(currentDate.getDate() + 1); // Bir sonraki güne geç
      }
    });

    // Tarihleri sırala
    const allDates = Array.from(allDatesSet).sort();

    // Başlık satırını oluştur (İsim, Unvan, Kurum/Cari, Otel ve tüm tarihler)
    const headers = [
      "Adı Soyadı", 
      "Unvanı", 
      "Kurum / Cari", 
      "Organizasyon Adı", 
      "Otel Adı", 
      "Oda Tipi", 
      "Konaklama Tipi", 
      "Fatura Edildi mi?", 
      "Gecelik Ücret", 
      "Toplam Ücret", 
      ...allDates.map(date => {
        // Tarihi daha okunabilir formata çevir (örn: 01.07.2024)
        const [year, month, day] = date.split('-');
        return `${day}.${month}.${year}`;
      })
    ];

    // Her kişi için puantaj verilerini oluştur
    const data = sortedRecords.map(record => {
      const row: (string | number | boolean)[] = [
        record.adiSoyadi,
        record.unvani,
        record.kurumCari || "",
        record.organizasyonAdi || "",
        record.otelAdi || "",
        record.odaTipi,
        record.konaklamaTipi,
        record.faturaEdildi,
        record.gecelikUcret.toLocaleString('tr-TR'),
        record.toplamUcret.toLocaleString('tr-TR')
      ];

      // Her tarih için kişinin o tarihte konaklamada olup olmadığını kontrol et
      allDates.forEach(date => {
        const checkDate = new Date(date);
        const startDate = new Date(record.girisTarihi);
        const endDate = new Date(record.cikisTarihi);
        // Eğer kişi o tarihte konaklamadaysa "X" işareti koy, değilse boş bırak
        // Çıkış günü hariç!
        if (checkDate >= startDate && checkDate < endDate) {
          row.push("X");
        } else {
          row.push("");
        }
      });

      return row;
    });

    // Excel dosyasını oluştur
    const ws_data = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Sütun genişliklerini ayarla
    const wscols = [
      { wch: 20 }, // Adı Soyadı
      { wch: 15 }, // Unvanı
      { wch: 20 }, // Kurum / Cari
      { wch: 25 }, // Organizasyon Adı
      { wch: 20 }, // Otel Adı
      { wch: 15 }, // Oda Tipi
      { wch: 15 }, // Konaklama Tipi
      { wch: 15 }, // Fatura Edildi mi?
      { wch: 15 }, // Gecelik Ücret
      { wch: 15 }, // Toplam Ücret
      ...allDates.map(() => ({ wch: 10 })) // Tarihler için genişlik
    ];
    ws['!cols'] = wscols;
    
    // Excel dosyasını oluştur ve indir
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Puantaj Raporu");
    
    // Dosya adını oluştur
    const fileName = `Puantaj_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Dosyayı indir
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="w-full mx-auto px-4 py-8 animate-fade-in">
      <PageHeader
        title="Konaklama Kayıtları"
        description="Tüm konaklama kayıtlarını ve işlemlerini yönetin"
        icon={<svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 10V7a5 5 0 0110 0v3M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" /></svg>}
      />
      <AccommodationTableSection handlePuantajRaporu={handlePuantajRaporu} />

      {/* Puantaj Filtre Modalı */}
      {showPuantajFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Puantaj Raporu Filtrele</h2>
            <div className="space-y-4">
              <div className="relative" ref={organizasyonRef}>
                <label htmlFor="organizasyonAdi" className="block text-sm font-medium text-gray-700 mb-1">Organizasyon Adı</label>
                <input
                  type="text"
                  id="organizasyonAdi"
                  className="input w-full"
                  value={puantajFilters.organizasyonAdi}
                  onChange={(e) => setPuantajFilters(prev => ({ ...prev, organizasyonAdi: e.target.value }))}
                  onFocus={() => setShowOrganizasyonOptions(true)}
                />
                {showOrganizasyonOptions && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-auto">
                    {organizasyonOptions
                      .filter(option => option.toLowerCase().includes(puantajFilters.organizasyonAdi.toLowerCase()))
                      .map((option, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm truncate"
                          onClick={() => {
                            setPuantajFilters(prev => ({ ...prev, organizasyonAdi: option }));
                            setShowOrganizasyonOptions(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    {organizasyonOptions.filter(option => option.toLowerCase().includes(puantajFilters.organizasyonAdi.toLowerCase())).length === 0 && (
                      <div className="px-4 py-2 text-gray-500 italic text-sm">Sonuç bulunamadı</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="baslangicTarihi" className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input
                  type="date"
                  id="baslangicTarihi"
                  className="input w-full"
                  value={puantajFilters.baslangicTarihi}
                  onChange={(e) => setPuantajFilters(prev => ({ ...prev, baslangicTarihi: e.target.value }))}
                  max={puantajFilters.bitisTarihi || undefined}
                />
              </div>
              <div>
                <label htmlFor="bitisTarihi" className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <input
                  type="date"
                  id="bitisTarihi"
                  className="input w-full"
                  value={puantajFilters.bitisTarihi}
                  onChange={(e) => setPuantajFilters(prev => ({ ...prev, bitisTarihi: e.target.value }))}
                  min={puantajFilters.baslangicTarihi || undefined}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn btn-outline"
                onClick={() => setShowPuantajFilterModal(false)}
              >
                İptal
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  generatePuantajRaporu();
                  setShowPuantajFilterModal(false);
                }}
              >
                Rapor Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}