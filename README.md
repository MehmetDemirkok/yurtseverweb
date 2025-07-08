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
DATABASE_URL=<PostgreSQL veritabanı bağlantı URL'niz>
DIRECT_URL=<PostgreSQL veritabanı doğrudan bağlantı URL'niz>
SUPABASE_URL=<Supabase URL'niz>
SUPABASE_ANON_KEY=<Supabase anonim anahtar>
GMAIL_USER=<Gmail kullanıcı adı>
GMAIL_PASS=<Gmail uygulama şifresi>
MAIL_TO=<Bildirim e-postaları alacak adresler>
PRISMA_GENERATE_DATAPROXY=true
```

### 2. Vercel Yapılandırması

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

### 3. Prisma Yapılandırması

Prisma istemcisi, `src/lib/prisma.ts` dosyasında optimize edilmiş bağlantı havuzu ayarları ve hata yakalama mekanizmaları ile yapılandırılmıştır.

### 4. Hata Ayıklama

Uygulama 500 Internal Server Error hatası verirse:

1. Vercel Dashboard'da Function Logs bölümünü kontrol edin
2. Çevre değişkenlerinin doğru ayarlandığından emin olun
3. Veritabanı bağlantısının çalıştığını doğrulayın
4. Prisma şemasının güncel olduğundan emin olun
