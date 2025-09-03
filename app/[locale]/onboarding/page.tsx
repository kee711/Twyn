'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { UserOnboarding } from '@/components/onboarding/UserOnboarding';
import { SocialOnboarding } from '@/components/onboarding/SocialOnboarding';
import { PricingModal } from '@/components/modals/PricingModal';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const t = useTranslations('pages.onboarding');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [onboardingType, setOnboardingType] = useState<'user' | 'social' | null>(null);
  const [socialAccountId, setSocialAccountId] = useState<string | null>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [showThreadsConnection, setShowThreadsConnection] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    // Ensure user is authenticated
    if (status === 'unauthenticated') {
      router.push('/signin');
      return;
    }

    // Clear signup-related sessionStorage and cookies
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('signup_in_progress');
      sessionStorage.removeItem('inviteCode');
      sessionStorage.removeItem('inviteCodeId');
      
      // Clear server-side cookies
      fetch('/api/auth/clear-signup-cookies', { method: 'POST' })
        .catch(err => console.error('Failed to clear signup cookies:', err));
    }

    const checkOnboarding = async () => {
      const type = searchParams.get('type');
      const accountId = searchParams.get('account_id');
      const modal = searchParams.get('modal');

      // Check for pricing modal
      if (modal === 'pricing') {
        setPricingModalOpen(true);
      }

      if (type === 'user' && session?.user?.id) {
        // Check if user already has onboarding data
        const supabase = createClient();
        const { data: onboardingData } = await supabase
          .from('user_onboarding')
          .select('is_completed')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If user already has onboarding data, redirect to dashboard
        if (onboardingData) {
          // Update the session to reflect that onboarding is complete
          await update();
          router.push('/contents/topic-finder');
          return;
        }

        // Check if user has social accounts to determine if we should show step 4
        const { data: socialAccounts } = await supabase
          .from('social_accounts')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1);

        setShowThreadsConnection(!socialAccounts || socialAccounts.length === 0);
        setOnboardingType('user');
      } else if (type === 'social' && accountId) {
        setOnboardingType('social');
        setSocialAccountId(accountId);
      } else {
        // Invalid parameters, redirect to dashboard
        router.push('/contents/topic-finder');
        return;
      }

      setLoading(false);
    };

    checkOnboarding();
  }, [status, searchParams, router, session, update]);

  const handleUserOnboardingComplete = async (responses: {
    step1: string | null;
    step2: string | null;
    step3: string | null;
  }) => {
    if (!session?.user?.id) {
      toast.error(t('userNotFound'));
      return;
    }

    try {
      const supabase = createClient();

      // Save user onboarding data
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: session.user.id,
          onboarding_step_1: responses.step1,
          onboarding_step_2: responses.step2,
          onboarding_step_3: responses.step3,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Check if user has any social accounts linked
      const { data: socialAccounts } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      // If no social accounts exist, stay on page to show step 4
      // Otherwise redirect to dashboard
      if (!socialAccounts || socialAccounts.length === 0) {
        // Step 4 will be shown by the UserOnboarding component
        // Don't update session yet to prevent middleware redirect
        // Session will be updated after Threads connection or when user skips
      } else {
        // User has social accounts, redirect to dashboard
        await update();
        router.push('/contents/topic-finder');
      }

    } catch (error) {
      console.error('Error saving user onboarding:', error);
      toast.error(t('errorSavingUserOnboarding'));
    }
  };

  const handleSocialOnboardingComplete = async (profileDescription: string) => {
    if (!socialAccountId) {
      toast.error(t('accountNotFound'));
      return;
    }

    try {
      const supabase = createClient();

      // Update social account with profile description
      const { error } = await supabase
        .from('social_accounts')
        .update({
          profile_description: profileDescription.trim() || null,
          onboarding_completed: true,
        })
        .eq('id', socialAccountId);

      if (error) throw error;

      toast.success(t('profileSetupCompleted'));

      // Redirect to topic-finder with pricing modal parameter
      router.push('/contents/topic-finder?modal=pricing');
    } catch (error) {
      console.error('Error saving social onboarding:', error);
      toast.error(t('errorSavingSocialOnboarding'));
    }
  };

  const handleClosePricingModal = () => {
    setPricingModalOpen(false);
    // Remove modal parameter from URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('modal');
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  const handleThreadsSkip = async () => {
    // Update session to reflect onboarding is complete
    await update();
    // Redirect to dashboard
    router.push('/contents/topic-finder');
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {onboardingType === 'user' && (
        <UserOnboarding 
          onComplete={handleUserOnboardingComplete} 
          showThreadsConnection={showThreadsConnection}
          onThreadsSkip={handleThreadsSkip}
        />
      )}

      {onboardingType === 'social' && socialAccountId && (
        <SocialOnboarding
          socialAccountId={socialAccountId}
          onComplete={handleSocialOnboardingComplete}
        />
      )}

      {/* Pricing Modal */}
      <PricingModal
        open={pricingModalOpen}
        onClose={handleClosePricingModal}
      />
    </>
  );
}