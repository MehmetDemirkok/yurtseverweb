'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Database, Trash2, Plus, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TestDataCounts {
  araclar: number;
  soforler: number;
  transferler: number;
  konaklamalar: number;
}

export default function TestDataPage() {
  const [loading, setLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState<TestDataCounts>({
    araclar: 0,
    soforler: 0,
    transferler: 0,
    konaklamalar: 0
  });

  const fetchDataCounts = async () => {
    try {
      const response = await fetch('/api/test-data');
      const result = await response.json();
      
      if (result.success) {
        setDataCounts(result.data);
      }
    } catch (error) {
      console.error('Veri sayısı alınırken hata:', error);
    }
  };

  useEffect(() => {
    fetchDataCounts();
  }, []);

  const generateTestData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test verileri başarıyla oluşturuldu!');
        await fetchDataCounts();
      } else {
        toast.error(result.message || 'Test verileri oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Test verileri oluşturulurken hata:', error);
      toast.error('Test verileri oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearTestData = async () => {
    if (!confirm('Tüm test verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test verileri başarıyla temizlendi!');
        await fetchDataCounts();
      } else {
        toast.error(result.message || 'Test verileri temizlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Test verileri temizlenirken hata:', error);
      toast.error('Test verileri temizlenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const totalRecords = dataCounts.araclar + dataCounts.soforler + dataCounts.transferler + dataCounts.konaklamalar;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Verileri Yönetimi</h1>
          <p className="text-gray-600 mt-2">
            Araçlar, şoförler, transferler ve konaklamalar için test verilerini yönetin
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Database className="w-4 h-4 mr-1" />
            Toplam: {totalRecords} kayıt
          </Badge>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Araçlar</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataCounts.araclar}</div>
            <p className="text-xs text-muted-foreground">
              Test araç kaydı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Şoförler</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataCounts.soforler}</div>
            <p className="text-xs text-muted-foreground">
              Test şoför kaydı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferler</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataCounts.transferler}</div>
            <p className="text-xs text-muted-foreground">
              Test transfer kaydı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konaklamalar</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataCounts.konaklamalar}</div>
            <p className="text-xs text-muted-foreground">
              Test konaklama kaydı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* İşlem Butonları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Test Verileri Oluştur
            </CardTitle>
            <CardDescription>
              Her modül için 20'şer adet test verisi oluşturur. Mevcut veriler korunur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateTestData} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Test Verileri Oluştur
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Test Verilerini Temizle
            </CardTitle>
            <CardDescription>
              Tüm test verilerini kalıcı olarak siler. Bu işlem geri alınamaz!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={clearTestData} 
              disabled={loading || totalRecords === 0}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Temizleniyor...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Tüm Test Verilerini Sil
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bilgi Kartı */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Test Verileri Hakkında</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-blue-800">
            <p><strong>Oluşturulan Test Verileri:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Araçlar:</strong> 20 adet rastgele plaka, marka, model ve durum bilgisi</li>
              <li><strong>Şoförler:</strong> 20 adet rastgele isim, telefon ve ehliyet bilgisi</li>
              <li><strong>Transferler:</strong> 20 adet rastgele kalkış/varış noktası ve tarih bilgisi</li>
              <li><strong>Konaklamalar:</strong> 20 adet rastgele kişi, otel ve tarih bilgisi</li>
            </ul>
          </div>
          <div className="text-sm text-blue-800">
            <p><strong>Önemli Notlar:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Test verileri gerçek verilerle karışmaz, ayrı olarak yönetilir</li>
              <li>Transferler otomatik olarak mevcut araç ve şoförlerle ilişkilendirilir</li>
              <li>Temizleme işlemi tüm test verilerini kalıcı olarak siler</li>
              <li>Bu sayfa sadece geliştirme ve test amaçlıdır</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
