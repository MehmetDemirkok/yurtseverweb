// Basit validation fonksiyonları
// Gerçek projede Zod veya Yup kullanılabilir

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const validateLogin = (data: LoginFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email adresi gereklidir';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Geçerli bir email adresi giriniz';
  }

  if (!data.password) {
    errors.password = 'Şifre gereklidir';
  } else if (data.password.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegister = (data: RegisterFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name) {
    errors.name = 'Ad soyad gereklidir';
  } else if (data.name.length < 2) {
    errors.name = 'Ad soyad en az 2 karakter olmalıdır';
  }

  if (!data.email) {
    errors.email = 'Email adresi gereklidir';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Geçerli bir email adresi giriniz';
  }

  if (!data.password) {
    errors.password = 'Şifre gereklidir';
  } else if (data.password.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Şifre tekrarı gereklidir';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Şifreler eşleşmiyor';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
