# Rol Bazlı Erişim Kontrolü (RBAC) Dokümantasyonu

## Genel Bakış

Bu sistem, çok kiracılı (multi-tenant) bir yapıda rol bazlı erişim kontrolü sağlar. Her şirket kendi verilerine sahiptir ve kullanıcılar rollerine göre farklı yetkilere sahiptir.

## Roller ve Yetkiler

### 1. ADMIN (Sistem Sahibi)
- **Tüm yetkilere sahiptir**
- Şirket oluşturabilir, düzenleyebilir ve silebilir
- Tüm şirketlerdeki kullanıcıları yönetebilir
- Tüm modüllere erişebilir
- Sistem loglarını görüntüleyebilir

### 2. MUDUR (Şirket Müdürü)
- **Kendi şirketindeki operasyonları yönetebilir**
- Kendi şirketinde OPERATOR ve KULLANICI rolünde kullanıcı oluşturabilir
- Kendi şirketindeki kullanıcıları düzenleyebilir ve silebilir
- Tüm modüllere erişebilir (kendi şirketi verileri)
- **Şirket oluşturamaz** - sadece ADMIN yapabilir

### 3. OPERATOR (Operatör)
- Veri ekleyebilir
- Veri düzenleyemez veya silemez
- Sadece görüntüleme ve ekleme yetkisi

### 4. KULLANICI (Kullanıcı)
- Sadece görüntüleme yetkisi
- Veri ekleyemez, düzenleyemez veya silemez

## Şirket Bazlı Veri İzolasyonu

### Veritabanı Seviyesinde
- Her veri kaydında `companyId` alanı bulunur
- Kullanıcılar sadece kendi şirketlerinin verilerini görebilir
- API'ler otomatik olarak şirket bazlı filtreleme yapar

### API Seviyesinde
```typescript
// MUDUR sadece kendi şirketindeki kullanıcıları görebilir
const whereClause = decoded.role === 'MUDUR' 
  ? { companyId: decoded.companyId }
  : {};
```

## Güvenlik Önlemleri

### 1. JWT Token Kontrolü
- Her API isteğinde token doğrulanır
- Token'da kullanıcı rolü ve şirket bilgisi bulunur

### 2. Rol Bazlı Yetki Kontrolü
```typescript
// MUDUR sadece OPERATOR ve KULLANICI oluşturabilir
if (decoded.role === 'MUDUR' && ['ADMIN', 'MUDUR'].includes(data.role)) {
  return NextResponse.json({ error: 'Müdür sadece OPERATOR ve KULLANICI rolünde kullanıcı oluşturabilir.' }, { status: 403 });
}
```

### 3. Şirket Bazlı Veri Erişimi
```typescript
// Kullanıcının kendi şirketinde olup olmadığını kontrol et
if (!targetUser || targetUser.companyId !== decoded.companyId) {
  return NextResponse.json({ error: 'Bu kullanıcıyı düzenleme yetkiniz yok.' }, { status: 403 });
}
```

## Kullanım Senaryoları

### Senaryo 1: Yeni Şirket Onboarding
1. **ADMIN** yeni şirket oluşturur
2. **ADMIN** şirket için MUDUR rolünde kullanıcı oluşturur
3. **MUDUR** kendi şirketinde OPERATOR ve KULLANICI kullanıcıları oluşturur

### Senaryo 2: Günlük Operasyonlar
1. **MUDUR** şirket operasyonlarını yönetir
2. **OPERATOR** veri girişi yapar
3. **KULLANICI** raporları görüntüler

### Senaryo 3: Kullanıcı Yönetimi
1. **MUDUR** kendi şirketindeki kullanıcıları yönetir
2. **ADMIN** tüm şirketlerdeki kullanıcıları yönetir

## API Endpoint Güvenliği

### Kullanıcı Yönetimi
- `GET /api/users` - ADMIN: tüm kullanıcılar, MUDUR: kendi şirketindeki kullanıcılar
- `POST /api/users` - ADMIN: tüm şirketler için, MUDUR: sadece kendi şirketi için
- `PUT /api/users/[id]` - ADMIN: tüm kullanıcılar, MUDUR: kendi şirketindeki OPERATOR/KULLANICI
- `DELETE /api/users/[id]` - ADMIN: tüm kullanıcılar, MUDUR: kendi şirketindeki OPERATOR/KULLANICI

### Şirket Yönetimi
- `GET /api/companies` - Sadece ADMIN
- `POST /api/companies` - Sadece ADMIN
- `PUT /api/companies/[id]` - Sadece ADMIN
- `DELETE /api/companies/[id]` - Sadece ADMIN

## Frontend Güvenliği

### Sayfa Erişim Kontrolü
```typescript
// PermissionGuard bileşeni
if (user.role === 'MUDUR') {
  // Şirket yönetimi sayfalarına sadece ADMIN erişebilir
  if (pathname.startsWith('/admin/companies')) {
    router.replace("/no-access");
    return;
  }
}
```

### Rol Bazlı UI Elemanları
```typescript
// MUDUR sadece OPERATOR ve KULLANICI oluşturabilir
const getRoleOptions = () => {
  if (currentUser?.role === 'MUDUR') {
    return [
      { value: 'OPERATOR', label: 'Operatör' },
      { value: 'KULLANICI', label: 'Kullanıcı' }
    ];
  }
  return [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MUDUR', label: 'Müdür' },
    { value: 'OPERATOR', label: 'Operatör' },
    { value: 'KULLANICI', label: 'Kullanıcı' }
  ];
};
```

## Test Senaryoları

### Test 1: MUDUR Kullanıcı Yönetimi
1. MUDUR rolünde kullanıcı ile giriş yap
2. Kullanıcı yönetimi sayfasına git
3. Sadece kendi şirketindeki kullanıcıları gör
4. OPERATOR ve KULLANICI oluştur
5. ADMIN veya MUDUR oluşturmaya çalış (engellenmeli)

### Test 2: Şirket Yönetimi
1. MUDUR rolünde kullanıcı ile giriş yap
2. Şirket yönetimi sayfasına git (engellenmeli)
3. ADMIN rolünde kullanıcı ile giriş yap
4. Şirket yönetimi sayfasına git (erişim sağlanmalı)

### Test 3: Veri İzolasyonu
1. Farklı şirketlerde MUDUR kullanıcıları oluştur
2. Her MUDUR sadece kendi şirketinin verilerini görmeli
3. Diğer şirketlerin verilerine erişememeli

## Güvenlik Kontrol Listesi

- [x] JWT token doğrulama
- [x] Rol bazlı yetki kontrolü
- [x] Şirket bazlı veri izolasyonu
- [x] API endpoint güvenliği
- [x] Frontend erişim kontrolü
- [x] Kullanıcı işlemleri güvenliği
- [x] Şirket yönetimi güvenliği
- [x] Veri sızıntısı önleme
- [x] Yetki yükseltme saldırısı önleme

## Gelecek Geliştirmeler

1. **Detaylı Audit Log**: Tüm kullanıcı işlemlerinin loglanması
2. **İki Faktörlü Kimlik Doğrulama**: Güvenlik artırımı
3. **Otomatik Yetki Kontrolü**: Middleware seviyesinde
4. **Rol Şablonları**: Önceden tanımlanmış rol kombinasyonları
5. **Geçici Yetkiler**: Zaman sınırlı yetki verme
