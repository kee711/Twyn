'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [onboardingType, setOnboardingType] = useState<'user' | 'social' | null>(null);
  const [socialAccountId, setSocialAccountId] = useState<string | null>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/signin');
      return;
    }

    const type = searchParams.get('type');
    const accountId = searchParams.get('account_id');
    const modal = searchParams.get('modal');

    // Check for pricing modal
    if (modal === 'pricing') {
      setPricingModalOpen(true);
    }

    if (type === 'user') {
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
  }, [session, status, searchParams, router]);

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
        <UserOnboarding onComplete={handleUserOnboardingComplete} />
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