'use client';

import React, { useState } from 'react';
import { Download, Trash2, AlertTriangle, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

export default function PrivacySettingsSection() {
  const { user, logout } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const toast = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'email'>('password');
  const [password, setPassword] = useState('');
  const [confirmToken, setConfirmToken] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [ackChecked, setAckChecked] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExportData = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/account/export', { method: 'GET' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || t('privacy_export_error'));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `jobmatch-data-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('privacy_export_success'));
    } catch {
      toast.error(t('privacy_export_error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendDeleteCode = async () => {
    if (isSendingCode) return;
    setIsSendingCode(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.message || t('privacy_delete_error'));
        return;
      }
      setCodeSent(true);
      toast.success(t('privacy_delete_code_sent'));
    } catch {
      setDeleteError(t('privacy_delete_error'));
    } finally {
      setIsSendingCode(false);
    }
  };

  const canConfirmDelete =
    ackChecked &&
    confirmText.trim().toUpperCase() === 'DELETE' &&
    ((authMethod === 'password' && password.length > 0) ||
      (authMethod === 'email' && confirmToken.trim().length > 0));

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirmDelete || isDeletingAccount) return;

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(authMethod === 'password' ? { password } : { confirmToken: confirmToken.trim() }),
          confirmText: confirmText.trim(),
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setDeleteError(data.message || t('privacy_delete_error'));
        return;
      }

      toast.success(t('privacy_delete_success'));
      setIsDeleteModalOpen(false);
      await logout();
    } catch {
      setDeleteError(t('privacy_delete_error'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const resetModal = () => {
    if (isDeletingAccount) return;
    setIsDeleteModalOpen(false);
    setPassword('');
    setConfirmToken('');
    setConfirmText('');
    setAckChecked(false);
    setDeleteError(null);
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="pt-6 border-t border-line-strong space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
        <h4 className="text-base font-serif font-bold text-ink">{t('privacy_section_title')}</h4>
      </div>
      <p className="text-xs text-ink-2">{t('privacy_section_desc')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* 1. Export My Data */}
        <div className="p-4 rounded-xl border border-line-strong bg-surface-2 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-ink">{t('privacy_export_title')}</h5>
            <p className="text-xs text-ink-2 leading-relaxed">{t('privacy_export_desc')}</p>
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              isLoading={isExporting}
              disabled={isExporting}
              onClick={handleExportData}
              startIcon={<Download className="w-3.5 h-3.5" />}
            >
              <span>{isExporting ? t('privacy_export_loading') : t('privacy_export_btn')}</span>
            </Button>
          </div>
        </div>

        {/* 2. Delete My Account */}
        <div className="p-4 rounded-xl border border-danger/30 bg-danger/5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-danger">{t('privacy_delete_title')}</h5>
            <p className="text-xs text-ink-2 leading-relaxed">{t('privacy_delete_desc')}</p>
          </div>
          <div>
            <Button
              size="sm"
              variant="danger"
              disabled={Boolean(user?.isDemo)}
              onClick={() => setIsDeleteModalOpen(true)}
              startIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              <span>{t('privacy_delete_btn')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Double Confirmation Account Deletion Dialog */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={resetModal}
        title={t('privacy_delete_modal_title')}
        description={t('privacy_delete_modal_desc')}
        maxWidth="md"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4 pt-1" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-2.5 text-xs text-ink leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <span>{t('privacy_delete_warning_items')}</span>
          </div>

          {/* Step 1: Identity Confirmation (Password or Email Code) */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setDeleteError(null);
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  authMethod === 'password'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line bg-surface-2 text-ink-2 hover:bg-surface'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('privacy_delete_method_password')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setDeleteError(null);
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  authMethod === 'email'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line bg-surface-2 text-ink-2 hover:bg-surface'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{t('privacy_delete_method_email')}</span>
              </button>
            </div>

            {authMethod === 'password' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink">
                  {t('privacy_delete_password_label')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('privacy_delete_password_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper border border-line text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-ink">
                    {t('privacy_delete_email_code_label')}
                  </label>
                  <button
                    type="button"
                    onClick={handleSendDeleteCode}
                    disabled={isSendingCode}
                    className="text-xs font-semibold text-accent hover:underline cursor-pointer disabled:opacity-60"
                  >
                    {t('privacy_delete_send_code_btn')}
                  </button>
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={confirmToken}
                  onChange={(e) => setConfirmToken(e.target.value)}
                  placeholder={t('privacy_delete_email_code_placeholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-paper border border-line text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                />
                {codeSent && (
                  <p className="text-[11px] text-success font-medium">
                    {t('privacy_delete_code_sent')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Double Confirmation (Type DELETE + Irreversible Checkbox) */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                {t('privacy_delete_confirm_text_label')}
              </label>
              <input
                type="text"
                dir="ltr"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-line text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-danger"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ackChecked}
                onChange={(e) => setAckChecked(e.target.checked)}
                className="mt-0.5 rounded border-line text-danger focus:ring-danger"
              />
              <span className="text-xs text-ink-2 leading-relaxed">
                {t('privacy_delete_confirm_checkbox')}
              </span>
            </label>
          </div>

          {deleteError && (
            <p className="text-xs font-medium text-danger">{deleteError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetModal}
              disabled={isDeletingAccount}
            >
              <span>{t('dashboard_cancel_btn')}</span>
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isDeletingAccount}
              disabled={!canConfirmDelete || isDeletingAccount}
              startIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              <span>{t('privacy_delete_confirm_btn')}</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

