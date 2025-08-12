import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı email ile bul (şirket bilgisiyle birlikte)
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    // Şirket durumunu kontrol et
    if (user.company.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Şirket hesabınız aktif değil' },
        { status: 403 }
      );
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Geçersiz email veya şifre' },
        { status: 401 }
      );
    }

    // JWT token oluştur (şirket bilgisiyle)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.company.id,
        companyName: user.company.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Cookie ayarla
    const response = NextResponse.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.company.id,
        companyName: user.company.name
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 saat
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    // Veritabanı bağlantı hatası kontrolü
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || 
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('P1001') ||
          error.message.includes('P1002')) {
        return NextResponse.json(
          { error: 'Veritabanına bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}