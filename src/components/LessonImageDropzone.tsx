import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react';

const MAX_IMAGES = 10;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ACCEPTED_EXTS = ['.png', '.jpg', '.jpeg'];

type DropzoneStatus = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export interface DropzoneImage {
  id: string;
  file: File;
  dataUrl: string;
  order: number;
}

interface LessonImageDropzoneProps {
  images: DropzoneImage[];
  onImagesChange: (images: DropzoneImage[]) => void;
  maxImages?: number;
}

function validateFile(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTS.includes(ext)) {
    return 'صيغة غير مدعومة. يُسمح فقط بصور PNG أو JPG.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'حجم الصورة كبير جدًا. الحد الأقصى 10 ميجابايت.';
  }
  return null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

export function LessonImageDropzone({ images, onImagesChange, maxImages = MAX_IMAGES }: LessonImageDropzoneProps) {
  const [status, setStatus] = useState<DropzoneStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);

    if (images.length + fileArr.length > maxImages) {
      setErrorMsg(`يمكن رفع ${maxImages} صور كحد أقصى. لديك ${images.length} بالفعل.`);
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setErrorMsg('');

    const newImages: DropzoneImage[] = [];
    let hasError = false;

    for (const file of fileArr) {
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMsg(validationError);
        setStatus('error');
        hasError = true;
        break;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        newImages.push({
          id: crypto.randomUUID(),
          file,
          dataUrl,
          order: images.length + newImages.length,
        });
      } catch {
        setErrorMsg('فشل في قراءة أحد الملفات. تأكدي من أن الصورة صالحة.');
        setStatus('error');
        hasError = true;
        break;
      }
    }

    if (!hasError && newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } else if (!hasError) {
      setStatus('idle');
    }
  }, [images, maxImages, onImagesChange]);

  const handleRemove = useCallback((id: string) => {
    const filtered = images.filter((img) => img.id !== id);
    const reordered = filtered.map((img, i) => ({ ...img, order: i }));
    onImagesChange(reordered);
    if (reordered.length === 0) {
      setStatus('idle');
      setErrorMsg('');
    }
  }, [images, onImagesChange]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  const canAddMore = images.length < maxImages;

  const borderClass = isDragging
    ? 'border-primary-500 bg-primary-50 scale-[1.02]'
    : status === 'error'
    ? 'border-error-400 bg-error-50'
    : status === 'success'
    ? 'border-success-400 bg-success-50'
    : 'border-gray-200 bg-gray-50 hover:border-primary-400 hover:bg-primary-50';

  return (
    <div className="space-y-4">
      {/* Dropzone area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => canAddMore && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-200 ${borderClass} ${!canAddMore ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTS.join(',')}
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={!canAddMore}
        />

        {status === 'uploading' ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary-500" />
            <span className="font-bold text-gray-600">جاري معالجة الصور...</span>
          </>
        ) : isDragging ? (
          <>
            <Upload className="mb-3 h-10 w-10 text-primary-500" />
            <span className="font-bold text-primary-600">اتركي الصور هنا</span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="mb-3 h-10 w-10 text-error-400" />
            <span className="font-bold text-error-500">حدث خطأ</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="mb-3 h-10 w-10 text-success-500" />
            <span className="font-bold text-success-600">تم رفع الصور بنجاح</span>
          </>
        ) : (
          <>
            <ImageIcon className="mb-3 h-10 w-10 text-gray-300" />
            <span className="font-bold text-gray-600">اسحبي الصور هنا أو اضغطي للرفع</span>
            <span className="mt-1 text-xs text-gray-400">PNG أو JPG — بحد أقصى {maxImages} صور</span>
          </>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-600 ring-1 ring-error-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">
              الصور المرفوعة: {images.length}/{maxImages}
            </span>
            {canAddMore && (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1 text-sm font-bold text-primary-600 transition-colors hover:text-primary-700"
              >
                <Plus className="h-4 w-4" />
                إضافة المزيد
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200 bg-white"
              >
                <img
                  src={img.dataUrl}
                  alt={`صفحة ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* Order badge */}
                <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white shadow">
                  {idx + 1}
                </div>
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(img.id); }}
                  className="absolute top-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-error-500"
                >
                  <X className="h-4 w-4" />
                </button>
                {/* File name tooltip */}
                <div className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {img.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
