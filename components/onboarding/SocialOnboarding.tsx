'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SocialOnboardingProps {
  socialAccountId: string;
  onComplete: (profileDescription: string) => void;
}

export function SocialOnboarding({ socialAccountId, onComplete }: SocialOnboardingProps) {
  const [profileDescription, setProfileDescription] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    username?: string;
    platform?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  // Load account information
  useEffect(() => {
    const loadAccountInfo = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('social_accounts')
          .select('username, platform, profile_description')
          .eq('id', socialAccountId)
          .single();

        if (error) throw error;

        if (data) {
          setAccountInfo({
            username: data.username,
            platform: data.platform,
          });
          // Pre-fill if there's existing description
          if (data.profile_description) {
            setProfileDescription(data.profile_description);
          }
        }
      } catch (error) {
        console.error('Error loading account info:', error);
        toast.error('Error loading account info');
      } finally {
        setLoading(false);
      }
    };

    loadAccountInfo();
  }, [socialAccountId]);

  const handleSubmit = () => {
    onComplete(profileDescription);
  };

  const handleSkip = () => {
    onComplete('');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto p-6">
      {/* Progress indicator */}
      {/* <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Step 5 of 5</span>
          <span className="text-sm text-muted-foreground">100%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-full" />
        </div>
      </div> */}

      {/* Content */}
      <div className="space-y-6 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description', { platform: accountInfo.platform })}
          </p>
          {accountInfo.username && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {t('connected', { username: accountInfo.username })}
            </div>
          )}
        </div>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>{t('profileDescriptionLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-description">
                  Tell us about your profile in detail
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Include information about:
                </p>
                <ul className="text-sm text-muted-foreground mb-4 space-y-1 ml-4">
                  <li>• What is your profile about?</li>
                  <li>• Who's your target audience?</li>
                  <li>• What is your unique point?</li>
                </ul>
                <Textarea
                  id="profile-description"
                  placeholder={t('iAmA')}
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  className="h-fit focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                  maxLength={150}
                  minLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example card */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">{t('exampleDescription')}</h4>
            <p className="text-sm text-muted-foreground">
              "I'm a digital marketing specialist focused on helping small businesses grow their online presence.
              I share practical tips about social media marketing, content creation, and customer engagement.
              My audience includes small business owners, marketers, and entrepreneurs looking to build their brand online.
              What makes me unique is my focus on budget-friendly strategies that deliver real results."
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Button
            size="lg"
            className="w-full py-4 text-lg font-medium"
            onClick={handleSubmit}
            disabled={!profileDescription.trim()}
          >
            Complete Setup
          </Button>

          {/* <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button> */}
        </div>
      </div>
    </div>
  );
}