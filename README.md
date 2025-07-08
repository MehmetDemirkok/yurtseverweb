# Yurtsever Konaklama Yönetim Sistemi

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vercel Deployment Kılavuzu

Bu proje Vercel'de çalışacak şekilde yapılandırılmıştır. Aşağıdaki adımları izleyerek uygulamanızı Vercel'de başarıyla çalıştırabilirsiniz.

### 1. Vercel'de Çevre Değişkenlerini Ayarlama

Vercel Dashboard'da projenizin Environment Variables bölümünde aşağıdaki değişkenleri ayarlayın:

```
# ÖNEMLİ: Vercel'de DATABASE_URL'i Prisma Data Proxy formatında ayarlayın
DATABASE_URL=prisma://aws-us-east-1.prisma-data.com/?api_key=YOUR_API_KEY

# Diğer değişkenler
DIRECT_URL=<PostgreSQL veritabanı doğrudan bağlantı URL'niz>
SUPABASE_URL=<Supabase URL'niz>
SUPABASE_ANON_KEY=<Supabase anonim anahtar>
GMAIL_USER=<Gmail kullanıcı adı>
GMAIL_PASS=<Gmail uygulama şifresi>
MAIL_TO=<Bildirim e-postaları alacak adresler>
PRISMA_GENERATE_DATAPROXY=true
DEBUG=prisma:client,prisma:engine
```

### 2. Prisma Data Proxy Kurulumu

Vercel'de çalışan uygulamalar için Prisma Data Proxy kullanmanız gerekir. Bunun için:

1. [Prisma Data Platform](https://cloud.prisma.io)'da bir hesap oluşturun
2. Yeni bir Data Proxy projesi oluşturun
3. Veritabanı bağlantı bilgilerinizi girin
4. Oluşturulan Data Proxy URL'ini (`prisma://` ile başlayan) Vercel'deki `DATABASE_URL` çevre değişkeni olarak ayarlayın

> **ÖNEMLİ**: Vercel'de `DATABASE_URL` değişkeni `prisma://` veya `prisma+postgres://` protokolü ile başlamalıdır. Standart PostgreSQL URL'i (`postgresql://`) Vercel'de çalışmayacaktır.

### 3. Vercel Yapılandırması

Proje kök dizininde `vercel.json` dosyası bulunmaktadır. Bu dosya, Vercel'deki serverless fonksiyonlar için zaman aşımı süresini artırır ve Prisma yapılandırmasını optimize eder.

```json
{
  "functions": {
    "api/**/*": {
      "maxDuration": 10
    }
  },
  "build": {
    "env": {
      "PRISMA_GENERATE_DATAPROXY": "true"
    }
  }
}
```

> **Not**: Vercel'de API yolları `api/**/*` şeklinde yapılandırılır. Bu, Next.js App Router'da `src/app/api/` altında bulunan API rotalarını otomatik olarak eşleştirir. Vercel, build işlemi sırasında bu yolları doğru şekilde yapılandırır.

### 4. Prisma Yapılandırması

Prisma istemcisi, `src/lib/prisma.ts` dosyasında optimize edilmiş bağlantı havuzu ayarları ve hata yakalama mekanizmaları ile yapılandırılmıştır.

### 5. Hata Ayıklama

Uygulama 500 Internal Server Error hatası verirse:

1. Vercel Dashboard'da Function Logs bölümünü kontrol edin
2. Çevre değişkenlerinin doğru ayarlandığından emin olun
3. Veritabanı bağlantısının çalıştığını doğrulayın
4. Prisma şemasının güncel olduğundan emin olun

#### Veritabanı Bağlantı Seçenekleri

Uygulamanızı Vercel'de çalıştırmak için iki seçeneğiniz var:

##### 1. Doğrudan Veritabanı Bağlantısı (Önerilen)

Eğer canlı bir PostgreSQL veritabanınız varsa (örneğin Supabase, Railway, Neon, vb.), doğrudan bağlantı kullanabilirsiniz:

```
DATABASE_URL=postgresql://kullanici:sifre@veritabani-host:port/veritabani-adi
DIRECT_URL=postgresql://kullanici:sifre@veritabani-host:port/veritabani-adi
```

##### 2. Prisma Data Proxy Kullanımı

Eğer şu hatayı alıyorsanız ve Prisma Data Proxy kullanmak istiyorsanız:

```
Invalid `prisma.user.findFirst()` invocation: Error validating datasource `db`: the URL must start with the protocol `prisma://` or `prisma+postgres://`
```

Aşağıdaki adımları izleyin:

1. [Prisma Data Platform](https://cloud.prisma.io)'da bir Data Proxy projesi oluşturun
2. Oluşturulan Data Proxy URL'ini (`prisma://` ile başlayan) Vercel'deki `DATABASE_URL` çevre değişkeni olarak ayarlayın
3. `PRISMA_GENERATE_DATAPROXY=true` çevre değişkeninin ayarlandığından emin olun
4. Uygulamayı yeniden deploy edin

> **Not**: Local geliştirme ortamında standart PostgreSQL bağlantısı kullanırken, canlı ortamda farklı bir veritabanı bağlantısı kullanabilirsiniz. `.env` dosyası local geliştirme için, `.env.production` dosyası ise canlı ortam için kullanılır.
