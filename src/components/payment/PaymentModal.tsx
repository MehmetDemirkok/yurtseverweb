'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accommodationCount: number;
  accommodationSaleCount: number;
  message: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  accommodationCount,
  accommodationSaleCount,
  message,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'stripe'>('manual');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setPaymentStatus('idle');
      setError('');
      setPaymentMethod('manual');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    setPaymentStatus('processing');

    try {
      // Ödeme kaydı oluştur
      const paymentRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: 'PRO',
          paymentMethod: paymentMethod,
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.error || 'Ödeme kaydı oluşturulamadı');
      }

      const { payment } = await paymentRes.json();

      // Manuel ödeme için direkt tamamla (gerçek uygulamada Stripe entegrasyonu olacak)
      if (paymentMethod === 'manual') {
        // Ödeme tamamla
        const completeRes = await fetch('/api/payment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentId: payment.id,
            transactionId: `MANUAL_${Date.now()}`,
            status: 'COMPLETED',
          }),
        });

        if (!completeRes.ok) {
          throw new Error('Ödeme tamamlanamadı');
        }

        setPaymentStatus('success');
        
        // 2 saniye sonra modal'ı kapat ve sayfayı yenile
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        // Stripe entegrasyonu burada olacak
        // Şimdilik manuel ödeme kullanıyoruz
        setError('Stripe entegrasyonu yakında eklenecek');
        setPaymentStatus('error');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Ödeme işlemi sırasında bir hata oluştu');
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFree = () => {
    // Free planda devam et - sadece modal'ı kapat
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)' }}>
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Pro Plan'a Geçiş</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Limit Bilgisi */}
          <div className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--warning)' }}>Ücretsiz Plan Limitine Ulaştınız</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Konaklama Alış:</span>
                    <span className="font-semibold ml-2" style={{ color: 'var(--text-primary)' }}>
                      {accommodationCount} / 10
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Konaklama Satış:</span>
                    <span className="font-semibold ml-2" style={{ color: 'var(--text-primary)' }}>
                      {accommodationSaleCount} / 10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Plan Özellikleri */}
          <div className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--primary)' }}>Pro Plan Özellikleri</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Sınırsız konaklama alış kaydı</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Sınırsız konaklama satış kaydı</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Tüm özelliklere erişim</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>1 yıl geçerli</span>
              </li>
            </ul>
          </div>

          {/* Ödeme Yöntemi */}
          {paymentStatus === 'idle' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ödeme Yöntemi
              </label>
              <div className="space-y-2">
                <label 
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--card-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={paymentMethod === 'manual'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'manual' | 'stripe')}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Manuel Ödeme (Test)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Test amaçlı - ödeme otomatik onaylanır</div>
                  </div>
                </label>
                <label 
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer opacity-50"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'manual' | 'stripe')}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--primary)' }}
                    disabled
                  />
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Kredi Kartı (Stripe)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Yakında eklenecek</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Fiyat */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--muted-background)' }}>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Toplam Tutar:</span>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>$10.00 USD</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border rounded-lg p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {paymentStatus === 'success' && (
            <div className="border rounded-lg p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                  Ödeme başarıyla tamamlandı! Pro plan aktif edildi.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {paymentStatus === 'idle' && (
              <>
                <button
                  onClick={handleContinueFree}
                  className="flex-1 px-4 py-3 border rounded-lg transition-colors font-medium"
                  style={{ 
                    borderColor: 'var(--card-border)', 
                    color: 'var(--text-secondary)' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Ücretsiz Planda Devam Et
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'white' 
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                    }
                  }}
                >
                  {loading ? 'İşleniyor...' : '$10.00 Öde ve Pro Plan\'a Geç'}
                </button>
              </>
            )}
            {paymentStatus === 'success' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg transition-colors font-medium"
                style={{ 
                  backgroundColor: 'var(--success)', 
                  color: 'white' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Tamam
              </button>
            )}
            {paymentStatus === 'error' && (
              <>
                <button
                  onClick={handleContinueFree}
                  className="flex-1 px-4 py-3 border rounded-lg transition-colors font-medium"
                  style={{ 
                    borderColor: 'var(--card-border)', 
                    color: 'var(--text-secondary)' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Ücretsiz Planda Devam Et
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 px-4 py-3 rounded-lg transition-colors font-medium"
                  style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'white' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                >
                  Tekrar Dene
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

