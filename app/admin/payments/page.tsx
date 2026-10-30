'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  DollarSign,
  User,
} from 'lucide-react';
import { getExplorerTxUrl } from '@/lib/payments/crypto-utils';

interface OrderItem {
  id: string;
  reference: string;
  userId: string;
  userEmail: string;
  planId: 'pro' | 'payg';
  billingCycle: 'monthly' | 'annual' | 'once';
  baseAmount: number;
  amount: number;
  currency: 'USDT';
  network: string;
  method: string;
  status: 'created' | 'awaiting_payment' | 'pending_review' | 'paid' | 'expired' | 'rejected';
  txid?: string | null;
  recipientAddress?: string;
  expiresAt: string;
  paidAt?: string | null;
  createdAt: string;
  auditLog: {
    status: string;
    timestamp: string;
    note?: string;
    actor?: string;
  }[];
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<OrderItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?status=${statusFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch admin orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApprove = async (order: OrderItem) => {
    if (!window.confirm(`Approve payment for ${order.userEmail} (${order.amount} USDT)? This will immediately activate their subscription.`)) {
      return;
    }

    setProcessingId(order.id);
    try {
      const res = await fetch('/api/admin/payments/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          action: 'approve',
          reason: 'Manual approval by administrator via admin portal',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Order ${order.reference} approved successfully!`, 'success');
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to approve order', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error executing approval', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalOrder) return;

    setProcessingId(rejectModalOrder.id);
    try {
      const res = await fetch('/api/admin/payments/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: rejectModalOrder.id,
          action: 'reject',
          reason: rejectReason.trim() || 'Payment rejected by administrator',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Order ${rejectModalOrder.reference} rejected.`, 'info');
        setRejectModalOrder(null);
        setRejectReason('');
        fetchOrders();
      } else {
        showToast(data.error || 'Failed to reject order', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error rejecting order', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const copyTxid = (txid: string) => {
    navigator.clipboard.writeText(txid);
    setCopiedTxid(txid);
    showToast('TXID copied to clipboard', 'success');
    setTimeout(() => setCopiedTxid(null), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.reference.toLowerCase().includes(q) ||
      o.userEmail.toLowerCase().includes(q) ||
      (o.txid && o.txid.toLowerCase().includes(q))
    );
  });

  const pendingCount = orders.filter((o) => o.status === 'pending_review').length;

  return (
    <div className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-surface hover:bg-surface-2 border border-line text-ink-2 hover:text-ink transition-colors"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-ink">
                  Binance & Crypto Payments Admin
                </h1>
              </div>
              <p className="text-xs text-ink-3 mt-1">
                Review and approve manual USDT transfers on BEP20 / TRC20 networks.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-2 text-ink text-xs font-medium border border-line transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'pending_review', label: 'Pending Review', count: pendingCount },
              { id: 'paid', label: 'Completed (Paid)' },
              { id: 'awaiting_payment', label: 'Awaiting Payment' },
              { id: 'all', label: 'All Orders' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'expired', label: 'Expired' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'bg-surface hover:bg-surface-2 text-ink-2 border border-line'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-mono text-[10px] flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-ink-4 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, email, txid..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-4 focus:border-accent outline-none"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="mt-6 rounded-2xl bg-surface border border-line-strong overflow-hidden shadow-subtle">
          {loading ? (
            <div className="p-12 text-center text-sm text-ink-3 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent" />
              <span>Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-ink">No orders matching this filter</p>
              <p className="text-xs text-ink-3 mt-1">Select another tab to inspect historical payments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 border-b border-line text-ink-3 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Order Ref</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount (USDT)</th>
                    <th className="px-4 py-3">Network</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">TXID / Explorer</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredOrders.map((ord) => {
                    const isProcessing = processingId === ord.id;
                    const explorerUrl = ord.txid
                      ? getExplorerTxUrl(ord.network as any, ord.txid)
                      : '';

                    return (
                      <tr key={ord.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-ink">
                          {ord.reference}
                        </td>
                        <td className="px-4 py-3 text-ink-2 max-w-[180px] truncate" title={ord.userEmail}>
                          {ord.userEmail}
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize font-medium text-ink">
                            {ord.planId === 'pro'
                              ? `Pro (${ord.billingCycle})`
                              : '15 Credits'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-accent">
                          ${ord.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-surface-2 border border-line text-ink-2">
                            {ord.network}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              ord.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : ord.status === 'pending_review'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                                : ord.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : ord.status === 'expired'
                                ? 'bg-surface-3 text-ink-3 border border-line'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {ord.txid ? (
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent underline hover:text-accent-hover flex items-center gap-0.5"
                                title="View on explorer"
                              >
                                <span>
                                  {ord.txid.slice(0, 8)}...{ord.txid.slice(-6)}
                                </span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => copyTxid(ord.txid!)}
                                className="p-1 hover:text-ink text-ink-3 transition-colors"
                                title="Copy TXID"
                              >
                                {copiedTxid === ord.txid ? (
                                  <Check className="w-3 h-3 text-accent" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-ink-4 italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-3 font-mono text-[11px]">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {ord.status !== 'paid' && ord.status !== 'rejected' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApprove(ord)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalOrder(ord);
                                  setRejectReason('');
                                }}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface hover:bg-rose-500/10 text-rose-400 border border-line hover:border-rose-500/20 font-medium text-xs transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-ink-4 text-[11px]">Finalized</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-line-strong p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-serif font-bold text-ink flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Reject Order {rejectModalOrder.reference}</span>
            </h3>
            <p className="text-xs text-ink-3 mt-1">
              Customer: {rejectModalOrder.userEmail} ({rejectModalOrder.amount} USDT on {rejectModalOrder.network})
            </p>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  Reason for Rejection:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. TXID not found on explorer, wrong receiving address, or underpaid amount."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-surface-2 border border-line focus:border-accent text-xs text-ink placeholder:text-ink-4 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-2 text-ink-2 text-xs font-medium border border-line transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectModalOrder.id}
                  className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
