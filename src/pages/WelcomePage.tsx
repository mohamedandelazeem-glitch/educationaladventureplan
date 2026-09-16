import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WelcomePageProps {
  onSetupChild: () => void;
}

export function WelcomePage({ onSetupChild }: WelcomePageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/50 to-white px-6 py-12">
      <div className="w-full max-w-md text-center animate-bounce-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 text-white shadow-xl">
          <Rocket className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-gray-900">
          مرحبًا بكِ! 🌟
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          لنبدأ بإعداد رحلة التعلم لطفلك.
        </p>
        <div className="mt-8">
          <Button variant="primary" size="lg" onClick={onSetupChild}>
            إعداد ملف الطفل
          </Button>
        </div>
      </div>
    </div>
  );
}
