import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { ChildProfilePage } from '@/pages/ChildProfilePage';
import { ParentDashboard } from '@/pages/ParentDashboard';
import { CurriculumPage } from '@/pages/CurriculumPage';
import { AdventurePage } from '@/pages/AdventurePage';
import { ReviewPage } from '@/pages/ReviewPage';

type Page = 'landing' | 'login' | 'signup' | 'welcome' | 'child-profile' | 'dashboard' | 'curriculum' | 'adventure' | 'review';

function App() {
  const { session, loading, signOut } = useAuth();
  const [page, setPage] = useState<Page>('landing');
  const [adventureLessonId, setAdventureLessonId] = useState<string>('');
  const [hasChild, setHasChild] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setPage('landing');
      setHasChild(null);
      return;
    }
    // Check if child profile exists
    (async () => {
      const { data } = await supabase
        .from('children')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (data) {
        setHasChild(true);
        setPage('dashboard');
      } else {
        setHasChild(null);
        setPage('welcome');
      }
    })();
  }, [session, loading]);

  // Don't render until auth is loaded
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  // Unauthenticated pages
  if (!session) {
    if (page === 'login') {
      return <LoginPage onBack={() => setPage('landing')} onSignUp={() => setPage('signup')} onForgotPassword={() => setPage('login')} />;
    }
    if (page === 'signup') {
      return <SignupPage onBack={() => setPage('landing')} onLogin={() => setPage('login')} onSignedUp={() => setPage('welcome')} />;
    }
    return <LandingPage onLogin={() => setPage('login')} onSignUp={() => setPage('signup')} />;
  }

  // Authenticated but no child profile
  if (page === 'welcome') {
    return <WelcomePage onSetupChild={() => setPage('child-profile')} />;
  }
  if (page === 'child-profile') {
    return <ChildProfilePage onBack={() => setPage('welcome')} onComplete={() => { setHasChild(true); setPage('dashboard'); }} />;
  }

  // Authenticated with child
  if (page === 'curriculum') {
    return <CurriculumPage onBack={() => setPage('dashboard')} />;
  }
  if (page === 'adventure') {
    return <AdventurePage lessonId={adventureLessonId} onBack={() => setPage('dashboard')} />;
  }
  if (page === 'review') {
    return <ReviewPage onBack={() => setPage('dashboard')} />;
  }

  return (
    <ParentDashboard
      onManageCurriculum={() => setPage('curriculum')}
      onStartAdventure={(lessonId) => { setAdventureLessonId(lessonId); setPage('adventure'); }}
      onReview={() => setPage('review')}
      onSignOut={async () => { await signOut(); setPage('landing'); }}
    />
  );
}

export default App;
