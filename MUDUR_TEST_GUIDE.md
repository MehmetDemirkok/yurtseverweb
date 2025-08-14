# MUDUR Rolü Test Rehberi

## Sorun
MUDUR rolündeki kullanıcılar dashboard'da "Kullanıcı Yönetimi" modülünü göremiyor ve OPERATOR/KULLANICI kullanıcıları oluşturamıyor.

## Çözüm
Aşağıdaki adımları takip ederek sorunu çözebilirsiniz:

### 1. Mevcut MUDUR Kullanıcılarının İzinlerini Güncelleme

#### Seçenek A: Script ile Otomatik Güncelleme
```bash
node scripts/fixMudurPermissions.js
```

#### Seçenek B: Manuel Güncelleme
Veritabanında MUDUR rolündeki kullanıcıların `permissions` alanına `user-management` iznini ekleyin:

```sql
-- PostgreSQL için
UPDATE "User" 
SET permissions = array_append(permissions, 'user-management')
WHERE role = 'MUDUR' 
AND NOT (permissions @> ARRAY['user-management']);
```

### 2. Test Adımları

1. **ADMIN hesabıyla giriş yapın**
2. **Yeni şirket oluşturun** (eğer yoksa)
3. **O şirket için MUDUR rolünde kullanıcı oluşturun**
4. **MUDUR hesabıyla giriş yapın**
5. **Dashboard'da "Kullanıcı Yönetimi" modülünü görüp görmediğinizi kontrol edin**

### 3. Beklenen Sonuçlar

#### MUDUR Rolü İçin:
- ✅ Dashboard'da "Kullanıcı Yönetimi" modülü görünmeli
- ✅ Kullanıcı Yönetimi sayfasına erişebilmeli
- ✅ Sadece kendi şirketindeki kullanıcıları görebilmeli
- ✅ OPERATOR ve KULLANICI rolünde kullanıcı oluşturabilmeli
- ✅ ADMIN veya MUDUR oluşturamamalı
- ❌ Şirket Yönetimi sayfasına erişememeli

#### ADMIN Rolü İçin:
- ✅ Tüm modüllere erişebilmeli
- ✅ Tüm şirketlerdeki kullanıcıları görebilmeli
- ✅ Tüm rollerde kullanıcı oluşturabilmeli
- ✅ Şirket Yönetimi sayfasına erişebilmeli

### 4. Sorun Giderme

#### "Kullanıcı Yönetimi" modülü görünmüyorsa:
1. Kullanıcının `permissions` alanında `user-management` izni olup olmadığını kontrol edin
2. Kullanıcının rolünün `MUDUR` olduğunu kontrol edin
3. Tarayıcı cache'ini temizleyin (Ctrl+F5)
4. Sayfayı yenileyin

#### Kullanıcı oluşturamıyorsa:
1. MUDUR kullanıcısının kendi şirketinde olduğunu kontrol edin
2. Sadece OPERATOR ve KULLANICI rolünde kullanıcı oluşturabileceğini unutmayın
3. API hata mesajlarını kontrol edin

### 5. Veritabanı Kontrolü

MUDUR kullanıcılarının izinlerini kontrol etmek için:

```sql
SELECT id, email, name, role, permissions 
FROM "User" 
WHERE role = 'MUDUR';
```

Beklenen sonuç:
```
id | email | name | role | permissions
---+-------+------+------+-------------
1  | mudur@test.com | Test Müdür | MUDUR | {user-management,home,transfer,cariler,tedarikciler}
```

### 6. API Test

MUDUR rolü ile API'leri test etmek için:

```bash
# Kullanıcıları listele (sadece kendi şirketindeki)
curl -H "Cookie: token=YOUR_JWT_TOKEN" http://localhost:3000/api/users

# Yeni kullanıcı oluştur (sadece OPERATOR/KULLANICI)
curl -X POST -H "Content-Type: application/json" -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"email":"test@test.com","name":"Test User","password":"123456","role":"OPERATOR","companyId":1}' \
  http://localhost:3000/api/users
```

### 7. Yeni MUDUR Kullanıcısı Oluşturma

Yeni MUDUR kullanıcısı oluştururken sistem otomatik olarak `user-management` iznini ekleyecektir. Manuel olarak da ekleyebilirsiniz:

```javascript
// Admin panelinde MUDUR oluştururken
const permissions = ['user-management', 'home', 'transfer', 'cariler', 'tedarikciler'];
```

## Not
Bu güncellemeler sonrasında MUDUR rolündeki kullanıcılar artık dashboard'da "Kullanıcı Yönetimi" modülünü görebilecek ve kendi şirketlerinde OPERATOR/KULLANICI kullanıcıları oluşturabilecekler.
