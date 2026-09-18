import { useState } from 'react';
import { Play, Trash2, AlertTriangle, Calendar, Image as ImageIcon, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AdventureRecord } from '@/lib/adventureRepository';

interface SavedAdventuresGridProps {
  adventures: AdventureRecord[];
  onReplay: (record: AdventureRecord) => void;
  onDelete: (id: string) => void;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function SavedAdventuresGrid({ adventures, onReplay, onDelete }: SavedAdventuresGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<AdventureRecord | null>(null);

  if (adventures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 card-shadow">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
          <ImageIcon className="h-8 w-8" />
        </div>
        <h3 className="font-display text-lg font-bold text-gray-700">لا توجد مغامرات محفوظة بعد</h3>
        <p className="mt-2 max-w-sm text-center text-sm text-gray-400">
          ارفعي صور صفحات الدرس وأنشئي مغامرة جديدة لتظهر هنا.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adventures.map((record) => (
          <div
            key={record.id}
            className="group overflow-hidden rounded-2xl bg-white card-shadow transition-all hover:shadow-lg"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              {record.imageBase64 && record.imageBase64.length > 0 ? (
                <img
                  src={record.imageBase64[0]}
                  alt={record.lessonTitle}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              {/* Image count badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" />
                {record.imageBase64?.length ?? 0}
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">
              <div className="mb-2 flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <h3 className="flex-1 truncate font-display text-sm font-bold text-gray-800">
                  {record.lessonTitle}
                </h3>
              </div>
              <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                {formatDate(record.createdAt)}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onReplay(record)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-xs font-bold text-success-600 transition-colors hover:bg-success-100"
                >
                  <Play className="h-3.5 w-3.5" />
                  إعادة تشغيل المغامرة
                </button>
                <button
                  onClick={() => setDeleteTarget(record)}
                  className="flex items-center justify-center rounded-lg bg-error-50 px-3 py-2 text-error-500 transition-colors hover:bg-error-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 animate-slide-up">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50 text-error-500">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-gray-900">حذف المغامرة؟</h3>
            <p className="mt-2 text-sm text-gray-500">
              سيتم حذف مغامرة "{deleteTarget.lessonTitle}" وجميع صورها نهائيًا.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="primary"
                size="md"
                className="bg-error-500 hover:bg-error-600 shadow-error-500/30"
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                حذف المغامرة
              </Button>
              <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
