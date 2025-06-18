import { Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

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

interface StatisticsProps {
  records: AccommodationRecord[];
}

interface ChartDataPoint {
  name: string;
  value: number;
  revenue?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export default function Statistics({ records }: StatisticsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Toplam istatistikler
  const totalRecords = records.length;
  const totalRevenue = records.reduce((sum, record) => sum + record.toplamUcret, 0);
  const averageNights = records.reduce((sum, record) => sum + (record.numberOfNights || 0), 0) / totalRecords;

  // Oda tiplerine göre dağılım
  const roomTypeData = records.reduce((acc: { [key: string]: number }, record) => {
    acc[record.odaTipi] = (acc[record.odaTipi] || 0) + 1;
    return acc;
  }, {});

  const roomTypeChartData = Object.entries(roomTypeData)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Aylık dağılım
  const monthlyData = records.reduce((acc: { [key: string]: number }, record) => {
    const month = new Date(record.girisTarihi).toLocaleString('tr-TR', { month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyChartData = Object.entries(monthlyData)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => {
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return months.indexOf(a.name) - months.indexOf(b.name);
    });

  // Kurumlara göre dağılım
  const organizationData = records.reduce((acc: { [key: string]: { count: number; revenue: number } }, record) => {
    const orgName = record.organizasyonAdi || 'Belirtilmemiş';
    if (!acc[orgName]) {
      acc[orgName] = { count: 0, revenue: 0 };
    }
    acc[orgName].count += 1;
    acc[orgName].revenue += record.toplamUcret;
    return acc;
  }, {});

  const organizationChartData = Object.entries(organizationData)
    .map(([name, data]) => ({
      name,
      value: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">{`Konaklama Sayısı: ${data.value}`}</p>
          {data.revenue && (
            <p className="text-green-600">{`Toplam Gelir: ${data.revenue.toLocaleString('tr-TR')} ₺`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-8 p-4 bg-white rounded-lg shadow-lg">
      <Typography variant="h5" className="mb-6 font-bold text-center text-gray-800">
        İstatistikler
      </Typography>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="h-full transform transition-transform hover:scale-105">
          <CardContent className="text-center">
            <Typography color="textSecondary" gutterBottom className="text-lg">
              Toplam Konaklama
            </Typography>
            <Typography variant="h4" className="text-blue-600 font-bold">
              {totalRecords}
            </Typography>
          </CardContent>
        </Card>
        <Card className="h-full transform transition-transform hover:scale-105">
          <CardContent className="text-center">
            <Typography color="textSecondary" gutterBottom className="text-lg">
              Toplam Gelir
            </Typography>
            <Typography variant="h4" className="text-green-600 font-bold">
              {totalRevenue.toLocaleString('tr-TR')} ₺
            </Typography>
          </CardContent>
        </Card>
        <Card className="h-full transform transition-transform hover:scale-105">
          <CardContent className="text-center">
            <Typography color="textSecondary" gutterBottom className="text-lg">
              Ortalama Konaklama Süresi
            </Typography>
            <Typography variant="h4" className="text-purple-600 font-bold">
              {averageNights.toFixed(1)} Gün
            </Typography>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardContent>
            <Typography variant="h6" className="mb-4 text-center text-gray-700">
              Oda Tiplerine Göre Dağılım
            </Typography>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={isMobile ? 80 : 100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {roomTypeChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent>
            <Typography variant="h6" className="mb-4 text-center text-gray-700">
              Aylık Konaklama Dağılımı
            </Typography>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 100 : 60}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8" 
                    name="Konaklama Sayısı"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardContent>
            <Typography variant="h6" className="mb-4 text-center text-gray-700">
              Kurumlara Göre Dağılım
            </Typography>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={organizationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 100 : 60}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="#82ca9d" 
                    name="Konaklama Sayısı"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 