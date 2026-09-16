import { useState } from 'react';
import { Rocket, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CHARACTERS } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface ChildProfilePageProps {
  onBack: () => void;
  onComplete: () => void;
}

const GRADES = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];

export function ChildProfilePage({ onBack, onComplete }: ChildProfilePageProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState(8);
  const [grade, setGrade] = useState('');
  const [character, setCharacter] = useState('fox');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('يرجى إدخال اسم الطفل');
      return;
    }
    if (!grade) {
      setError('يرجى اختيار الصف الدراسي');
      return;
    }
    setLoading(true);
    const { error: insertError } = await supabase
      .from('children')
      .insert({
        user_id: user!.id,
        name: name.trim(),
        age,
        grade,
        character,
      });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/50 to-white px-6 py-12">
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-primary-600">
          <ArrowLeft className="h-4 w-4" />
          العودة
        </button>

        <div className="rounded-3xl bg-white p-8 card-shadow-lg animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-white shadow-lg">
              <Rocket className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-gray-900">لنبدأ بالتعرف إلى طفلك</h1>
            <p className="mt-2 text-gray-500">إعداد ملف الطفل لبدء رحلة التعلم</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-700 ring-1 ring-error-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم الطفل"
              type="text"
              placeholder="اسم طفلك"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">العمر</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAge(Math.max(3, age - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-primary-400 hover:text-primary-600">−</button>
                  <div className="flex h-11 flex-1 items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 text-lg font-bold text-gray-800">{age}</div>
                  <button type="button" onClick={() => setAge(Math.min(15, age + 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gray-200 text-lg font-bold text-gray-600 transition-colors hover:border-primary-400 hover:text-primary-600">+</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">الصف الدراسي</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-base text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">اختيار الصف</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Character selection */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">اختيار الشخصية</label>
              <p className="text-sm text-gray-400">اختر رفيقك في رحلة التعلم</p>
              <div className="grid grid-cols-5 gap-3">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setCharacter(char.id)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 ${
                      character === char.id
                        ? 'border-primary-400 bg-primary-50 scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {character === char.id && (
                      <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <span className="text-3xl">{char.emoji}</span>
                    <span className="text-xs font-bold text-gray-600">{char.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'متابعة'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
