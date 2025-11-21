'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Palette, Bell, Shield, Building, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserData {
  id: number;
  email: string;
  name?: string;
  role: string;
  permissions: string[];
  companyId: number;
  companyName?: string;
}

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsData {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  language: 'tr' | 'en';
}

export default function AyarlarPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settings, setSettings] = useState<SettingsData>({
    theme: 'auto',
    notifications: {
      email: true,
      browser: true,
      sound: false
    },
    language: 'tr'
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  useEffect(() => {
    fetchUserData();
    loadSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData(prev => ({
          ...prev,
          name: data.user.name || '',
          email: data.user.email || ''
        }));
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      toast.error('Kullanıcı bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    // Local storage'dan ayarları yükle
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' || 'auto';
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '{"email":true,"browser":true,"sound":false}');
    const savedLanguage = localStorage.getItem('language') as 'tr' | 'en' || 'tr';

    setSettings({
      theme: savedTheme,
      notifications: savedNotifications,
      language: savedLanguage
    });
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Profil bilgileri güncellendi');
        fetchUserData(); // Güncel bilgileri yeniden yükle
      } else {
        const error = await response.json();
        toast.error(error.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      toast.error('Profil güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Şifre başarıyla değiştirildi');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Şifre değiştirme başarısız');
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      toast.error('Şifre değiştirilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = () => {
    // Ayarları local storage'a kaydet
    localStorage.setItem('theme', settings.theme);
    localStorage.setItem('notifications', JSON.stringify(settings.notifications));
    localStorage.setItem('language', settings.language);
    
    toast.success('Ayarlar kaydedildi');
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Yönetici',
      'MUDUR': 'Müdür',
      'OPERATOR': 'Operatör',
      'KULLANICI': 'Kullanıcı'
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Kullanıcı bulunamadı</h2>
          <p className="text-gray-600">Lütfen tekrar giriş yapın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600 mt-2">Hesap bilgilerinizi ve tercihlerinizi yönetin</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profil</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Güvenlik</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Tercihler</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name || 'İsimsiz Kullanıcı'}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{user.companyName || 'Şirket Adı Yok'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" />
                        <span>{getRoleDisplayName(user.role)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="E-posta adresiniz"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Lock className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Şifre Değiştirme
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Güvenliğiniz için düzenli olarak şifrenizi değiştirmenizi öneririz.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mevcut Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mevcut şifrenizi girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Yeni şifrenizi girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Yeni şifrenizi tekrar girin"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Theme Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>Tema</span>
                    </h3>
                    <div className="space-y-3">
                      {[
                        { value: 'light', label: 'Açık Tema', description: 'Parlak ve temiz görünüm' },
                        { value: 'dark', label: 'Koyu Tema', description: 'Göz yormayan karanlık mod' },
                        { value: 'auto', label: 'Otomatik', description: 'Sistem ayarlarına göre' }
                      ].map((theme) => (
                        <label key={theme.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value={theme.value}
                            checked={settings.theme === theme.value}
                            onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'auto' }))}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{theme.label}</div>
                            <div className="text-xs text-gray-500">{theme.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Language Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Dil</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                        { value: 'en', label: 'English', flag: '🇺🇸' }
                      ].map((lang) => (
                        <label key={lang.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="language"
                            value={lang.value}
                            checked={settings.language === lang.value}
                            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as 'tr' | 'en' }))}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm font-medium text-gray-900">{lang.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Bildirimler</span>
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'E-posta Bildirimleri', description: 'Önemli güncellemeler için e-posta al' },
                      { key: 'browser', label: 'Tarayıcı Bildirimleri', description: 'Anlık bildirimler göster' },
                      { key: 'sound', label: 'Ses Bildirimleri', description: 'Bildirim sesleri çal' }
                    ].map((notification) => (
                      <label key={notification.key} className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [notification.key]: e.target.checked
                              }
                            }))}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{notification.label}</div>
                            <div className="text-xs text-gray-500">{notification.description}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSettingsSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Ayarları Kaydet</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
