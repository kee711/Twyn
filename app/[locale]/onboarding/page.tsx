'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { UserOnboarding, type UserOnboardingCompletionPayload } from '@/components/onboarding/UserOnboarding';
import { SocialOnboarding } from '@/components/onboarding/SocialOnboarding';
import { PricingModal } from '@/components/modals/PricingModal';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { featureFlags } from '@/lib/config/web3';

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
      const force = searchParams.get('force');
      const forceOnboarding = force === '1' || force === 'true';

      // Check for pricing modal
      if (modal === 'pricing') {
        setPricingModalOpen(true);
      }

      if (type === 'user' && session?.user?.id) {
        const supabase = createClient();
        if (forceOnboarding) {
          try {
            const { error: deleteError } = await supabase
              .from('user_onboarding')
              .delete()
              .eq('user_id', session.user.id);
            if (deleteError) {
              console.error('[Onboarding] 기존 온보딩 키 삭제 실패', deleteError);
            }
          } catch (deleteErr) {
            console.error('[Onboarding] 온보딩 키 삭제 중 예외 발생', deleteErr);
          }
        }
        if (!forceOnboarding) {
          // Check if user already has onboarding data
          const { data: onboardingData } = await supabase
            .from('user_onboarding')
            .select('is_completed')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // If user already has onboarding data, redirect to dashboard
          if (onboardingData) {
            // Update the session to reflect that onboarding is complete
            await update();
            router.push('/contents/topic-finder');
            return;
          }
        }

        // Check if user has social accounts to determine if we should show step 4
        // In web3 mode, never show threads connection
        if (featureFlags.showOnlyFarcasterAuth()) {
          setShowThreadsConnection(false);
        } else {
          const { data: socialAccounts } = await supabase
            .from('social_accounts')
            .select('id')
            .eq('user_id', session.user.id)
            .limit(1);

          setShowThreadsConnection(!socialAccounts || socialAccounts.length === 0);
        }
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

  const handleUserOnboardingComplete = async ({
    step1,
    step2,
    step3,
    persona,
    audience,
    objective,
    addOn,
    threadsStatus,
  }: UserOnboardingCompletionPayload) => {
    if (!session?.user?.id) {
      toast.error(t('userNotFound'));
      return;
    }

    const userId = session.user.id;

    try {
      const supabase = createClient();

      const ensurePreference = async (
        table: 'personas' | 'audiences' | 'objectives',
        values: UserOnboardingCompletionPayload['persona'],
      ): Promise<string> => {
        const name = values.name.trim();
        const description = values.description.trim() || null;

        if (!name) {
          throw new Error(`Missing name for ${table}`);
        }

        const insertResult = await supabase
          .from(table)
          .insert({
            user_account_id: userId,
            name,
            description,
            is_public: false,
          })
          .select('id')
          .single();

        if (insertResult.error) {
          if (insertResult.error.code === '23505') {
            const { data: existing, error: fetchError } = await supabase
              .from(table)
              .select('id')
              .eq('user_account_id', userId)
              .ilike('name', name)
              .limit(1)
              .maybeSingle();

            if (fetchError) {
              throw fetchError;
            }

            if (!existing) {
              throw insertResult.error;
            }

            const { error: updateError } = await supabase
              .from(table)
              .update({
                description,
                is_public: false,
              })
              .eq('id', existing.id);

            if (updateError) {
              throw updateError;
            }

            return existing.id;
          }

          throw insertResult.error;
        }

        return insertResult.data.id;
      };

      const ensureAddOn = async (
        values: UserOnboardingCompletionPayload['addOn'],
      ): Promise<string | null> => {
        if (!values) return null;

        const name = values.name.trim();
        const description = values.description.trim() || null;

        if (!name) {
          return null;
        }

        const insertResult = await supabase
          .from('add_ons')
          .insert({
            user_account_id: userId,
            name,
            description,
            is_public: false,
          })
          .select('id')
          .single();

        if (insertResult.error) {
          if (insertResult.error.code === '23505') {
            const { data: existing, error: fetchError } = await supabase
              .from('add_ons')
              .select('id')
              .eq('user_account_id', userId)
              .ilike('name', name)
              .limit(1)
              .maybeSingle();

            if (fetchError) {
              throw fetchError;
            }

            if (!existing) {
              throw insertResult.error;
            }

            const { error: updateError } = await supabase
              .from('add_ons')
              .update({
                description,
                is_public: false,
              })
              .eq('id', existing.id);

            if (updateError) {
              throw updateError;
            }

            return existing.id;
          }

          throw insertResult.error;
        }

        return insertResult.data.id;
      };

      // Save user onboarding data
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: userId,
          onboarding_step_1: step1,
          onboarding_step_2: step2,
          onboarding_step_3: step3,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      const [personaId, audienceId, objectiveId, addOnId] = await Promise.all([
        ensurePreference('personas', persona),
        ensurePreference('audiences', audience),
        ensurePreference('objectives', objective),
        ensureAddOn(addOn),
      ]);

      const { data: existingPreference, error: preferenceFetchError } = await supabase
        .from('topic_finder_preferences')
        .select('id')
        .eq('user_account_id', userId)
        .maybeSingle();

      if (preferenceFetchError) {
        throw preferenceFetchError;
      }

      let preferenceId: string | null = null;

      if (existingPreference?.id) {
        const { error: updatePrefError } = await supabase
          .from('topic_finder_preferences')
          .update({
            persona_id: personaId,
            audience_id: audienceId,
            objective_id: objectiveId,
          })
          .eq('id', existingPreference.id);

        if (updatePrefError) {
          throw updatePrefError;
        }

        preferenceId = existingPreference.id;
      } else {
        const { data: newPreference, error: insertPrefError } = await supabase
          .from('topic_finder_preferences')
          .insert({
            user_account_id: userId,
            persona_id: personaId,
            audience_id: audienceId,
            objective_id: objectiveId,
          })
          .select('id')
          .single();

        if (insertPrefError) {
          throw insertPrefError;
        }

        preferenceId = newPreference.id;
      }

      if (addOnId && preferenceId) {
        const { error: linkError } = await supabase
          .from('topic_finder_preference_add_ons')
          .upsert(
            { preference_id: preferenceId, add_on_id: addOnId },
            { onConflict: 'preference_id,add_on_id' },
          );

        if (linkError) {
          throw linkError;
        }
      }

      // Check if user has any social accounts linked
      const { data: socialAccounts } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!socialAccounts || socialAccounts.length === 0) {
        if (threadsStatus === 'skipped') {
          toast.info(t('threadsSkipInfo'));
        }
      }

      await update();
      toast.success(t('onboardingCompleted'));
      router.push('/contents/topic-finder');
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
        <UserOnboarding
          onComplete={handleUserOnboardingComplete}
          showThreadsConnection={showThreadsConnection}
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
