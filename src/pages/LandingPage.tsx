import { Rocket, BookOpen, Sparkles, BarChart3, Upload, Play, Gamepad2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

const steps = [
  {
    icon: Upload,
    title: 'أضيفي دروس الترم',
    desc: 'أدخلي أسماء الدروس وارفعِي صور صفحات كل درس.',
    color: 'bg-blue-50 text-secondary-600',
  },
  {
    icon: Sparkles,
    title: 'نُحوّل الدرس إلى مغامرة',
    desc: 'نحوّل محتوى الدرس إلى مشاهد تفاعلية قصيرة وأسئلة تعليمية.',
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: Gamepad2,
    title: 'دعي طفلك يتعلم',
    desc: 'يخوض الطفل المغامرة ويجيب عن الأسئلة مع رفيقه الكرتوني.',
    color: 'bg-success-50 text-success-600',
  },
  {
    icon: BarChart3,
    title: 'تابي تقدمه',
    desc: 'شاهدي تقدمه في الدروس والمفاهيم خلال الترم كاملًا.',
    color: 'bg-accent-50 text-accent-600',
  },
];

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 via-white to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 text-white shadow-lg">
              <Rocket className="h-6 w-6" />
            </div>
            <span className="font-display text-xl font-extrabold text-gray-800">مغامرات تعليمية</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onLogin}>تسجيل الدخول</Button>
            <Button variant="primary" size="sm" onClick={onSignUp}>إنشاء حساب</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 opacity-50 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 ring-1 ring-primary-200 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            منصة تعليمية تفاعلية للأطفال
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl animate-slide-up">
            حوّلي دروس طفلك إلى
            <span className="gradient-text"> مغامرات تعليمية!</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl animate-slide-up">
            منصة تعليمية تفاعلية تساعد طفلك على فهم دروس العلوم وتذكّرها من خلال مغامرات قصيرة ومشاهد كرتونية وأسئلة تفاعلية.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up">
            <Button variant="primary" size="lg" onClick={onSignUp}>
              ابدئي الآن مجانًا
            </Button>
            <Button variant="outline" size="lg" onClick={onLogin}>
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-gray-900 md:text-4xl">كيف تعمل المنصة؟</h2>
          <p className="mt-3 text-lg text-gray-500">أربع خطوات بسيطة لرحلة تعلم ممتعة</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl bg-white p-6 card-shadow transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${step.color} transition-transform group-hover:scale-110`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="mb-2 text-sm font-bold text-primary-500">الخطوة {i + 1}</div>
                <h3 className="mb-2 font-display text-lg font-bold text-gray-800">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature showcase */}
      <section className="bg-gradient-to-b from-white to-primary-50/30 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-gray-900 md:text-4xl">
                تعلّم بالشغف، لا بالحفظ
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                بدلًا من مجرد قراءة الدرس، يعيش الطفل المغامرة مع رفيق كرتوني يشرح له المفاهيم بأسلوب ممتع، ثم يختبر فهمه بأسئلة تفاعلية.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: BookOpen, text: 'مشاهد كرتونية تعليمية قصيرة' },
                  { icon: Play, text: 'أسئلة تفاعلية بعد كل مشهد' },
                  { icon: Star, text: 'تتبع المفاهيم المتقنة والتي تحتاج مراجعة' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-primary-400 via-accent-400 to-secondary-400 p-1 shadow-2xl">
                <div className="rounded-[22px] bg-white p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-100 text-3xl">🦊</div>
                    <div>
                      <div className="font-display font-bold text-gray-800">الثعلب الذكي</div>
                      <div className="text-xs text-gray-400">رفيق التعلم</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-primary-50 p-4 text-sm text-gray-700">
                      تبدأ دورة حياة النبات عندما تنبت البذرة.
                    </div>
                    <div className="rounded-2xl bg-success-50 p-4 text-sm font-bold text-success-700">
                      أحسنت! إجابة صحيحة. 🌟
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-xl border-2 border-gray-100 p-3 text-center text-xs text-gray-500">أ. عند الثمرة</div>
                      <div className="flex-1 rounded-xl border-2 border-success-300 bg-success-50 p-3 text-center text-xs font-bold text-success-700">ب. عند البذرة</div>
                      <div className="flex-1 rounded-xl border-2 border-gray-100 p-3 text-center text-xs text-gray-500">ج. عند الذبول</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <h2 className="font-display text-3xl font-extrabold text-gray-900 md:text-4xl">
          جاهزة لبدء المغامرة؟
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          أنشئي حسابًا في دقائق وابدئي رحلة التعلم مع طفلك
        </p>
        <div className="mt-8">
          <Button variant="primary" size="lg" onClick={onSignUp}>
            إنشاء حساب مجانًا
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 text-sm text-gray-400">
          <Rocket className="h-4 w-4" />
          <span>منصة المغامرات التعليمية — صنع التعلم ممتعًا</span>
        </div>
      </footer>
    </div>
  );
}
