import { createClient } from '@/lib/supabase/client';

export async function checkOnboardingStatus(userId: string) {
  const supabase = createClient();

  try {
    // Check if user has completed onboarding
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('is_completed')
      .eq('user_id', userId)
      .limit(1)
      .order('created_at', { ascending: false })
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      throw onboardingError;
    }

    // If no onboarding record exists, user needs onboarding
    // If ANY record exists (regardless of is_completed), onboarding is done
    const needsUserOnboarding = !onboardingData;

    return needsUserOnboarding;
  } catch (error) {
    return false;
  }
}