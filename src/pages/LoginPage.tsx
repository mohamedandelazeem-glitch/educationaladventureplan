import { useState } from 'react';
import { Rocket, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';

interface LoginPageProps {
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}

export function LoginPage({ onBack, onSignUp, onForgotPassword }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
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
            <h1 className="font-display text-2xl font-extrabold text-gray-900">تسجيل الدخول</h1>
            <p className="mt-2 text-gray-500">مرحبًا بعودتكِ!</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-error-50 px-4 py-3 text-sm font-bold text-error-700 ring-1 ring-error-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-gray-500">
              ليس لديكِ حساب؟{' '}
              <button onClick={onSignUp} className="font-bold text-primary-600 hover:underline">
                إنشاء حساب جديد
              </button>
            </p>
            <button onClick={onForgotPassword} className="text-sm text-gray-400 hover:text-primary-600">
              هل نسيتِ كلمة المرور؟
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
