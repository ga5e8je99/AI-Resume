'use client';

import React, { useState, useEffect } from 'react';
import { CoverLetterData } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { useLanguage } from '../../context/LanguageContext';
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
  const { language, isRtl } = useLanguage();
  const isAr = language === 'ar';

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
        showToast(isAr ? 'تم حذف مسودة الخطاب' : 'Cover letter draft deleted');
        if (onDraftDeleted) onDraftDeleted(idToDelete);
      } else {
        const local = JSON.parse(localStorage.getItem('jobmatch_cover_letters') || '[]');
        const updated = local.filter((d: { id?: string }) => d.id !== idToDelete);
        localStorage.setItem('jobmatch_cover_letters', JSON.stringify(updated));
        setDrafts((prev) => prev.filter((d) => d.id !== idToDelete));
        showToast(isAr ? 'تم حذف الخطاب بنجاح' : 'Cover letter draft deleted successfully');
        if (onDraftDeleted) onDraftDeleted(idToDelete);
      }
    } catch {
      showToast(isAr ? 'حدث خطأ أثناء الاتصال بالخادم لحذف الخطاب' : 'Error deleting cover letter from server', 'error');
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
        dir={isRtl ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs modal-backdrop-animate"
      >
        <div className="bg-surface border border-line rounded-[10px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-md overflow-hidden modal-card-animate">
          {/* Header */}
          <div className="p-5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] bg-accent-soft text-accent flex items-center justify-center">
                <FolderArchive className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <h2 id="saved-drafts-title" className="text-base font-serif font-semibold text-ink">
                  {isAr ? 'مسودات خطابات التقديم' : 'Saved Cover Letters'}
                </h2>
                <p className="text-xs text-ink-3">
                  {isAr ? `${drafts.length} مسودة محفوظة` : `${drafts.length} saved drafts`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-7 h-7 rounded-[6px] hover:bg-surface-2 text-ink-3 hover:text-ink flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-line bg-surface-2/40">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-3 absolute start-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'البحث بالاسم أو الشركة...' : 'Search by name or company...'}
                className="w-full ps-9 pe-3 py-1.5 bg-surface border border-line rounded-[6px] text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-ink-3">{isAr ? 'جاري تحميل المسودات...' : 'Loading saved drafts...'}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-ink-3">
                <FolderArchive className="w-10 h-10 mx-auto text-ink-3 stroke-[1.5]" />
                <p className="text-sm font-medium text-ink-2">{isAr ? 'لا توجد مسودات محفوظة' : 'No saved drafts found'}</p>
                <p className="text-xs">{isAr ? 'المسودات التي تحفظها أثناء العمل ستظهر هنا.' : 'Drafts saved during your workflow will appear here.'}</p>
              </div>
            ) : (
              filtered.map((draft, idx) => (
                <div
                  key={draft.id}
                  onClick={() => {
                    if (isDeleting) return;
                    onSelectDraft(draft);
                    onClose();
                    showToast(isAr ? 'تم استعادة المسودة' : 'Draft restored successfully');
                  }}
                  className={`p-3.5 rounded-[8px] bg-surface hover:bg-surface-2 border border-line transition-colors flex items-center justify-between gap-3 cursor-pointer group list-item-enter ${idx < 8 ? `stagger-${idx + 1}` : ''}`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink group-hover:text-accent transition-colors truncate">
                        {draft.title || draft.recipient?.companyName || (isAr ? 'مسودة خطاب' : 'Untitled Draft')}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-[4px] text-[10px] font-mono bg-surface-2 text-ink-2 border border-line">
                        {draft.language === 'ar' ? 'العربية' : 'EN'}
                      </span>
                      <span className="text-[10px] text-ink-3 capitalize">
                        {draft.tone}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-2">
                      {draft.recipient?.companyName && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-ink-3" strokeWidth={1.5} />
                          <span>{draft.recipient.companyName}</span>
                        </span>
                      )}
                      {draft.recipient?.jobTitle && <span>• {draft.recipient.jobTitle}</span>}
                      {draft.updatedAt && (
                        <span className="flex items-center gap-1 text-[11px] text-ink-3 font-mono">
                          <Calendar className="w-3 h-3" strokeWidth={1.5} />
                          <span>{new Date(draft.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => draft.id && handleDeleteClick(draft, e)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-[4px] text-ink-3 hover:text-danger hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      title={isAr ? 'حذف المسودة' : 'Delete draft'}
                    >
                      {draftToDelete?.id === draft.id && isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-danger" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      )}
                    </button>
                    <div className="p-1.5 text-ink-3 group-hover:text-accent">
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!draftToDelete}
        title={isAr ? 'حذف مسودة خطاب التقديم' : 'Delete Cover Letter Draft'}
        message={
          isAr
            ? `هل ترغب في حذف مسودة خطاب "${
                draftToDelete?.recipient?.companyName || draftToDelete?.title || 'هذا الخطاب'
              }"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete the draft for "${
                draftToDelete?.recipient?.companyName || draftToDelete?.title || 'this letter'
              }"? This action cannot be undone.`
        }
        confirmText={isAr ? 'حذف المسودة' : 'Delete Draft'}
        cancelText={isAr ? 'إلغاء' : 'Cancel'}
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
