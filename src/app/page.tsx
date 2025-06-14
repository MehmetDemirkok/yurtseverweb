'use client';

import { useState } from 'react';

interface AccommodationRecord {
  id: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  gecelikUcret: number;
  toplamUcret: number;
  organizasyonAdi?: string;
  otelAdi?: string;
  gecelikOtelAlisFiyati?: number;
}

export default function Home() {
  const [records, setRecords] = useState<AccommodationRecord[]>([
    {
      id: 1,
      adiSoyadi: "yurtsever",
      unvani: "müdür",
      ulke: "test",
      sehir: "test",
      girisTarihi: "2025-06-11",
      cikisTarihi: "2025-06-16",
      odaTipi: "Single Oda",
      gecelikUcret: 5000,
      toplamUcret: 25000,
    },
  ]);

  const [formData, setFormData] = useState<Omit<AccommodationRecord, 'id' | 'toplamUcret'>>({
    adiSoyadi: '',
    unvani: '',
    ulke: '',
    sehir: '',
    girisTarihi: '',
    cikisTarihi: '',
    odaTipi: 'Single Oda',
    gecelikUcret: 0,
    organizasyonAdi: '',
    otelAdi: '',
    gecelikOtelAlisFiyati: 0,
  });

  const [filterData, setFilterData] = useState({
    filterAdiSoyadi: '',
    filterUlke: '',
    filterSehir: '',
    filterOrganizasyonAdi: '',
    filterOtelAdi: '',
    filterGecelikOtelAlisFiyati: '',
  });

  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: (id === 'gecelikUcret' || id === 'gecelikOtelAlisFiyati') ? parseFloat(value) : value,
    }));
  };

  const handleAddRecord = () => {
    const newId = records.length > 0 ? Math.max(...records.map(record => record.id)) + 1 : 1;
    const girisDate = new Date(formData.girisTarihi);
    const cikisDate = new Date(formData.cikisTarihi);
    const diffTime = Math.abs(cikisDate.getTime() - girisDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedToplamUcret = formData.gecelikUcret * (diffDays > 0 ? diffDays : 1);

    const newRecord: AccommodationRecord = {
      id: newId,
      ...formData,
      toplamUcret: calculatedToplamUcret,
    };
    setRecords((prevRecords) => [...prevRecords, newRecord]);
    // Clear form after adding
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      gecelikOtelAlisFiyati: 0,
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFilterData((prevData) => ({
      ...prevData,
      [id]: id === 'filterGecelikOtelAlisFiyati' ? value : value,
    }));
  };

  const handleEditRecord = () => {
    if (selectedRecordId === null) return;

    const recordToEdit = records.find((record) => record.id === selectedRecordId);
    if (recordToEdit) {
      setFormData({
        adiSoyadi: recordToEdit.adiSoyadi,
        unvani: recordToEdit.unvani,
        ulke: recordToEdit.ulke,
        sehir: recordToEdit.sehir,
        girisTarihi: recordToEdit.girisTarihi,
        cikisTarihi: recordToEdit.cikisTarihi,
        odaTipi: recordToEdit.odaTipi,
        gecelikUcret: recordToEdit.gecelikUcret,
        organizasyonAdi: recordToEdit.organizasyonAdi || '',
        otelAdi: recordToEdit.otelAdi || '',
        gecelikOtelAlisFiyati: recordToEdit.gecelikOtelAlisFiyati || 0,
      });
    }
  };

  const handleUpdateRecord = () => {
    if (selectedRecordId === null) return;

    setRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === selectedRecordId
          ? {
              ...record,
              ...formData,
              toplamUcret: formData.gecelikUcret * Math.ceil((new Date(formData.cikisTarihi).getTime() - new Date(formData.girisTarihi).getTime()) / (1000 * 60 * 60 * 24)),
            }
          : record
      )
    );
    setSelectedRecordId(null);
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      gecelikOtelAlisFiyati: 0,
    });
  };

  const handleDeleteRecord = () => {
    if (selectedRecordId === null) return;

    setRecords((prevRecords) =>
      prevRecords.filter((record) => record.id !== selectedRecordId)
    );
    setSelectedRecordId(null);
    setFormData({
      adiSoyadi: '',
      unvani: '',
      ulke: '',
      sehir: '',
      girisTarihi: '',
      cikisTarihi: '',
      odaTipi: 'Single Oda',
      gecelikUcret: 0,
      organizasyonAdi: '',
      otelAdi: '',
      gecelikOtelAlisFiyati: 0,
    });
  };

  const filteredRecords = records.filter((record) => {
    const gecelikOtelAlisFiyatiMatch = filterData.filterGecelikOtelAlisFiyati === '' ||
      (record.gecelikOtelAlisFiyati !== undefined && record.gecelikOtelAlisFiyati.toString().includes(filterData.filterGecelikOtelAlisFiyati));

    return (
      record.adiSoyadi.toLowerCase().includes(filterData.filterAdiSoyadi.toLowerCase()) &&
      record.ulke.toLowerCase().includes(filterData.filterUlke.toLowerCase()) &&
      record.sehir.toLowerCase().includes(filterData.filterSehir.toLowerCase()) &&
      (record.organizasyonAdi?.toLowerCase().includes(filterData.filterOrganizasyonAdi.toLowerCase()) || filterData.filterOrganizasyonAdi === '') &&
      (record.otelAdi?.toLowerCase().includes(filterData.filterOtelAdi.toLowerCase()) || filterData.filterOtelAdi === '') &&
      gecelikOtelAlisFiyatiMatch
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Otel Konaklama Puantaj Sistemi</h1>

      {/* Input Fields and Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          <div>
            <label htmlFor="organizasyonAdi" className="block text-sm font-semibold text-gray-700 mb-1">Organizasyon Adı</label>
            <input type="text" id="organizasyonAdi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.organizasyonAdi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="otelAdi" className="block text-sm font-semibold text-gray-700 mb-1">Otel Adı</label>
            <input type="text" id="otelAdi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.otelAdi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="gecelikOtelAlisFiyati" className="block text-sm font-semibold text-gray-700 mb-1">Gecelik Otel Alış Fiyatı</label>
            <input type="number" id="gecelikOtelAlisFiyati" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.gecelikOtelAlisFiyati} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="adiSoyadi" className="block text-sm font-semibold text-gray-700 mb-1">Adı Soyadı</label>
            <input type="text" id="adiSoyadi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.adiSoyadi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="unvani" className="block text-sm font-semibold text-gray-700 mb-1">Unvanı</label>
            <input type="text" id="unvani" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.unvani} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="ulke" className="block text-sm font-semibold text-gray-700 mb-1">Ülke</label>
            <input type="text" id="ulke" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.ulke} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="sehir" className="block text-sm font-semibold text-gray-700 mb-1">Şehir</label>
            <input type="text" id="sehir" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.sehir} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="girisTarihi" className="block text-sm font-semibold text-gray-700 mb-1">Giriş Tarihi:</label>
            <input type="date" id="girisTarihi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.girisTarihi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="cikisTarihi" className="block text-sm font-semibold text-gray-700 mb-1">Çıkış Tarihi:</label>
            <input type="date" id="cikisTarihi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.cikisTarihi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="odaTipi" className="block text-sm font-semibold text-gray-700 mb-1">Oda Tipi:</label>
            <select id="odaTipi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.odaTipi} onChange={handleInputChange}>
              <option>Single Oda</option>
              <option>Double Oda</option>
              <option>Triple Oda</option>
              <option>Suit Oda</option>
            </select>
          </div>
          <div>
            <label htmlFor="gecelikUcret" className="block text-sm font-semibold text-gray-700 mb-1">Gecelik Ücret</label>
            <input type="number" id="gecelikUcret" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.gecelikUcret} onChange={handleInputChange}/>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out" onClick={selectedRecordId ? handleUpdateRecord : handleAddRecord}>
            {selectedRecordId ? 'Güncelle' : 'Ekle'}
          </button>
          <button className="px-5 py-2 bg-yellow-600 text-white font-semibold rounded-md shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition duration-150 ease-in-out" onClick={handleEditRecord}>Seçili Kaydı Düzenle</button>
          <button className="px-5 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out" onClick={handleDeleteRecord}>Seçili Kaydı Sil</button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Konaklama Kayıtları</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Organizasyon Adı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Otel Adı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Gecelik Otel Alış Fiyatı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Adı Soyadı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unvan</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ülke</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Şehir</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Giriş Tarihi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Çıkış Tarihi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Oda Tipi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Gecelik Ücret</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Toplam Ücret</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={selectedRecordId === record.id ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.organizasyonAdi || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.otelAdi || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₺{(record.gecelikOtelAlisFiyati || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.adiSoyadi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.unvani}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.ulke}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.sehir}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.girisTarihi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.cikisTarihi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.odaTipi}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₺{record.gecelikUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₺{record.toplamUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter and Export Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="filterAdiSoyadi" className="block text-sm font-semibold text-gray-700 mb-1">Misafir Adı Soyadı Filtrele</label>
            <input type="text" id="filterAdiSoyadi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value={filterData.filterAdiSoyadi} onChange={handleFilterChange}/>
          </div>
          <div>
            <label htmlFor="filterUlke" className="block text-sm font-semibold text-gray-700 mb-1">Ülke Filtrele</label>
            <input type="text" id="filterUlke" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={filterData.filterUlke} onChange={handleFilterChange}/>
          </div>
          <div>
            <label htmlFor="filterSehir" className="block text-sm font-semibold text-gray-700 mb-1">Şehir Filtrele</label>
            <input type="text" id="filterSehir" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={filterData.filterSehir} onChange={handleFilterChange}/>
          </div>
          <div>
            <label htmlFor="filterOrganizasyonAdi" className="block text-sm font-semibold text-gray-700 mb-1">Organizasyon Adı Filtrele</label>
            <input type="text" id="filterOrganizasyonAdi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={filterData.filterOrganizasyonAdi} onChange={handleFilterChange}/>
          </div>
          <div>
            <label htmlFor="filterOtelAdi" className="block text-sm font-semibold text-gray-700 mb-1">Otel Adı Filtrele</label>
            <input type="text" id="filterOtelAdi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={filterData.filterOtelAdi} onChange={handleFilterChange}/>
          </div>
          <div>
            <label htmlFor="filterGecelikOtelAlisFiyati" className="block text-sm font-semibold text-gray-700 mb-1">Gecelik Otel Alış Fiyatı Filtrele</label>
            <input type="number" id="filterGecelikOtelAlisFiyati" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={filterData.filterGecelikOtelAlisFiyati} onChange={handleFilterChange}/>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Puantaj Raporu</button>
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Excel'den İçe Aktar</button>
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Excel'e Aktar</button>
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Excel Şablonu İndir</button>
        </div>
      </div>
    </div>
  );
}
