'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, Lightbulb, User, Building, Zap, Target, MessageSquare, TrendingUp, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UserOnboardingProps {
  onComplete: (responses: {
    step1: string | null;
    step2: string | null;
    step3: string | null;
  }) => void;
}

type Step = 1 | 2 | 3 | 4;

const stepData = (t: any) => ({
  1: {
    title: t('UserOnboarding.step1Title'),
    description: t('UserOnboarding.step1Description'),
    options: [
      { id: 'followers', title: t('UserOnboarding.step1Options.followers'), description: t('UserOnboarding.followersDescription'), icon: TrendingUp },
      { id: 'brand', title: t('UserOnboarding.step1Options.brand'), description: t('UserOnboarding.brandDescription'), icon: Target },
      { id: 'product', title: t('UserOnboarding.step1Options.product'), description: t('UserOnboarding.productDescription'), icon: BarChart3 },
    ]
  },
  2: {
    title: t('UserOnboarding.step2Title'),
    description: t('UserOnboarding.step2Description'),
    options: [
      { id: 'solo', title: t('UserOnboarding.step2Options.solo'), description: t('UserOnboarding.soloDescription'), icon: User },
      { id: 'marketer', title: t('UserOnboarding.step2Options.marketer'), description: t('UserOnboarding.marketerDescription'), icon: Building },
      { id: 'agency', title: t('UserOnboarding.step2Options.agency'), description: t('UserOnboarding.agencyDescription'), icon: Zap },
    ]
  },
  3: {
    title: t('UserOnboarding.step3Title'),
    description: t('UserOnboarding.step3Description'),
    options: [
      { id: 'ideas', title: t('UserOnboarding.step3Options.ideas'), description: t('UserOnboarding.ideasDescription'), icon: Lightbulb },
      { id: 'consistent', title: t('UserOnboarding.step3Options.consistent'), description: t('UserOnboarding.consistentDescription'), icon: Clock },
      { id: 'engagement', title: t('UserOnboarding.step3Options.engagement'), description: t('UserOnboarding.engagementDescription'), icon: TrendingUp },
    ]
  }
});

export function UserOnboarding({ onComplete }: UserOnboardingProps) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [responses, setResponses] = useState({
    step1: null as string | null,
    step2: null as string | null,
    step3: null as string | null,
  });

  const handleOptionSelect = (optionId: string) => {
    if (currentStep <= 3) {
      const currentData = stepData(t)[currentStep as keyof typeof stepData] as { options: { id: string; title: string; description: string; icon: React.ElementType }[] };
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
      // 3단계에서 Continue 누르면 DB 저장 후 4단계로 이동
      onComplete(responses);
      setCurrentStep(4);
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Progress bar - full width at top */}
        <div className="w-full bg-gray-200 h-1">
          <div className="bg-blue-500 h-1 w-full" />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto p-8 gap-10">
          <div className="flex flex-col items-center">
            <img src="/logo.svg" alt="Threads" className="w-52 h-fit mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('UserOnboarding.connectThreadsTitle')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('UserOnboarding.connectThreadsDescription')}
            </p>
          </div>
          <div className="text-center space-y-4 flex flex-col items-center">
            <Button
              size="lg"
              className="py-6 text-md font-medium rounded-xl"
              onClick={handleConnectThreads}
            >
              <img src="/threads.svg" alt="Threads" className="w-6 h-6 mr-2" />
              {t('UserOnboarding.connectThreads')}
            </Button>
            {/* <button
              onClick={handleConnectLater}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('UserOnboarding.connectLater')}
            </button> */}
          </div>
        </div>
      </div>
    );
  }

  // Steps 1-3: Question screens
  const currentData = stepData(t)[currentStep as keyof typeof stepData] as { title: string; description: string; options: { id: string; title: string; description: string; icon: React.ElementType }[] };
  const currentSelectedOption = getCurrentSelectedOption();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress bar - full width at top */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-blue-500 h-1 transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {currentData.title}
          </h1>
          <p className="text-lg text-gray-600">
            {currentData.description}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-12">
          {currentData.options.map((option: any) => {
            const IconComponent = option.icon;
            const isSelected = currentSelectedOption === option.title;

            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all shadow-sm hover:shadow-lg${isSelected
                  ? 'focus:ring-2 focus:ring-blue-500 bg-blue-50 border-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <CardContent className="p-1">
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
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
            {t('UserOnboarding.continue')}
          </Button>
          {currentStep !== 3 && (
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {t('UserOnboarding.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}