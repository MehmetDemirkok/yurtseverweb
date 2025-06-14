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
  kurumCari?: string;
  numberOfNights?: number;
}

export default function Home() {
  const [records, setRecords] = useState<AccommodationRecord[]>([
    {
      id: 1,
      adiSoyadi: "Ayşe Yılmaz",
      unvani: "Müdür",
      ulke: "Türkiye",
      sehir: "İstanbul",
      girisTarihi: "2024-07-01",
      cikisTarihi: "2024-07-05",
      odaTipi: "Single Oda",
      gecelikUcret: 2500,
      toplamUcret: 10000,
      organizasyonAdi: "ABC Holding",
      otelAdi: "Grand Hotel",
      kurumCari: "Kurum A",
      numberOfNights: 4,
    },
    {
      id: 2,
      adiSoyadi: "Mehmet Can",
      unvani: "Uzman",
      ulke: "Türkiye",
      sehir: "Ankara",
      girisTarihi: "2024-07-10",
      cikisTarihi: "2024-07-12",
      odaTipi: "Double Oda",
      gecelikUcret: 3000,
      toplamUcret: 6000,
      organizasyonAdi: "XYZ Ltd.",
      otelAdi: "Ankara Palace",
      kurumCari: "Cari B",
      numberOfNights: 2,
    },
    {
      id: 3,
      adiSoyadi: "Zeynep Demir",
      unvani: "Asistan",
      ulke: "Türkiye",
      sehir: "İzmir",
      girisTarihi: "2024-07-15",
      cikisTarihi: "2024-07-18",
      odaTipi: "Triple Oda",
      gecelikUcret: 2800,
      toplamUcret: 8400,
      organizasyonAdi: "DEF Global",
      otelAdi: "Aegean Resort",
      kurumCari: "Kurum C",
      numberOfNights: 3,
    },
    {
      id: 4,
      adiSoyadi: "Ali Veli",
      unvani: "Analist",
      ulke: "Almanya",
      sehir: "Berlin",
      girisTarihi: "2024-08-01",
      cikisTarihi: "2024-08-03",
      odaTipi: "Single Oda",
      gecelikUcret: 3500,
      toplamUcret: 7000,
      organizasyonAdi: "GHI Corp.",
      otelAdi: "Berlin Central",
      kurumCari: "Cari D",
      numberOfNights: 2,
    },
    {
      id: 5,
      adiSoyadi: "Fatma Kara",
      unvani: "Proje Yöneticisi",
      ulke: "Fransa",
      sehir: "Paris",
      girisTarihi: "2024-08-10",
      cikisTarihi: "2024-08-14",
      odaTipi: "Suit Oda",
      gecelikUcret: 6000,
      toplamUcret: 24000,
      organizasyonAdi: "JKL Solutions",
      otelAdi: "Eiffel Grand",
      kurumCari: "Kurum E",
      numberOfNights: 4,
    },
    {
      id: 6,
      adiSoyadi: "Cemil Ak",
      unvani: "Mühendis",
      ulke: "İngiltere",
      sehir: "Londra",
      girisTarihi: "2024-09-01",
      cikisTarihi: "2024-09-07",
      odaTipi: "Double Oda",
      gecelikUcret: 4000,
      toplamUcret: 24000,
      organizasyonAdi: "MNO Systems",
      otelAdi: "London Bridge Inn",
      kurumCari: "Cari F",
      numberOfNights: 6,
    },
    {
      id: 7,
      adiSoyadi: "Deniz Toprak",
      unvani: "Pazarlama",
      ulke: "İtalya",
      sehir: "Roma",
      girisTarihi: "2024-09-15",
      cikisTarihi: "2024-09-17",
      odaTipi: "Single Oda",
      gecelikUcret: 3200,
      toplamUcret: 6400,
      organizasyonAdi: "PQR Ventures",
      otelAdi: "Coliseum Hotel",
      kurumCari: "Kurum G",
      numberOfNights: 2,
    },
    {
      id: 8,
      adiSoyadi: "Burak Deniz",
      unvani: "Satış",
      ulke: "İspanya",
      sehir: "Madrid",
      girisTarihi: "2024-10-01",
      cikisTarihi: "2024-10-04",
      odaTipi: "Triple Oda",
      gecelikUcret: 3800,
      toplamUcret: 11400,
      organizasyonAdi: "STU Innovations",
      otelAdi: "Madrid Plaza",
      kurumCari: "Cari H",
      numberOfNights: 3,
    },
    {
      id: 9,
      adiSoyadi: "Esra Koç",
      unvani: "İnsan Kaynakları",
      ulke: "Hollanda",
      sehir: "Amsterdam",
      girisTarihi: "2024-10-10",
      cikisTarihi: "2024-10-13",
      odaTipi: "Double Oda",
      gecelikUcret: 3300,
      toplamUcret: 9900,
      organizasyonAdi: "VWX Group",
      otelAdi: "Amsterdam Inn",
      kurumCari: "Kurum I",
      numberOfNights: 3,
    },
    {
      id: 10,
      adiSoyadi: "Caner Pehlivan",
      unvani: "Finans",
      ulke: "Belçika",
      sehir: "Brüksel",
      girisTarihi: "2024-11-01",
      cikisTarihi: "2024-11-06",
      odaTipi: "Single Oda",
      gecelikUcret: 2700,
      toplamUcret: 13500,
      organizasyonAdi: "YZA Solutions",
      otelAdi: "Brussels City",
      kurumCari: "Cari J",
      numberOfNights: 5,
    },
  ]);

  const [formData, setFormData] = useState<Omit<AccommodationRecord, 'id' | 'toplamUcret' | 'numberOfNights'>>({
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
    kurumCari: '',
  });

  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToDeleteId, setRecordToDeleteId] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: (id === 'gecelikUcret') ? parseFloat(value) : value,
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
      numberOfNights: diffDays > 0 ? diffDays : 0,
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
      kurumCari: '',
    });
  };

  const handleEditClick = (id: number) => {
    setSelectedRecordId(id);
    const recordToEdit = records.find((record) => record.id === id);
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
        kurumCari: recordToEdit.kurumCari || '',
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateRecord = () => {
    if (selectedRecordId === null) return;

    const girisDate = new Date(formData.girisTarihi);
    const cikisDate = new Date(formData.cikisTarihi);
    const diffTime = Math.abs(cikisDate.getTime() - girisDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedToplamUcret = formData.gecelikUcret * (diffDays > 0 ? diffDays : 1);

    setRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === selectedRecordId
          ? {
              ...record,
              ...formData,
              toplamUcret: calculatedToplamUcret,
              numberOfNights: diffDays > 0 ? diffDays : 0,
            }
          : record
      )
    );
    setShowEditModal(false);
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
      kurumCari: '',
    });
  };

  const handleDeleteClick = (id: number) => {
    setRecordToDeleteId(id);
  };

  const confirmDelete = () => {
    if (recordToDeleteId === null) return;
    setRecords((prevRecords) => prevRecords.filter((record) => record.id !== recordToDeleteId));
    setRecordToDeleteId(null);
  };

  const cancelDelete = () => {
    setRecordToDeleteId(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
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
      kurumCari: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Otel Konaklama Puantaj Sistemi</h1>

      {/* Input Fields and Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="kurumCari" className="block text-sm font-semibold text-gray-700 mb-1">Kurum / Cari</label>
            <input type="text" id="kurumCari" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.kurumCari} onChange={handleInputChange} placeholder="Kurum veya Cari Adı"/>
          </div>
          <div>
            <label htmlFor="organizasyonAdi" className="block text-sm font-semibold text-gray-700 mb-1">Organizasyon Adı</label>
            <input type="text" id="organizasyonAdi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.organizasyonAdi} onChange={handleInputChange} placeholder="Organizasyon Adı Girin"/>
          </div>
          <div>
            <label htmlFor="otelAdi" className="block text-sm font-semibold text-gray-700 mb-1">Otel Adı</label>
            <input type="text" id="otelAdi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.otelAdi} onChange={handleInputChange} placeholder="Otel Adı Girin"/>
          </div>
          <div>
            <label htmlFor="adiSoyadi" className="block text-sm font-semibold text-gray-700 mb-1">Adı Soyadı</label>
            <input type="text" id="adiSoyadi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.adiSoyadi} onChange={handleInputChange} placeholder="Ad ve Soyadı Girin"/>
          </div>
          <div>
            <label htmlFor="unvani" className="block text-sm font-semibold text-gray-700 mb-1">Unvanı</label>
            <input type="text" id="unvani" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.unvani} onChange={handleInputChange} placeholder="Unvanı Girin"/>
          </div>
          <div>
            <label htmlFor="ulke" className="block text-sm font-semibold text-gray-700 mb-1">Ülke</label>
            <input type="text" id="ulke" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.ulke} onChange={handleInputChange} placeholder="Ülke Girin"/>
          </div>
          <div>
            <label htmlFor="sehir" className="block text-sm font-semibold text-gray-700 mb-1">Şehir</label>
            <input type="text" id="sehir" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.sehir} onChange={handleInputChange} placeholder="Şehir Girin"/>
          </div>
          <div>
            <label htmlFor="girisTarihi" className="block text-sm font-semibold text-gray-700 mb-1">Giriş Tarihi:</label>
            <input type="date" id="girisTarihi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.girisTarihi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="cikisTarihi" className="block text-sm font-semibold text-gray-700 mb-1">Çıkış Tarihi:</label>
            <input type="date" id="cikisTarihi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.cikisTarihi} onChange={handleInputChange}/>
          </div>
          <div>
            <label htmlFor="odaTipi" className="block text-sm font-semibold text-gray-700 mb-1">Oda Tipi:</label>
            <select id="odaTipi" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.odaTipi} onChange={handleInputChange}>
              <option>Single Oda</option>
              <option>Double Oda</option>
              <option>Triple Oda</option>
              <option>Suit Oda</option>
            </select>
          </div>
          <div>
            <label htmlFor="gecelikUcret" className="block text-sm font-semibold text-gray-700 mb-1">Gecelik Ücret</label>
            <input type="number" id="gecelikUcret" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" value={formData.gecelikUcret} onChange={handleInputChange} placeholder="Gecelik Ücret Girin"/>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out" onClick={selectedRecordId ? handleUpdateRecord : handleAddRecord}>
            {selectedRecordId ? 'Kaydı Güncelle' : 'Kaydı Ekle'}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Konaklama Kayıtları</h2>
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ID</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">KURUM / CARİ</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ORG. ADI</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">OTEL ADI</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ADI SOYADI</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">UNVAN</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ÜLKE</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ŞEHİR</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">GİRİŞ</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ÇIKIŞ</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">ODA</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">GECELİK ÜCRET</th>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-600 tracking-wider break-words">GECE</th>
                <th scope="col" className="px-1 py-2 border-b border-gray-200 text-left text-xs font-semibold text-gray-700 tracking-wider break-words">TOPLAM ÜCRET</th>
                <th scope="col" className="px-1 py-2 border-b border-gray-200 text-left text-xs font-semibold text-gray-700 tracking-wider break-words">AKSIYONLAR</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={selectedRecordId === record.id ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}
                >
                  <td className="px-1 py-2 text-xs font-medium text-gray-900 break-words">{record.id}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.kurumCari || '-'}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.organizasyonAdi || '-'}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.otelAdi || '-'}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.adiSoyadi}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.unvani}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.ulke}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.sehir}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.girisTarihi}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.cikisTarihi}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.odaTipi}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">₺{record.gecelikUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">{record.numberOfNights}</td>
                  <td className="px-1 py-2 text-xs text-gray-700 break-words">₺{record.toplamUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-1 py-2 text-xs font-medium flex justify-center items-center space-x-1 break-words">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordId(record.id);
                        handleEditClick(record.id);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordId(record.id);
                        handleDeleteClick(record.id);
                      }}
                      className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.928a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L1.93 19.673a2.25 2.25 0 0 0 2.244 2.077h11.386a2.25 2.25 0 0 0 2.244-2.077L19.25 5.79m-14.456 0a48.108 48.108 0 0 1-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-6xl">
        <div className="flex flex-wrap justify-end gap-3">
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Puantaj Raporu</button>
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Excel'den İçe Aktar</button>
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Excel'e Aktar</button>
          <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out">Excel Şablonu İndir</button>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Kaydı Düzenle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col">
                <label htmlFor="kurumCari" className="mb-1 text-sm font-medium text-gray-700">Kurum / Cari</label>
                <input
                  type="text"
                  id="kurumCari"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kurum / Cari giriniz"
                  value={formData.kurumCari}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="organizasyonAdi" className="mb-1 text-sm font-medium text-gray-700">Organizasyon Adı</label>
                <input
                  type="text"
                  id="organizasyonAdi"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Organizasyon adı giriniz"
                  value={formData.organizasyonAdi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="otelAdi" className="mb-1 text-sm font-medium text-gray-700">Otel Adı</label>
                <input
                  type="text"
                  id="otelAdi"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Otel adı giriniz"
                  value={formData.otelAdi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="adiSoyadi" className="mb-1 text-sm font-medium text-gray-700">Adı Soyadı</label>
                <input
                  type="text"
                  id="adiSoyadi"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adı Soyadı giriniz"
                  value={formData.adiSoyadi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="unvani" className="mb-1 text-sm font-medium text-gray-700">Unvanı</label>
                <input
                  type="text"
                  id="unvani"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Unvanı giriniz"
                  value={formData.unvani}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ulke" className="mb-1 text-sm font-medium text-gray-700">Ülke</label>
                <input
                  type="text"
                  id="ulke"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ülke giriniz"
                  value={formData.ulke}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="sehir" className="mb-1 text-sm font-medium text-gray-700">Şehir</label>
                <input
                  type="text"
                  id="sehir"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Şehir giriniz"
                  value={formData.sehir}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="girisTarihi" className="mb-1 text-sm font-medium text-gray-700">Giriş Tarihi</label>
                <input
                  type="date"
                  id="girisTarihi"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.girisTarihi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="cikisTarihi" className="mb-1 text-sm font-medium text-gray-700">Çıkış Tarihi</label>
                <input
                  type="date"
                  id="cikisTarihi"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cikisTarihi}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="odaTipi" className="mb-1 text-sm font-medium text-gray-700">Oda Tipi</label>
                <select
                  id="odaTipi"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={formData.odaTipi}
                  onChange={handleInputChange}
                >
                  <option>Single Oda</option>
                  <option>Double Oda</option>
                  <option>Suit Oda</option>
                  <option>Triple Oda</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="gecelikUcret" className="mb-1 text-sm font-medium text-gray-700">Gecelik Ücret</label>
                <input
                  type="number"
                  id="gecelikUcret"
                  className="border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Gecelik ücret giriniz"
                  value={formData.gecelikUcret}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={handleUpdateRecord}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Kaydı Güncelle
              </button>
              <button
                onClick={closeEditModal}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {recordToDeleteId !== null && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Kaydı Sil Onayı</h2>
            <p className="mb-4">Bu kaydı silmek istediğinizden emin misiniz?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Evet, Sil
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Hayır, İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
