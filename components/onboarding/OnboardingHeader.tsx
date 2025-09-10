'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function OnboardingHeader() {
  const t = useTranslations('auth');

  const handleSignOut = async () => {
    // Clear client-side storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear server-side cookies through API
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Error clearing cookies:', error);
      }
    }
    
    // Sign out and redirect
    await signOut({ 
      redirect: false 
    });
    
    // Manually redirect to ensure clean state
    window.location.href = '/signin';
  };

  return (
    <div className="absolute top-4 right-4 flex items-center z-50">
      <LanguageSelector />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="text-muted-foreground hover:text-foreground border-none bg-transparent py-2"
      >
        <LogOut className="w-4 h-4 mr-2" />
        {t('signOut')}
      </Button>
    </div>
  );
}