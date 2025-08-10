import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Token cookie'sini sil
  const cookie = serialize('token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', cookie);
  return response;
} 