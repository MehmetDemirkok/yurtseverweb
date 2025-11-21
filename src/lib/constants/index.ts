// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/user/login',
  LOGOUT: '/api/user/logout',
  USERS: '/api/users',
  
  // Accommodation
  ACCOMMODATION: '/api/accommodation',
  HOTELS: '/api/konaklama/oteller',
  
  // Transfer
  VEHICLES: '/api/moduller/transfer/araclar',
  DRIVERS: '/api/moduller/transfer/soforler',
  TRANSFERS: '/api/moduller/transfer/transferler',
  
  // Customers & Suppliers
  CUSTOMERS: '/api/cariler',
  SUPPLIERS: '/api/tedarikciler',
  
  // Admin
  LOGS: '/api/logs',
  ORGANIZATIONS: '/api/organizations',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
} as const;

// Status Options
export const STATUS_OPTIONS = {
  ACTIVE: 'AKTIF',
  INACTIVE: 'PASIF',
} as const;

// Vehicle Status
export const VEHICLE_STATUS = {
  AVAILABLE: 'MUSAIT',
  IN_TRANSFER: 'TRANSFERDE',
  MAINTENANCE: 'BAKIMDA',
  BROKEN: 'ARIZALI',
} as const;

// Driver Status
export const DRIVER_STATUS = {
  AVAILABLE: 'MUSAIT',
  IN_TRANSFER: 'TRANSFERDE',
  ON_LEAVE: 'IZINDE',
} as const;

// Transfer Status
export const TRANSFER_STATUS = {
  PLANNED: 'PLANLANDI',
  IN_PROGRESS: 'DEVAM_EDIYOR',
  COMPLETED: 'TAMAMLANDI',
  CANCELLED: 'IPTAL_EDILDI',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MUDUR: 'MUDUR',
  OPERATOR: 'OPERATOR',
  KULLANICI: 'KULLANICI',
} as const;

// Customer Types
export const CUSTOMER_TYPES = {
  INDIVIDUAL: 'BIREYSEL',
  CORPORATE: 'KURUMSAL',
} as const;

// Hotel Status
export const HOTEL_STATUS = {
  ACTIVE: 'AKTIF',
  INACTIVE: 'PASIF',
} as const;

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Bu alan zorunludur',
  EMAIL: 'Geçerli bir email adresi giriniz',
  MIN_LENGTH: (min: number) => `En az ${min} karakter olmalıdır`,
  MAX_LENGTH: (max: number) => `En fazla ${max} karakter olmalıdır`,
  PHONE: 'Geçerli bir telefon numarası giriniz',
  PASSWORD_MISMATCH: 'Şifreler eşleşmiyor',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Kayıt başarıyla oluşturuldu',
  UPDATED: 'Kayıt başarıyla güncellendi',
  DELETED: 'Kayıt başarıyla silindi',
  SAVED: 'Değişiklikler kaydedildi',
  LOGIN: 'Giriş başarılı',
  LOGOUT: 'Çıkış yapıldı',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERAL: 'Bir hata oluştu',
  NETWORK: 'Ağ bağlantısı hatası',
  UNAUTHORIZED: 'Yetkisiz erişim',
  FORBIDDEN: 'Bu işlem için yetkiniz yok',
  NOT_FOUND: 'Kayıt bulunamadı',
  VALIDATION: 'Form verilerini kontrol ediniz',
  SERVER: 'Sunucu hatası',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'dd.MM.yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILES: 5,
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#06B6D4',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

// Route Names
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  ADMIN: '/admin',
  ACCOMMODATION: '/konaklama-alis',
  ACCOMMODATION_SALES: '/konaklama-satis',
  HOTELS: '/konaklama-alis/oteller',
  CUSTOMERS: '/cariler',
  SUPPLIERS: '/tedarikciler',
  TRANSFER: '/moduller/transfer',
  VEHICLES: '/moduller/transfer/araclar',
  DRIVERS: '/moduller/transfer/soforler',
  TRANSFERS: '/moduller/transfer/transferler',
} as const;
