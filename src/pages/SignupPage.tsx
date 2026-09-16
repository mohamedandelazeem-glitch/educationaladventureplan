import { useState } from 'react';
import { Rocket, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';

interface SignupPageProps {
  onBack: () => void;
  onLogin: () => void;
  onSignedUp: () => void;
}

export function SignupPage({ onBack, onLogin, onSignedUp }: SignupPageProps) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, { data: { full_name: name.trim() } });
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      onSignedUp();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/50 to-white px-6 py-12">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-primary-600">
          <ArrowLeft className="h-4 w-4" />
          العودة للرئيسية
        </button>

        <div className="rounded-3xl bg-white p-8 card-shadow-lg animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-white shadow-lg">
              <Rocket className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-gray-900">إنشاء حساب جديد</h1>
            <p className="mt-2 text-gray-500">ابدئي رحلة تعليمية ممتعة لطفلك.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-700 ring-1 ring-error-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="اسم الأم"
              type="text"
              placeholder="اسمك الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="تأكيد كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              لديكِ حساب بالفعل؟{' '}
              <button onClick={onLogin} className="font-bold text-primary-600 hover:underline">
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
