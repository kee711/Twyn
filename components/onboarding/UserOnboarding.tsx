'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, Lightbulb, User, Building, Zap, Target, MessageSquare, TrendingUp, AlertCircle, Clock, BarChart3 } from 'lucide-react';

interface UserOnboardingProps {
  onComplete: (responses: {
    step1: string | null;
    step2: string | null;
    step3: string | null;
  }) => void;
}

type Step = 1 | 2 | 3 | 4;

const stepData = {
  1: {
    title: 'What inspired you to start creating content?',
    description: 'Tell us about your motivation for content creation',
    options: [
      { id: 'followers', title: 'I want to grow my followers', description: 'I want to grow my followers', icon: TrendingUp },
      { id: 'brand', title: 'I want to build brand awareness', description: 'I want to build brand awareness', icon: Target },
      { id: 'product', title: 'I\'m promoting a product', description: 'I\'m promoting a product', icon: BarChart3 },
    ]
  },
  2: {
    title: 'How are you currently working on your content?',
    description: 'Help us understand your current setup',
    options: [
      { id: 'solo', title: 'I\'m doing it solo', description: 'I\'m doing it solo', icon: User },
      { id: 'marketer', title: 'I\'m a marketer at a company', description: 'I\'m a marketer at a company', icon: Building },
      { id: 'agency', title: 'I manage it for my clients', description: 'I manage it for my clients', icon: Zap },
    ]
  },
  3: {
    title: 'What is the hardest part about creating content?',
    description: 'Let us know your biggest challenge',
    options: [
      { id: 'ideas', title: 'I\'m running out of ideas', description: 'I\'m running out of ideas', icon: Lightbulb },
      { id: 'consistent', title: 'It\'s hard to stay consistent', description: 'It\'s hard to stay consistent', icon: Clock },
      { id: 'engagement', title: 'I\'m not getting much engagement', description: 'I\'m not getting much engagement', icon: TrendingUp },
    ]
  }
};

export function UserOnboarding({ onComplete }: UserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [responses, setResponses] = useState({
    step1: null as string | null,
    step2: null as string | null,
    step3: null as string | null,
  });

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

  const handleConnectLater = () => {
    window.location.href = '/contents/topic-finder';
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
              Connect your first account
            </h1>
            <p className="text-lg text-gray-600">
              Link your Threads account to start creating amazing content
            </p>
          </div>
          <div className="text-center space-y-4 flex flex-col items-center">
            <Button
              size="lg"
              className="py-6 text-md font-medium rounded-xl"
              onClick={handleConnectThreads}
            >
              <img src="/threads.svg" alt="Threads" className="w-6 h-6 mr-2" />
              Connect Threads Account
            </Button>
            {/* <button
              onClick={handleConnectLater}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Connect later
            </button> */}
          </div>
        </div>
      </div>
    );
  }

  // Steps 1-3: Question screens
  const currentData = stepData[currentStep as keyof typeof stepData];
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
            Continue
          </Button>
          {currentStep !== 3 && (
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}