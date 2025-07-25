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

    // If no onboarding record exists or not completed, user needs onboarding
    const needsUserOnboarding = !onboardingData || onboardingData.is_completed !== true;

    return needsUserOnboarding;
  } catch (error) {
    return false;
  }
}