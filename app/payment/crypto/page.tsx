'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/app/context/LanguageContext';
import { useToast } from '@/app/context/ToastContext';
import { Button } from '@/components/ui/Button';
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
  Zap,
  CheckCircle2,
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

const DEMO_ADDRESSES: Record<string, string> = {
  BEP20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  TRC20: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
};

function createPreviewOrder(network: CryptoNetwork): OrderData {
  return {
    id: 'preview-order',
    reference: 'ORD-USDT-8492',
    planId: 'pro',
    billingCycle: 'annual',
    baseAmount: 95.88,
    amount: 95.92,
    currency: 'USDT',
    network,
    status: 'awaiting_payment',
    recipientAddress: DEMO_ADDRESSES[network] || DEMO_ADDRESSES.BEP20,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    remainingSeconds: 1800,
    isExpired: false,
    txid: '0x8f9d2a1b4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
  };
}

function CryptoPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isRtl, t } = useLanguage();
  const { showToast } = useToast();

  const referenceParam = searchParams.get('reference') || '';
  const initialNetwork = (searchParams.get('network') as CryptoNetwork) || 'BEP20';

  const [order, setOrder] = useState<OrderData | null>(() =>
    referenceParam ? null : createPreviewOrder(initialNetwork)
  );
  const [loading, setLoading] = useState<boolean>(Boolean(referenceParam));
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork>(initialNetwork);
  const [txid, setTxid] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState<number>(30 * 60);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = useCallback(
    async (ref: string) => {
      if (ref === 'ORD-DEMO') {
        const preview = createPreviewOrder(initialNetwork);
        setOrder(preview);
        setSelectedNetwork(preview.network);
        setCountdown(preview.remainingSeconds);
        setLoading(false);
        return;
      }
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
    [router, initialNetwork]
  );

  useEffect(() => {
    if (referenceParam) {
      fetchOrder(referenceParam);
    } else {
      setOrder(createPreviewOrder(initialNetwork));
      setLoading(false);
    }
  }, [referenceParam, initialNetwork, fetchOrder]);

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
    if (order?.status !== 'pending_review' || order.id === 'preview-order') return;
    const pollInterval = setInterval(() => {
      if (order?.reference) {
        fetchOrder(order.reference);
      }
    }, 8000);
    return () => clearInterval(pollInterval);
  }, [order?.status, order?.reference, order?.id, fetchOrder]);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedField(fieldName);
    showToast(t('common_copied'), 'success');
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldName ? null : prev));
    }, 2000);
  };

  // Switch network
  const handleNetworkChange = async (newNetwork: CryptoNetwork) => {
    if (newNetwork === selectedNetwork || !order) return;
    setSelectedNetwork(newNetwork);
    if (order.id === 'preview-order') {
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              network: newNetwork,
              recipientAddress: DEMO_ADDRESSES[newNetwork] || DEMO_ADDRESSES.BEP20,
            }
          : null
      );
      return;
    }
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
        showToast(data.message || t('crypto_pending_title'), 'info');
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
          <span className="text-sm text-ink-2">{t('crypto_loading')}</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-xl bg-surface border border-line-strong shadow-subtle">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold text-ink">{t('crypto_not_found_title')}</h2>
          <p className="text-sm text-ink-2 mt-2">
            {t('crypto_not_found_desc')}
          </p>
          <Link
            href="/pricing"
            className="btn mt-6 min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-on-accent font-medium text-sm hover:bg-accent-hover transition-colors"
          >
            <span>{t('crypto_restart_btn')}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    );
  }

  const displayedTxid = txid.trim() || order.txid || '';

  return (
    <div
      className="flex-1 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full overflow-x-clip"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Expired State Notice */}
      {order.status === 'expired' && (
        <div className="mb-6 p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{t('crypto_expired_title')}</h3>
            <p className="text-xs text-ink-2 mt-1">{t('crypto_expired_desc')}</p>
            <Link
              href="/pricing"
              className="btn mt-3 min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-danger text-on-accent text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <span>{t('crypto_restart_btn')}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Pending Review State Notice */}
      {order.status === 'pending_review' && (
        <div className="mb-6 p-5 rounded-xl bg-warning-soft border border-warning/30 text-warning flex items-start gap-3.5 animate-in fade-in">
          <RefreshCw className="w-5 h-5 shrink-0 mt-0.5 text-warning animate-spin" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-warning">{t('crypto_pending_title')}</h3>
            <p className="text-xs text-warning mt-1 leading-relaxed">{t('crypto_pending_desc')}</p>
            {order.txid && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono min-w-0">
                <span className="text-warning shrink-0">TXID:</span>
                <a
                  href={getExplorerTxUrl(order.network, order.txid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  style={{ unicodeBidi: 'isolate' }}
                  className="underline hover:text-ink flex items-center gap-1 break-all min-w-0 [unicode-bidi:isolate]"
                >
                  <span className="break-all">{order.txid}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.txid!, 'pending_txid')}
                  className="btn min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface border border-line-strong text-ink text-[11px] font-mono hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
                >
                  {copiedField === 'pending_txid' ? (
                    <Check className="w-3 h-3 text-success shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 shrink-0" />
                  )}
                  <span>{copiedField === 'pending_txid' ? t('common_copied') : t('crypto_copy_txid')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Start Column: Payment Details & QR Code */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Main Card */}
          <div className="rounded-2xl bg-surface border border-line-strong p-4 sm:p-8 shadow-subtle min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-strong pb-4 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-mono uppercase tracking-wider text-ink-2 block truncate">
                  {order.planId === 'pro'
                    ? `JobMatch Pro (${order.billingCycle})`
                    : '15 AI Generation Credits'}
                </span>
                <h1 className="text-lg sm:text-2xl font-serif font-bold text-ink mt-0.5">{t('crypto_title')}</h1>
              </div>

              {/* Countdown badge */}
              <div
                dir="ltr"
                style={{ unicodeBidi: 'isolate' }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold shrink-0 [unicode-bidi:isolate] ${
                  countdown < 300
                    ? 'bg-danger-soft border-danger/30 text-danger animate-pulse'
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
                {t('crypto_select_network')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleNetworkChange('BEP20')}
                  disabled={order.status === 'expired'}
                  className={`min-h-[44px] p-3.5 rounded-xl border text-start transition-all flex flex-col gap-1 cursor-pointer ${
                    selectedNetwork === 'BEP20'
                      ? 'bg-accent/10 border-accent text-ink shadow-sm'
                      : 'bg-surface-2 border-line-strong hover:border-accent/40 text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">BNB Smart Chain</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line-strong text-ink-2">
                      BEP20
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-2">{t('crypto_lowest_fee')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNetworkChange('TRC20')}
                  disabled={order.status === 'expired'}
                  className={`min-h-[44px] p-3.5 rounded-xl border text-start transition-all flex flex-col gap-1 cursor-pointer ${
                    selectedNetwork === 'TRC20'
                      ? 'bg-accent/10 border-accent text-ink shadow-sm'
                      : 'bg-surface-2 border-line-strong hover:border-accent/40 text-ink-2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">TRON</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line-strong text-ink-2">
                      TRC20
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-2">{t('crypto_standard_fee')}</span>
                </button>
              </div>
            </div>

            {/* Amount display with copy */}
            <div className="mt-6 p-4 rounded-xl bg-surface-2 border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <span className="text-xs text-ink-2 block">{t('crypto_exact_amount_label')}</span>
                <div
                  dir="ltr"
                  style={{ unicodeBidi: 'isolate' }}
                  className="flex items-baseline gap-2 mt-0.5 [unicode-bidi:isolate]"
                >
                  <span className="text-3xl font-mono font-bold text-accent tracking-tight">
                    {order.amount.toFixed(2)}
                  </span>
                  <span className="text-sm font-mono font-semibold text-ink-2">USDT</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(order.amount.toFixed(2), 'amount')}
                className="btn min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-2 text-ink text-xs font-mono font-medium border border-line-strong transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'amount' ? t('common_copied') : t('crypto_copy_amount')}</span>
              </button>
            </div>

            {/* Warning about exact amount */}
            <p className="mt-2 text-[11px] text-warning leading-normal flex items-start gap-1.5">
              <span className="text-warning font-bold shrink-0">⚠️</span>
              <span>{t('crypto_exact_amount_warning')}</span>
            </p>

            {/* Receiving Wallet Address with QR code */}
            <div className="mt-6 min-w-0">
              <label className="block text-xs font-medium text-ink-2 mb-2">
                {t('crypto_deposit_wallet_label')} ({selectedNetwork}):
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-center min-w-0">
                {/* QR Code */}
                <div className="shrink-0">
                  <QrCodeSvg value={order.recipientAddress} size={140} />
                </div>

                {/* Address Box */}
                <div className="flex-1 min-w-0 w-full space-y-3">
                  <div
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    data-testid="crypto-wallet-address"
                    className="p-3.5 rounded-xl bg-surface-2 border border-line-strong font-mono text-xs text-ink break-all select-all min-w-0 [unicode-bidi:isolate]"
                  >
                    {order.recipientAddress || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <button
                      type="button"
                      data-testid="copy-wallet-address-btn"
                      onClick={() => copyToClipboard(order.recipientAddress, 'address')}
                      className="btn flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-on-accent text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer min-w-0"
                    >
                      {copiedField === 'address' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{copiedField === 'address' ? t('common_copied') : t('crypto_copy_address')}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="copy-order-ref-btn"
                      onClick={() => copyToClipboard(order.reference, 'ref')}
                      className="btn min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-surface hover:bg-surface-2 text-ink-2 hover:text-ink text-xs font-mono border border-line-strong transition-colors cursor-pointer min-w-0 max-w-full"
                      title={t('crypto_copy_ref')}
                    >
                      <span
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                        className="truncate min-w-0 [unicode-bidi:isolate]"
                      >
                        {copiedField === 'ref' ? t('common_copied') : `Ref: ${order.reference}`}
                      </span>
                      {copiedField === 'ref' ? <Check className="w-3 h-3 text-success shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* End Column: Step Instructions & TXID Submission */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          {/* Instructions Card */}
          <div className="rounded-2xl bg-surface border border-line-strong p-5 sm:p-6 shadow-subtle space-y-4 min-w-0">
            <h3 className="font-semibold text-base text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              <span>{t('crypto_payment_steps_title')}</span>
            </h3>

            <ol className="space-y-3 text-xs text-ink-2">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                  1
                </span>
                <span className="leading-relaxed min-w-0">{t('crypto_step1')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                  2
                </span>
                <span className="leading-relaxed min-w-0">{t('crypto_step2')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                  3
                </span>
                <span className="leading-relaxed min-w-0">{t('crypto_step3')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                  4
                </span>
                <span className="leading-relaxed min-w-0">{t('crypto_step4')}</span>
              </li>
            </ol>
          </div>

          {/* TXID Verification Form */}
          <div className="rounded-2xl bg-surface border border-line-strong p-5 sm:p-6 shadow-subtle min-w-0">
            <h3 className="font-semibold text-base text-ink mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent shrink-0" />
              <span>{t('crypto_submit_txid_title')}</span>
            </h3>
            <p className="text-xs text-ink-2 mb-4 leading-relaxed">
              {t('crypto_submit_txid_desc')}
            </p>

            <form onSubmit={handleVerify} className="space-y-4 min-w-0">
              <div className="min-w-0">
                <input
                  type="text"
                  dir="ltr"
                  style={{ unicodeBidi: 'isolate' }}
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  placeholder={t('crypto_txid_placeholder')}
                  disabled={verifying || order.status === 'expired'}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line-strong focus:border-accent text-xs font-mono text-ink placeholder:text-ink-2/60 outline-none transition-colors [unicode-bidi:isolate]"
                />
              </div>

              {/* TXID Preview & Copy Box when TXID is present */}
              {displayedTxid && (
                <div className="p-3 rounded-xl bg-surface-2 border border-line-strong flex items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase text-ink-2 block">TXID</span>
                    <span
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      data-testid="crypto-txid-display"
                      className="text-xs font-mono text-ink break-all block min-w-0 [unicode-bidi:isolate]"
                    >
                      {displayedTxid}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="copy-txid-btn"
                    onClick={() => copyToClipboard(displayedTxid, 'txid')}
                    className="btn min-h-[44px] px-3 py-2 rounded-lg bg-surface hover:bg-surface-2 border border-line-strong text-xs font-mono text-ink inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedField === 'txid' ? (
                      <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{copiedField === 'txid' ? t('common_copied') : t('crypto_copy_txid')}</span>
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={verifying}
                loadingText={t('crypto_verifying')}
                disabled={!txid.trim() || order.status === 'expired'}
                startIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                <span>{t('crypto_verify_btn')}</span>
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-line-strong text-[11px] text-ink-2 flex flex-wrap items-center justify-between gap-2">
              <span>{t('crypto_secure_verification')}</span>
              <span className="font-mono text-ink">BscScan &amp; TronGrid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CryptoPaymentPage() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between overflow-x-clip">
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
