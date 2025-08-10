# Yurtsever Proje Yapısı

## 📁 Yeni Klasör Yapısı

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route Group - Kimlik Doğrulama
│   │   └── login/                # Giriş sayfası
│   ├── (dashboard)/              # Route Group - Dashboard
│   │   ├── dashboard/            # Ana dashboard
│   │   ├── konaklama/            # Konaklama modülü
│   │   ├── cariler/              # Müşteriler modülü
│   │   ├── tedarikciler/         # Tedarikçiler modülü
│   │   └── moduller/             # Diğer modüller
│   │       └── transfer/         # Transfer modülü
│   ├── (admin)/                  # Route Group - Admin
│   │   └── admin/                # Admin paneli
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Kimlik doğrulama API'leri
│   │   ├── accommodation/        # Konaklama API'leri
│   │   ├── transfer/             # Transfer API'leri
│   │   ├── customers/            # Müşteri API'leri
│   │   ├── suppliers/            # Tedarikçi API'leri
│   │   └── admin/                # Admin API'leri
│   ├── components/               # Sayfa özel componentleri
│   ├── globals.css               # Global stiller
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Ana sayfa
├── components/                   # Shared Components
│   ├── ui/                       # UI Components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── forms/                    # Form Components
│   ├── tables/                   # Table Components
│   ├── charts/                   # Chart Components
│   ├── layout/                   # Layout Components
│   │   ├── PageHeader.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── PermissionGuard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── UserHeader.tsx
│   │   └── index.ts
│   └── index.ts
├── lib/                          # Utility Libraries
│   ├── utils/                    # Utility Functions
│   │   └── index.ts
│   ├── constants/                # Constants
│   │   └── index.ts
│   ├── validations/              # Validation Schemas
│   │   └── auth.ts
│   ├── auth.ts                   # Authentication
│   ├── permissions.ts            # Permissions
│   └── prisma.ts                 # Database
└── types/                        # TypeScript Types
    └── index.ts
```

## 🚀 Yapılan İyileştirmeler

### 1. **Route Groups Kullanımı**
- `(auth)`: Kimlik doğrulama sayfaları
- `(dashboard)`: Ana uygulama sayfaları
- `(admin)`: Admin paneli sayfaları

### 2. **Modüler Component Yapısı**
- `ui/`: Yeniden kullanılabilir UI componentleri
- `layout/`: Layout componentleri
- `forms/`: Form componentleri
- `tables/`: Tablo componentleri
- `charts/`: Grafik componentleri

### 3. **Utility Functions**
- `utils/`: Ortak yardımcı fonksiyonlar
- `constants/`: Sabit değerler
- `validations/`: Form doğrulama şemaları

### 4. **TypeScript Types**
- Merkezi tip tanımları
- API response tipleri
- Component prop tipleri

### 5. **API Routes Organizasyonu**
- Mantıklı gruplandırma
- Modül bazlı organizasyon
- Temiz endpoint yapısı

## 📋 Kullanım Örnekleri

### Component Import
```typescript
// Eski
import Button from '../components/Button';

// Yeni
import { Button } from '@/components/ui';
```

### Utility Functions
```typescript
// Eski
import { formatDate } from '../utils/date';

// Yeni
import { formatDate } from '@/lib/utils';
```

### Constants
```typescript
// Eski
const API_URL = '/api/users';

// Yeni
import { API_ENDPOINTS } from '@/lib/constants';
const API_URL = API_ENDPOINTS.USERS;
```

### Types
```typescript
// Eski
interface User {
  id: number;
  name: string;
}

// Yeni
import { User } from '@/types';
```

## 🔧 Avantajlar

1. **Daha İyi Organizasyon**: Mantıklı klasör yapısı
2. **Yeniden Kullanılabilirlik**: Shared components
3. **Tip Güvenliği**: Merkezi TypeScript tipleri
4. **Kolay Bakım**: Modüler yapı
5. **Ölçeklenebilirlik**: Gelecek geliştirmeler için hazır
6. **Temiz Import'lar**: Absolute path kullanımı

## 📝 Notlar

- Mevcut çalışırlık korundu
- Geriye dönük uyumluluk sağlandı
- Build başarıyla tamamlandı
- Tüm import yolları güncellendi
