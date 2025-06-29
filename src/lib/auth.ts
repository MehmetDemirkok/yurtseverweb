import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export interface UserToken {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
}

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', 
  USER = 'USER',
  VIEWER = 'VIEWER'
}

// Role hiyerarşisi - yüksek roller düşük rollerin yetkilerine sahip
export const roleHierarchy = {
  [Role.ADMIN]: 4,
  [Role.MANAGER]: 3,
  [Role.USER]: 2,
  [Role.VIEWER]: 1
};

// JWT'den kullanıcı bilgilerini çıkar
export async function getUserFromToken(): Promise<UserToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as UserToken;
    return decoded;
  } catch {
    return null;
  }
}

// Kullanıcının belirli bir role sahip olup olmadığını kontrol et
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Kullanıcının belirli rollerden birine sahip olup olmadığını kontrol et
export function hasAnyRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some(role => hasRole(userRole, role));
}

// API route'ları için yetkilendirme middleware'i
export async function requireAuth(requiredRole: Role = Role.USER) {
  const user = await getUserFromToken();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (!hasRole(user.role as Role, requiredRole)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
} 