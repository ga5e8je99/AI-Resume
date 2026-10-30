'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import { QrCodeSvg } from '@/components/ui/QrCodeSvg';
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { CryptoNetwork } from '@/app/models/Order';
import { getExplorerTxUrl } from '@/lib/payments/crypto-utils';

interface OrderData {
  id: string;
  reference: string;
  planId: 'pro' | 'payg';
  billingCycle: 'monthly' | 'annual' | 'once';
  baseAmount: number;
  amount: number;
  currency: 'USDT';
  network: CryptoNetwork;
  status: 'awaiting_payment' | 'pending_review' | 'paid' | 'expired' | 'rejected';
  recipientAddress: string;
  expiresAt: string;
  remainingSeconds: number;
  isExpired: boolean;
  txid?: string | null;
}

// Multi-language step-by-step instructions
const INSTRUCTIONS: Record<
  string,
  {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    exactAmountWarning: string;
    networkWarning: string;
    txidPlaceholder: string;
    verifyButton: string;
    verifying: string;
    pendingTitle: string;
    pendingDesc: string;
    expiredTitle: string;
    expiredDesc: string;
    restartBtn: string;
    copyAddress: string;
    copied: string;
  }
> = {
  en: {
    title: 'Pay with Binance / Crypto (USDT)',
    step1: 'Open your Binance App or preferred Web3 crypto wallet (Trust Wallet, MetaMask, etc.).',
    step2: 'Initiate a USDT withdrawal/transfer and select the exact network shown below.',
    step3: 'Send the exact amount including cents to match your payment automatically.',
    step4: 'Copy the Transaction Hash (TXID) from your wallet and paste it below to verify.',
    exactAmountWarning:
      'Please send the EXACT amount (including decimal cents). This unique amount pairs your transfer with your account.',
    networkWarning: 'Make sure your wallet transfer network matches the selected network exactly.',
    txidPlaceholder: 'Paste your Transaction Hash (TXID) here...',
    verifyButton: 'Verify Payment',
    verifying: 'Verifying on-chain...',
    pendingTitle: 'Payment Pending Review',
    pendingDesc:
      'Your transaction was recorded and is awaiting blockchain confirmations or manual review. Your account will be upgraded automatically.',
    expiredTitle: 'Order Expired',
    expiredDesc: 'This payment order has expired. Please initiate a new order to generate a fresh payment address.',
    restartBtn: 'Choose Plan & Restart',
    copyAddress: 'Copy Address',
    copied: 'Copied!',
  },
  ar: {
    title: 'الدفع عبر باينانس / العملات الرقمية (USDT)',
    step1: 'افتح تطبيق Binance أو محفظتك الرقمية (Trust Wallet، MetaMask، إلخ).',
    step2: 'اختر سحب أو تحويل عملة USDT وتأكد من اختيار نفس الشبكة المحددة أدناه.',
    step3: 'أرسل المبلغ المطلوب بدقة متناهية (شاملاً القروش) ليتم تفعيل حسابك تلقائياً.',
    step4: 'انسخ كود العملية (TXID / Hash) والصقه في الحقل أدناه لتأكيد الدفع فوراً.',
    exactAmountWarning:
      'تنبيه مهم: يرجى تحويل المبلغ الدقيق تماماً بما فيه السنتات لربط التحويل بحسابك تلقائياً.',
    networkWarning: 'تأكد من اختيار نفس الشبكة المحددة بالضبط عند التحويل لتجنب ضياع الرصيد.',
    txidPlaceholder: 'الصق كود العملية (TXID / Hash) هنا...',
    verifyButton: 'تأكيد والتحقق من الدفع',
    verifying: 'جاري التحقق على البلوكشين...',
    pendingTitle: 'الدفعة قيد المراجعة والتأكيد',
    pendingDesc:
      'تم تسجيل العملية وهي بانتظار اكتمال التأكيدات على البلوكشين أو المراجعة الإدارية. سيتم تفعيل حسابك تلقائياً فوراً.',
    expiredTitle: 'انتهت صلاحية أمر الدفع',
    expiredDesc: 'انتهت فترة الـ 30 دقيقة المخصصة لهذا الطلب. يرجى إنشاء طلب جديد للحصول على مبلغ ومرجع جديد.',
    restartBtn: 'اختيار الخطة والبدء مجدداً',
    copyAddress: 'نسخ العنوان',
    copied: 'تم النسخ!',
  },
  fr: {
    title: 'Payer avec Binance / Crypto (USDT)',
    step1: 'Ouvrez votre application Binance ou votre portefeuille crypto (Trust Wallet, etc.).',
    step2: 'Lancez un transfert en USDT et sélectionnez exactement le réseau indiqué ci-dessous.',
    step3: 'Transférez le montant EXACT avec les centimes pour une détection automatique.',
    step4: 'Copiez l’identifiant de transaction (TXID) et collez-le ci-dessous pour valider.',
    exactAmountWarning:
      'Veuillez envoyer le montant EXACT (centimes inclus) pour que votre paiement soit automatiquement associé.',
    networkWarning: 'Vérifiez impérativement que le réseau sélectionné correspond exactement au vôtre.',
    txidPlaceholder: 'Collez le hash de transaction (TXID) ici...',
    verifyButton: 'Vérifier le paiement',
    verifying: 'Vérification sur la blockchain...',
    pendingTitle: 'Paiement en attente de validation',
    pendingDesc:
      'Votre transaction est en cours de confirmation ou de vérification manuelle. Votre compte sera activé automatiquement.',
    expiredTitle: 'Délai dépassé',
    expiredDesc: 'Cette commande a expiré. Veuillez relancer un paiement pour générer un montant actualisé.',
    restartBtn: 'Choisir un forfait',
    copyAddress: 'Copier l’adresse',
    copied: 'Copié !',
  },
  de: {
    title: 'Zahlung mit Binance / Krypto (USDT)',
    step1: 'Öffnen Sie Ihre Binance-App oder Ihr Krypto-Wallet (Trust Wallet, MetaMask usw.).',
    step2: 'Senden Sie USDT und wählen Sie exakt das unten angezeigte Netzwerk aus.',
    step3: 'Senden Sie den EXAKTEN Betrag inklusive Dezimalstellen zur automatischen Zuordnung.',
    step4: 'Kopieren Sie den Transaktions-Hash (TXID) und fügen Sie ihn unten ein.',
    exactAmountWarning:
      'Bitte überweisen Sie den GENAUEN Betrag inklusive Cent-Suffix zur automatischen Zuordnung.',
    networkWarning: 'Stellen Sie sicher, dass das Netzwerk in Ihrer Wallet exakt übereinstimmt.',
    txidPlaceholder: 'Transaktions-Hash (TXID) hier einfügen...',
    verifyButton: 'Zahlung verifizieren',
    verifying: 'Wird auf der Blockchain geprüft...',
    pendingTitle: 'Zahlung wird geprüft',
    pendingDesc:
      'Ihre Transaktion wurde erfasst und wartet auf Netzwerkbestätigungen oder manuelle Prüfung.',
    expiredTitle: 'Bestellung abgelaufen',
    expiredDesc: 'Dieser Zahlungsauftrag ist abgelaufen. Bitte starten Sie einen neuen Vorgang.',
    restartBtn: 'Paket neu wählen',
    copyAddress: 'Adresse kopieren',
    copied: 'Kopiert!',
  },
  es: {
    title: 'Pagar con Binance / Cripto (USDT)',
    step1: 'Abre tu aplicación Binance o tu billetera cripto preferida.',
    step2: 'Inicia una transferencia en USDT y selecciona la red exacta indicada abajo.',
    step3: 'Envía el importe EXACTO con decimales para la vinculación automática.',
    step4: 'Copia el hash de transacción (TXID) y pégalo abajo para verificar.',
    exactAmountWarning:
      'Envía la cantidad EXACTA incluyendo los decimales para que el sistema asocie tu pago automáticamente.',
    networkWarning: 'Asegúrate de que la red de envío coincida exactamente con la red seleccionada.',
    txidPlaceholder: 'Pega el hash de transacción (TXID) aquí...',
    verifyButton: 'Verificar pago',
    verifying: 'Verificando en la blockchain...',
    pendingTitle: 'Pago en revisión',
    pendingDesc:
      'Tu transacción ha sido recibida y está pendiente de confirmaciones en la red o revisión manual.',
    expiredTitle: 'Orden expirada',
    expiredDesc: 'Esta orden de pago ha expirado. Por favor, crea una nueva orden.',
    restartBtn: 'Seleccionar plan',
    copyAddress: 'Copiar dirección',
    copied: '¡Copiado!',
  },
  tr: {
    title: 'Binance / Kripto ile Öde (USDT)',
    step1: 'Binance uygulamanızı veya tercih ettiğiniz kripto cüzdanınızı açın.',
    step2: 'USDT transferi başlatın ve aşağıda belirtilen ağı tam olarak seçin.',
    step3: 'Otomatik eşleşme için küsurat dahil TAM tutarı gönderin.',
    step4: 'İşlem kodunu (TXID) kopyalayıp onaylamak için aşağıdaki alana yapıştırın.',
    exactAmountWarning:
      'Ödemenizin hesabınızla otomatik eşleşmesi için lütfen küsuratlar dahil TAM tutarı gönderin.',
    networkWarning: 'Gönderim ağının seçilen ağla birebir aynı olduğundan emin olun.',
    txidPlaceholder: 'İşlem kodunu (TXID) buraya yapıştırın...',
    verifyButton: 'Ödemeyi Doğrula',
    verifying: 'Blokzincirde doğrulanıyor...',
    pendingTitle: 'Ödeme İncelemede',
    pendingDesc: 'İşleminiz kaydedildi ve ağ onayları veya yönetici onayı bekliyor. Hesabınız yakında güncellenecek.',
    expiredTitle: 'Sipariş Süresi Doldu',
    expiredDesc: 'Bu ödeme siparişinin süresi doldu. Lütfen yeni bir sipariş oluşturun.',
    restartBtn: 'Plan Seç ve Yeniden Başlat',
    copyAddress: 'Adresi Kopyala',
    copied: 'Kopyalandı!',
  },
};

function CryptoPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, isRtl } = useLanguage();
  const { showToast } = useToast();

  const referenceParam = searchParams.get('reference') || '';
  const initialNetwork = (searchParams.get('network') as CryptoNetwork) || 'BEP20';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork>(initialNetwork);
  const [txid, setTxid] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState<number>(30 * 60);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const t = INSTRUCTIONS[language] || INSTRUCTIONS.en;

  // Fetch order details
  const fetchOrder = useCallback(
    async (ref: string) => {
      try {
        const res = await fetch(`/api/payments/crypto/order?reference=${encodeURIComponent(ref)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          setSelectedNetwork(data.order.network);
          setCountdown(data.order.remainingSeconds);
          if (data.order.txid) {
            setTxid(data.order.txid);
          }
          if (data.order.status === 'paid') {
            router.push(`/payment/success?reference=${data.order.reference}&provider=manual_crypto`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (referenceParam) {
      fetchOrder(referenceParam);
    } else {
      setLoading(false);
    }
  }, [referenceParam, fetchOrder]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (order && order.status === 'awaiting_payment') {
            setOrder((o) => (o ? { ...o, status: 'expired', isExpired: true } : null));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, order]);

  // Auto-poll if pending_review
  useEffect(() => {
    if (order?.status !== 'pending_review') return;
    const pollInterval = setInterval(() => {
      if (order?.reference) {
        fetchOrder(order.reference);
      }
    }, 8000);
    return () => clearInterval(pollInterval);
  }, [order?.status, order?.reference, fetchOrder]);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(t.copied, 'success');
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldName ? null : prev));
    }, 2000);
  };

  // Switch network
  const handleNetworkChange = async (newNetwork: CryptoNetwork) => {
    if (newNetwork === selectedNetwork || !order) return;
    setSelectedNetwork(newNetwork);
    // Reload order with new network parameter
    router.push(`/checkout?plan=${order.planId}&billingCycle=${order.billingCycle}&currency=USDT&network=${newNetwork}`);
  };

  // Submit TXID for on-chain verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txid.trim() || !order) return;

    setVerifying(true);
    try {
      const res = await fetch('/api/payments/crypto/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: order.reference,
          txid: txid.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && data.status === 'paid') {
        showToast(data.message || 'Payment confirmed!', 'success');
        router.push(`/payment/success?reference=${order.reference}&provider=manual_crypto`);
      } else if (data.status === 'pending_review') {
        setOrder((prev) => (prev ? { ...prev, status: 'pending_review' } : null));
        showToast(data.message || t.pendingTitle, 'info');
      } else {
        showToast(data.message || data.error || 'Verification failed. Please check the TXID.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Network error verifying payment.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          <span className="text-sm text-ink-2">Loading secure crypto checkout...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-xl bg-surface border border-line-strong shadow-subtle">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-ink">Order Not Found</h2>
          <p className="text-sm text-ink-2 mt-2">
            The payment order could not be retrieved or has expired. Please select a plan from the pricing page.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-on-accent font-medium text-sm hover:bg-accent-hover transition-colors"
          >
            <span>{t.restartBtn}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Expired State Notice */}
      {order.status === 'expired' && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{t.expiredTitle}</h3>
            <p className="text-xs text-rose-300/80 mt-1">{t.expiredDesc}</p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors"
            >
              <span>{t.restartBtn}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Pending Review State Notice */}
      {order.status === 'pending_review' && (
        <div className="mb-6 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3.5 animate-in fade-in">
          <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400 animate-spin" />
          <div className="flex-1">
            <h3 className="font-semibold text-base text-amber-200">{t.pendingTitle}</h3>
            <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">{t.pendingDesc}</p>
            {order.txid && (
              <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                <span className="text-amber-400">TXID:</span>
                <a
                  href={getExplorerTxUrl(order.network, order.txid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white flex items-center gap-1"
                >
                  {order.txid.slice(0, 16)}...{order.txid.slice(-8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Payment Details & QR Code */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Card */}
          <div className="rounded-2xl bg-surface border border-line-strong p-6 sm:p-8 shadow-subtle">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
                  {order.planId === 'pro'
                    ? `JobMatch Pro (${order.billingCycle})`
                    : '15 AI Generation Credits'}
                </span>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-ink mt-0.5">{t.title}</h1>
              </div>

              {/* Countdown badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
                  countdown < 300
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                    : 'bg-accent/10 border-accent/20 text-accent'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeFormatted}</span>
              </div>
            </div>

            {/* Network Selector Tabs */}
            <div className="mt-6">
              <label className="block text-xs font-medium text-ink-2 mb-2">
                1. Select Crypto Network:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleNetworkChange('BEP20')}
                  disabled={order.status === 'expired'}
                  className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col gap-1 ${
                    selectedNetwork === 'BEP20'
                      ? 'bg-accent/10 border-accent text-ink shadow-sm'
                      : 'bg-surface-2 border-line hover:border-line-strong text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">BNB Smart Chain</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-3">
                      BEP20
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-3">Lowest fee (~$0.15)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNetworkChange('TRC20')}
                  disabled={order.status === 'expired'}
                  className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col gap-1 ${
                    selectedNetwork === 'TRC20'
                      ? 'bg-accent/10 border-accent text-ink shadow-sm'
                      : 'bg-surface-2 border-line hover:border-line-strong text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">TRON</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-ink-3">
                      TRC20
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-3">Standard transfer (~$1.00)</span>
                </button>
              </div>
            </div>

            {/* Amount display with copy */}
            <div className="mt-6 p-4 rounded-xl bg-surface-2 border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-ink-3 block">Exact Amount to Send (USDT):</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-mono font-bold text-accent tracking-tight">
                    {order.amount.toFixed(2)}
                  </span>
                  <span className="text-sm font-mono font-semibold text-ink-2">USDT</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(order.amount.toFixed(2), 'amount')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-3 text-ink text-xs font-mono font-medium border border-line transition-colors"
              >
                {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'amount' ? t.copied : 'Copy Exact Amount'}</span>
              </button>
            </div>

            {/* Warning about exact amount */}
            <p className="mt-2 text-[11px] text-amber-400/90 leading-normal flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">⚠️</span>
              <span>{t.exactAmountWarning}</span>
            </p>

            {/* Receiving Wallet Address with QR code */}
            <div className="mt-6">
              <label className="block text-xs font-medium text-ink-2 mb-2">
                Deposit Wallet Address ({selectedNetwork}):
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <QrCodeSvg value={order.recipientAddress} size={150} />
                </div>

                {/* Address Box */}
                <div className="flex-1 w-full space-y-3">
                  <div className="p-3.5 rounded-xl bg-surface-2 border border-line font-mono text-xs text-ink break-all select-all">
                    {order.recipientAddress || 'Address not configured in server env'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.recipientAddress, 'address')}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-on-accent text-xs font-medium hover:bg-accent-hover transition-colors"
                    >
                      {copiedField === 'address' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'address' ? t.copied : t.copyAddress}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.reference, 'ref')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-surface hover:bg-surface-2 text-ink-2 text-xs font-mono border border-line transition-colors"
                      title="Copy Reference"
                    >
                      <span>Ref: {order.reference}</span>
                      {copiedField === 'ref' ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Step Instructions & TXID Submission */}
        <div className="lg:col-span-5 space-y-6">
          {/* Instructions Card */}
          <div className="rounded-2xl bg-surface border border-line-strong p-6 shadow-subtle space-y-4">
            <h3 className="font-semibold text-base text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Payment Steps</span>
            </h3>

            <ol className="space-y-3 text-xs text-ink-2">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                  1
                </span>
                <span className="leading-relaxed">{t.step1}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                  2
                </span>
                <span className="leading-relaxed">{t.step2}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                  3
                </span>
                <span className="leading-relaxed">{t.step3}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                  4
                </span>
                <span className="leading-relaxed">{t.step4}</span>
              </li>
            </ol>
          </div>

          {/* TXID Verification Form */}
          <div className="rounded-2xl bg-surface border border-line-strong p-6 shadow-subtle">
            <h3 className="font-semibold text-base text-ink mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>Submit Transaction Hash (TXID)</span>
            </h3>
            <p className="text-xs text-ink-3 mb-4 leading-relaxed">
              Once you finish the transfer in Binance or your wallet, copy the TXID / Transaction Hash and verify it below.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  placeholder={t.txidPlaceholder}
                  disabled={verifying || order.status === 'expired'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line focus:border-accent text-xs font-mono text-ink placeholder:text-ink-4 outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || !txid.trim() || order.status === 'expired'}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-on-accent font-semibold text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-subtle"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.verifying}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.verifyButton}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-line text-[11px] text-ink-3 flex items-center justify-between">
              <span>Secure On-Chain Verification</span>
              <span className="font-mono text-ink-2">BscScan & TronGrid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CryptoPaymentPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        }
      >
        <CryptoPaymentContent />
      </Suspense>
      <Footer />
    </div>
  );
}
