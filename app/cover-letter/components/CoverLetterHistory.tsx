'use client';

import React, { useState, useMemo } from 'react';
import { CoverLetterData } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Search,
  Trash2,
  ExternalLink,
  Building,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  X,
  Languages,
} from 'lucide-react';

interface CoverLetterHistoryProps {
  coverLetters: CoverLetterData[];
  isLoading: boolean;
  onSelect: (letter: CoverLetterData) => void;
  onDelete: (id: string) => Promise<void>;
  isAr: boolean;
  activeId?: string;
  onRefresh?: () => void;
}

export function CoverLetterHistory({
  coverLetters,
  isLoading,
  onSelect,
  onDelete,
  isAr,
  activeId,
  onRefresh,
}: CoverLetterHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [letterToDelete, setLetterToDelete] = useState<CoverLetterData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter cover letters by search query
  const filteredLetters = useMemo(() => {
    if (!searchQuery.trim()) return coverLetters;
    const q = searchQuery.toLowerCase().trim();
    return coverLetters.filter((cl) => {
      const company = (cl.recipient?.companyName || '').toLowerCase();
      const role = (cl.recipient?.jobTitle || '').toLowerCase();
      const title = (cl.title || '').toLowerCase();
      const tone = (cl.tone || '').toLowerCase();
      const sender = (cl.sender?.fullName || '').toLowerCase();
      return (
        company.includes(q) ||
        role.includes(q) ||
        title.includes(q) ||
        tone.includes(q) ||
        sender.includes(q)
      );
    });
  }, [coverLetters, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!letterToDelete?.id) return;
    setIsDeleting(true);
    try {
      await onDelete(letterToDelete.id);
      setLetterToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return isAr ? 'حديثاً' : 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return isAr ? 'حديثاً' : 'Recent';
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isAr ? 'حديثاً' : 'Recent';
    }
  };

  return (
    <div className="bg-surface border border-line rounded-[12px] p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-accent-soft text-accent flex items-center justify-center">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-ink flex items-center gap-2">
              <span>{isAr ? 'سجل خطابات التقديم السابقة' : 'Cover Letter History'}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-2 text-ink-2 border border-line">
                {coverLetters.length}
              </span>
            </h3>
            <p className="text-[11px] text-ink-3">
              {isAr
                ? 'استعرض خطاباتك السابقة، عدّل عليها أو أعد تصديرها بضغطة زر'
                : 'Browse, edit, or re-export previously generated cover letters'}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالشركة أو المسمى...' : 'Search company or role...'}
            className="w-full ps-8 pe-8 py-1.5 rounded-[6px] bg-paper border border-line text-ink text-xs focus:outline-none focus:border-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List Container */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-ink-3 text-xs">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>{isAr ? 'جاري تحميل السجل...' : 'Loading history...'}</span>
        </div>
      ) : filteredLetters.length === 0 ? (
        <div className="py-12 px-4 rounded-[10px] border border-dashed border-line text-center space-y-2 -surface-2">
          <FileText className="w-8 h-8 text-ink-3 mx-auto" strokeWidth={1.5} />
          <p className="text-xs font-medium text-ink">
            {searchQuery
              ? isAr
                ? 'لا توجد نتائج مطابقة لبحثك'
                : 'No matching cover letters found'
              : isAr
              ? 'لم تقم بإنشاء أي خطابات تقديم بعد'
              : 'No cover letters created yet'}
          </p>
          <p className="text-[11px] text-ink-3 max-w-xs mx-auto">
            {searchQuery
              ? isAr
                ? 'جرّب البحث بكلمة مفتاحية مختلفة أو امسح شريط البحث'
                : 'Try searching with a different term'
              : isAr
              ? 'املأ النموذج أعلاه واضغط على "توليد بالذكاء الاصطناعي" لصياغة أول خطاب.'
              : 'Fill in the form above and click generate to create your first tailored letter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLetters.map((cl, idx) => {
            const isActive = activeId === cl.id;
            const company = cl.recipient?.companyName || (isAr ? 'شركة بدون اسم' : 'Unnamed Company');
            const role = cl.recipient?.jobTitle || cl.title || (isAr ? 'وظيفة مهنية' : 'Position');
            const letterLang = cl.language || 'ar';
            const letterTone = cl.tone || 'formal';

            return (
              <div
                key={cl.id || Math.random().toString()}
                onClick={() => onSelect(cl)}
                className={`p-3.5 rounded-[10px] border text-start cursor-pointer flex flex-col justify-between space-y-3 group card-hover list-item-enter ${
                  idx < 8 ? `stagger-${idx + 1}` : ''
                } ${
                  isActive
                    ? 'bg-accent/5 border-accent shadow-xs ring-1 ring-accent'
                    : '-surface-2 hover:bg-surface border-line hover:border-line-strong hover:shadow-xs'
                }`}
              >
                {/* Top Info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-ink line-clamp-1 group-hover:text-accent transition-colors">
                      {role}
                    </h4>
                    <span className="text-[10px] font-mono text-ink-3 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-ink-3" />
                      <span>{formatRelativeDate(cl.updatedAt || cl.createdAt)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-ink-2">
                    <Building className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                    <span className="truncate">{company}</span>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-surface text-ink-3 border border-line uppercase font-mono text-[10px]">
                      {letterLang}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-surface text-ink-2 border border-line capitalize text-[10px]">
                      {letterTone}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(cl);
                      }}
                      className="px-2 py-1 rounded-[4px] text-accent hover:bg-accent-soft text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title={isAr ? 'فتح وتعديل' : 'Open & edit'}
                    >
                      <span>{isAr ? 'فتح' : 'Open'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLetterToDelete(cl);
                      }}
                      className="p-1 rounded-[4px] text-ink-3 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!letterToDelete}
        title={isAr ? 'تأكيد حذف خطاب التقديم' : 'Confirm Cover Letter Deletion'}
        message={
          isAr
            ? `هل أنت متأكد من حذف خطاب التقديم لشركة "${letterToDelete?.recipient?.companyName || 'الشركة'}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete the cover letter for "${letterToDelete?.recipient?.companyName || 'Company'}"? This action cannot be undone.`
        }
        confirmText={isAr ? 'نعم، احذف' : 'Yes, Delete'}
        cancelText={isAr ? 'إلغاء' : 'Cancel'}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setLetterToDelete(null);
        }}
      />
    </div>
  );
}
