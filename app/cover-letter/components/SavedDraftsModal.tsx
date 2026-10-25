'use client';

import React, { useState, useEffect } from 'react';
import { CoverLetterData } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  X,
  FolderArchive,
  Trash2,
  ExternalLink,
  Search,
  Building,
  Calendar,
  Loader2,
} from 'lucide-react';

interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDraft: (draft: CoverLetterData) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onDraftDeleted?: (deletedId: string) => void;
}

export function SavedDraftsModal({
  isOpen,
  onClose,
  onSelectDraft,
  showToast,
  onDraftDeleted,
}: SavedDraftsModalProps) {
  const [drafts, setDrafts] = useState<CoverLetterData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftToDelete, setDraftToDelete] = useState<CoverLetterData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen]);

  // Listen for Escape key to close modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cover-letters?limit=50&summary=true');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.coverLetters || []);
      } else {
        const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
        setDrafts(local);
      }
    } catch {
      // Local fallback
      const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
      setDrafts(local);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (draft: CoverLetterData, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftToDelete(draft);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete || !draftToDelete.id) return;
    setIsDeleting(true);
    const idToDelete = draftToDelete.id;

    try {
      const res = await fetch(`/api/cover-letters/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== idToDelete));
        showToast('تم حذف مسودة الخطاب بنجاح');
        if (onDraftDeleted) onDraftDeleted(idToDelete);
      } else {
        // Fallback for local storage if ID was local
        const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
        const updated = local.filter((d: { id?: string }) => d.id !== idToDelete);
        localStorage.setItem('jobmatch_cover_letters', JSON.stringify(updated));
        setDrafts((prev) => prev.filter((d) => d.id !== idToDelete));
        showToast('تم حذف الخطاب بنجاح');
        if (onDraftDeleted) onDraftDeleted(idToDelete);
      }
    } catch {
      showToast('حدث خطأ أثناء الاتصال بالخادم لحذف الخطاب', 'error');
    } finally {
      setIsDeleting(false);
      setDraftToDelete(null);
    }
  };

  if (!isOpen) return null;

  const filtered = drafts.filter(
    (d) =>
      d.recipient?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.recipient?.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-drafts-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h2 id="saved-drafts-title" className="text-base font-bold text-white">مسودات خطابات التقديم المحفوظة</h2>
                <p className="text-xs text-slate-400">
                  إجمالي الخطابات: {drafts.length} خطاب محفوظ بحسابك
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الشركة أو الوظيفة..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">جاري تحميل المسودات...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-slate-500">
                <FolderArchive className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-400">لا توجد مسودات محفوظة حالياً</p>
                <p className="text-xs">قم بتوليد خطاب جديد وحفظه كمسودة للرجوع إليه هنا في أي وقت.</p>
              </div>
            ) : (
              filtered.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => {
                    if (isDeleting) return;
                    onSelectDraft(draft);
                    onClose();
                    showToast('تم استعادة الخطاب بنجاح في المعاينة!');
                  }}
                  className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {draft.title || draft.recipient?.companyName || 'خطاب بدون عنوان'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {draft.language === 'ar' ? 'العربية' : 'EN'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/60 text-slate-300">
                        {draft.tone}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                      {draft.recipient?.companyName && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{draft.recipient.companyName}</span>
                        </span>
                      )}
                      {draft.recipient?.jobTitle && <span>• {draft.recipient.jobTitle}</span>}
                      {draft.updatedAt && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(draft.updatedAt).toLocaleDateString('ar-EG')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => draft.id && handleDeleteClick(draft, e)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                      title="حذف المسودة"
                    >
                      {draftToDelete?.id === draft.id && isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <div className="p-2 rounded-xl text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Before Deleting Draft */}
      <ConfirmModal
        isOpen={!!draftToDelete}
        title="حذف مسودة خطاب التقديم؟"
        message={`هل أنت متأكد من رغبتك في حذف مسودة خطاب التقديم لـ "${
          draftToDelete?.recipient?.companyName || draftToDelete?.title || 'هذا الخطاب'
        }"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، حذف الخطاب"
        cancelText="إلغاء"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDraftToDelete(null);
        }}
      />
    </>
  );
}
