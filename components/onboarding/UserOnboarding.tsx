'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, Lightbulb, User, Building, Zap, Target, MessageSquare, TrendingUp, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { OnboardingHeader } from './OnboardingHeader';

interface UserOnboardingProps {
  onComplete: (responses: {
    step1: string | null;
    step2: string | null;
    step3: string | null;
  }) => void;
  showThreadsConnection?: boolean;
  onThreadsSkip?: () => void;
}

type Step = 1 | 2 | 3 | 4;

export function UserOnboarding({ onComplete, showThreadsConnection = false, onThreadsSkip }: UserOnboardingProps) {
  const t = useTranslations('UserOnboarding');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [responses, setResponses] = useState({
    step1: null as string | null,
    step2: null as string | null,
    step3: null as string | null,
  });

  // Define step data with translations
  const stepData = {
    1: {
      title: t('step1Title'),
      description: t('step1Description'),
      options: [
        {
          id: 'followers',
          title: t('step1Options.followers'),
          description: t('followersDescription'),
          icon: TrendingUp
        },
        {
          id: 'brand',
          title: t('step1Options.brand'),
          description: t('brandDescription'),
          icon: Target
        },
        {
          id: 'product',
          title: t('step1Options.product'),
          description: t('productDescription'),
          icon: BarChart3
        },
      ]
    },
    2: {
      title: t('step2Title'),
      description: t('step2Description'),
      options: [
        {
          id: 'solo',
          title: t('step2Options.solo'),
          description: t('soloDescription'),
          icon: User
        },
        {
          id: 'marketer',
          title: t('step2Options.marketer'),
          description: t('marketerDescription'),
          icon: Building
        },
        {
          id: 'agency',
          title: t('step2Options.agency'),
          description: t('agencyDescription'),
          icon: Zap
        },
      ]
    },
    3: {
      title: t('step3Title'),
      description: t('step3Description'),
      options: [
        {
          id: 'ideas',
          title: t('step3Options.ideas'),
          description: t('ideasDescription'),
          icon: Lightbulb
        },
        {
          id: 'consistent',
          title: t('step3Options.consistent'),
          description: t('consistentDescription'),
          icon: Clock
        },
        {
          id: 'engagement',
          title: t('step3Options.engagement'),
          description: t('engagementDescription'),
          icon: TrendingUp
        },
      ]
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (currentStep <= 3) {
      const currentData = stepData[currentStep as keyof typeof stepData];
      const selectedOption = currentData.options.find((opt: any) => opt.id === optionId);

      setResponses(prev => ({
        ...prev,
        [`step${currentStep}`]: selectedOption?.title || null,
      }));
    }
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      // Save responses to DB
      onComplete(responses);
      // Only show step 4 if showThreadsConnection is true
      if (showThreadsConnection) {
        setCurrentStep(4);
      }
    }
  };

  const handleSkip = () => {
    setResponses(prev => ({
      ...prev,
      [`step${currentStep}`]: null,
    }));
    handleContinue();
  };

  const handleConnectThreads = () => {
    window.location.href = '/api/threads/oauth';
  };

  const getCurrentSelectedOption = () => {
    return responses[`step${currentStep}` as keyof typeof responses];
  };

  if (currentStep === 4) {
    // Step 4: Connect Threads Account
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <OnboardingHeader />
        {/* Progress bar - full width at top */}
        <div className="w-full bg-gray-200 h-1">
          <div className="bg-black h-1" style={{ width: `${(4 / 5) * 100}%` }} />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto p-4 gap-6 md:gap-10">
          <div className="flex flex-col items-center text-center">
            <img src="/twyn-logo-blk.svg" alt="Threads" className="w-32 h-fit mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {t('connectThreadsTitle')}
            </h1>
            <p className="text-lg text-gray-600 whitespace-pre-line">
              {t('connectThreadsDescription')}
            </p>
          </div>
          <div className="text-center space-y-4 flex flex-col items-center">
            <Button
              size="lg"
              className="py-6 text-md font-medium rounded-xl"
              onClick={handleConnectThreads}
            >
              <img src="/threads.svg" alt="Threads" className="w-6 h-6 mr-2" />
              {t('connectThreads')}
            </Button>
            <button
              onClick={onThreadsSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('connectLater')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Steps 1-3: Question screens
  const currentData = stepData[currentStep as keyof typeof stepData];
  const currentSelectedOption = getCurrentSelectedOption();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <OnboardingHeader />
      {/* Progress bar - full width at top */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-black h-1 transition-all duration-300"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {currentData.title}
          </h1>
          <p className="text-lg text-gray-600">
            {currentData.description}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-6 md:mb-12">
          {currentData.options.map((option: any) => {
            const IconComponent = option.icon;
            const isSelected = currentSelectedOption === option.title;

            return (
              <Card
                key={option.id}
                className={`cursor-pointer p-5 md:p-6 transition-all shadow-sm hover:shadow-lg${isSelected
                  ? 'focus:ring-2 focus:ring-gray-500 bg-gray-100 border-gray-500'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <CardContent>
                  <div className="flex gap-4 items-start">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className={`flex-1 ${isSelected ? 'text-gray-900' : 'text-muted-foreground'}`}>
                      <h3 className="text-xl font-semibold">
                        {option.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Button
            size="lg"
            className="w-full py-4 text-lg font-medium"
            onClick={handleContinue}
            disabled={!currentSelectedOption}
          >
            {t('continue')}
          </Button>
          <button
            onClick={currentStep !== 3 ? handleSkip : undefined}
            className={`text-sm underline ${currentStep !== 3 ? 'text-gray-500 hover:text-gray-700' : 'invisible'}`}
          >
            {t('skip')}
          </button>
        </div>
      </div>
    </div>
  );
}