import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS class birleştirme
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tarih formatlama
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Para formatlama
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Telefon numarası formatlama
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]} ${match[3]}`;
  }
  return phone;
}

// Email doğrulama
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Şifre güçlülük kontrolü
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermelidir');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermelidir');
  }
  
  if (!/\d/.test(password)) {
    errors.push('En az bir rakam içermelidir');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Dosya boyutu formatlama
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Debounce fonksiyonu
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle fonksiyonu
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Local Storage yardımcıları
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
};

// Session Storage yardımcıları
export const sessionStorage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('SessionStorage set error:', error);
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(key);
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.clear();
  }
};

// URL parametreleri yardımcıları
export function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function updateUrlParams(params: Record<string, string>) {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  
  window.history.pushState({}, '', url.toString());
}

// Rastgele ID oluşturma
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Slug oluşturma
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Sayfa numaralandırma yardımcısı
export function getPaginationInfo(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}
