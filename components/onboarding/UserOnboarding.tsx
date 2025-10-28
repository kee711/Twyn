'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Building,
  Clock,
  Lightbulb,
  Target,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { OnboardingHeader } from './OnboardingHeader';

type StepKey =
  | 'goal'
  | 'role'
  | 'challenge'
  | 'threads'
  | 'persona'
  | 'audience'
  | 'objective'
  | 'addon';

interface OptionDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface OptionSelection {
  id: string;
  title: string;
}

interface PreferenceFormState {
  name: string;
  description: string;
}

interface AddOnFormState {
  name: string;
  description: string;
}

type StepDefinition =
  | {
      key: 'goal' | 'role' | 'challenge';
      type: 'options';
      title: string;
      description: string;
      options: OptionDefinition[];
    }
  | {
      key: 'threads';
      type: 'threads';
      title: string;
      description: string;
      note: string;
    }
  | {
      key: 'persona' | 'audience' | 'objective';
      type: 'form';
      title: string;
      description: string;
      nameLabel: string;
      namePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
    }
  | {
      key: 'addon';
      type: 'addon';
      title: string;
      description: string;
      nameLabel: string;
      namePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      hint: string;
    };

type OptionResponseKey = 'step1' | 'step2' | 'step3';

const stepKeyToResponseKey: Record<'goal' | 'role' | 'challenge', OptionResponseKey> = {
  goal: 'step1',
  role: 'step2',
  challenge: 'step3',
};

type ThreadsStatus = 'pending' | 'connected' | 'skipped';

interface CompletionPayload {
  step1: string | null;
  step2: string | null;
  step3: string | null;
  persona: PreferenceFormState;
  audience: PreferenceFormState;
  objective: PreferenceFormState;
  addOn: AddOnFormState | null;
  threadsStatus: ThreadsStatus;
}

export type UserOnboardingCompletionPayload = CompletionPayload;

interface UserOnboardingProps {
  onComplete: (responses: CompletionPayload) => Promise<void> | void;
  showThreadsConnection?: boolean;
}

export function UserOnboarding({
  onComplete,
  showThreadsConnection = false,
}: UserOnboardingProps) {
  const t = useTranslations('UserOnboarding');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [threadsStatus, setThreadsStatus] = useState<ThreadsStatus>(
    showThreadsConnection ? 'pending' : 'connected',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<{
    step1: OptionSelection | null;
    step2: OptionSelection | null;
    step3: OptionSelection | null;
  }>({
    step1: null,
    step2: null,
    step3: null,
  });
  const [persona, setPersona] = useState<PreferenceFormState>({
    name: '',
    description: '',
  });
  const [audience, setAudience] = useState<PreferenceFormState>({
    name: '',
    description: '',
  });
  const [objective, setObjective] = useState<PreferenceFormState>({
    name: '',
    description: '',
  });
  const [addOn, setAddOn] = useState<AddOnFormState>({
    name: '',
    description: '',
  });

  const baseOptionSteps: StepDefinition[] = useMemo(
    () => [
      {
        key: 'goal',
        type: 'options',
        title: t('step1Title'),
        description: t('step1Description'),
        options: [
          {
            id: 'followers',
            title: t('step1Options.followers'),
            description: t('followersDescription'),
            icon: TrendingUp,
          },
          {
            id: 'brand',
            title: t('step1Options.brand'),
            description: t('brandDescription'),
            icon: Target,
          },
          {
            id: 'product',
            title: t('step1Options.product'),
            description: t('productDescription'),
            icon: BarChart3,
          },
        ],
      },
      {
        key: 'role',
        type: 'options',
        title: t('step2Title'),
        description: t('step2Description'),
        options: [
          {
            id: 'solo',
            title: t('step2Options.solo'),
            description: t('soloDescription'),
            icon: User,
          },
          {
            id: 'marketer',
            title: t('step2Options.marketer'),
            description: t('marketerDescription'),
            icon: Building,
          },
          {
            id: 'agency',
            title: t('step2Options.agency'),
            description: t('agencyDescription'),
            icon: Zap,
          },
        ],
      },
      {
        key: 'challenge',
        type: 'options',
        title: t('step3Title'),
        description: t('step3Description'),
        options: [
          {
            id: 'ideas',
            title: t('step3Options.ideas'),
            description: t('ideasDescription'),
            icon: Lightbulb,
          },
          {
            id: 'consistent',
            title: t('step3Options.consistent'),
            description: t('consistentDescription'),
            icon: Clock,
          },
          {
            id: 'engagement',
            title: t('step3Options.engagement'),
            description: t('engagementDescription'),
            icon: TrendingUp,
          },
        ],
      },
    ],
    [t],
  );

  const steps: StepDefinition[] = useMemo(() => {
    const formSteps: StepDefinition[] = [
      {
        key: 'persona',
        type: 'form',
        title: t('personaStepTitle'),
        description: t('personaStepDescription'),
        nameLabel: t('personaNameLabel'),
        namePlaceholder: t('personaNamePlaceholder'),
        descriptionLabel: t('personaDescriptionLabel'),
        descriptionPlaceholder: t('personaDescriptionPlaceholder'),
      },
      {
        key: 'audience',
        type: 'form',
        title: t('audienceStepTitle'),
        description: t('audienceStepDescription'),
        nameLabel: t('audienceNameLabel'),
        namePlaceholder: t('audienceNamePlaceholder'),
        descriptionLabel: t('audienceDescriptionLabel'),
        descriptionPlaceholder: t('audienceDescriptionPlaceholder'),
      },
      {
        key: 'objective',
        type: 'form',
        title: t('objectiveStepTitle'),
        description: t('objectiveStepDescription'),
        nameLabel: t('objectiveNameLabel'),
        namePlaceholder: t('objectiveNamePlaceholder'),
        descriptionLabel: t('objectiveDescriptionLabel'),
        descriptionPlaceholder: t('objectiveDescriptionPlaceholder'),
      },
      {
        key: 'addon',
        type: 'addon',
        title: t('addOnStepTitle'),
        description: t('addOnStepDescription'),
        nameLabel: t('addOnNameLabel'),
        namePlaceholder: t('addOnNamePlaceholder'),
        descriptionLabel: t('addOnDescriptionLabel'),
        descriptionPlaceholder: t('addOnDescriptionPlaceholder'),
        hint: t('addOnOptionalHint'),
      },
    ];

    if (!showThreadsConnection) {
      return [...baseOptionSteps, ...formSteps];
    }

    const threadsStep: StepDefinition = {
      key: 'threads',
      type: 'threads',
      title: t('connectThreadsTitle'),
      description: t('connectThreadsDescription'),
      note: t('connectThreadsNote'),
    };

    return [...baseOptionSteps, threadsStep, ...formSteps];
  }, [baseOptionSteps, showThreadsConnection, t]);

  useEffect(() => {
    if (activeStepIndex > steps.length - 1) {
      setActiveStepIndex(steps.length - 1);
    }
  }, [steps.length, activeStepIndex]);

  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((activeStepIndex + 1) / totalSteps) * 100 : 0;
  const currentStep = steps[activeStepIndex];

  const handleOptionSelect = (stepKey: 'goal' | 'role' | 'challenge', option: OptionDefinition) => {
    const responseKey = stepKeyToResponseKey[stepKey];
    setResponses(prev => ({
      ...prev,
      [responseKey]: {
        id: option.id,
        title: option.title,
      },
    }));
  };

  const handleBack = () => {
    setActiveStepIndex(prev => Math.max(prev - 1, 0));
  };

  const goToNextStep = () => {
    setActiveStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleFinalize = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onComplete({
        step1: responses.step1?.title ?? null,
        step2: responses.step2?.title ?? null,
        step3: responses.step3?.title ?? null,
        persona: {
          name: persona.name.trim(),
          description: persona.description.trim(),
        },
        audience: {
          name: audience.name.trim(),
          description: audience.description.trim(),
        },
        objective: {
          name: objective.name.trim(),
          description: objective.description.trim(),
        },
        addOn:
          addOn.name.trim() || addOn.description.trim()
            ? {
                name: addOn.name.trim(),
                description: addOn.description.trim(),
              }
            : null,
        threadsStatus,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (currentStep?.key === 'addon') {
      await handleFinalize();
      return;
    }
    goToNextStep();
  };

  const handleConnectThreads = () => {
    setThreadsStatus('connected');
    window.location.href = '/api/threads/oauth';
  };

  const handleSkipThreads = () => {
    setThreadsStatus('skipped');
  };

  const getSelectedOptionId = (stepKey: 'goal' | 'role' | 'challenge') => {
    const responseKey = stepKeyToResponseKey[stepKey];
    return responses[responseKey]?.id ?? null;
  };

  const isContinueEnabled = useMemo(() => {
    if (!currentStep) return false;

    switch (currentStep.type) {
      case 'options': {
        const selectedId = getSelectedOptionId(currentStep.key);
        return Boolean(selectedId);
      }
      case 'form': {
        const state =
          currentStep.key === 'persona'
            ? persona
            : currentStep.key === 'audience'
              ? audience
              : objective;
        return Boolean(state.name.trim()) && Boolean(state.description.trim());
      }
      case 'threads':
        return threadsStatus !== 'pending';
      case 'addon':
        return !isSubmitting;
      default:
        return false;
    }
  }, [audience, currentStep, getSelectedOptionId, isSubmitting, objective, persona, threadsStatus]);

  const renderOptionsStep = (step: Extract<StepDefinition, { type: 'options' }>) => (
    <>
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{step.title}</h1>
        <p className="text-lg text-gray-600">{step.description}</p>
      </div>
      <div className="space-y-4">
        {step.options.map(option => {
          const IconComponent = option.icon;
          const isSelected = getSelectedOptionId(step.key) === option.id;
          return (
            <Card
              key={option.id}
              onClick={() => handleOptionSelect(step.key, option)}
              className={`cursor-pointer transition-all shadow-sm hover:shadow-lg ${
                isSelected ? 'border-gray-500 bg-gray-100 ring-2 ring-gray-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardContent className="flex items-start gap-4 p-5 md:p-6">
                <div
                  className={`rounded-xl p-2 ${
                    isSelected ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );

  const renderFormStep = (step: Extract<StepDefinition, { type: 'form' }>) => {
    const state =
      step.key === 'persona'
        ? persona
        : step.key === 'audience'
          ? audience
          : objective;
    const updateState = (field: keyof PreferenceFormState, value: string) => {
      if (step.key === 'persona') {
        setPersona(prev => ({ ...prev, [field]: value }));
      } else if (step.key === 'audience') {
        setAudience(prev => ({ ...prev, [field]: value }));
      } else {
        setObjective(prev => ({ ...prev, [field]: value }));
      }
    };

    return (
      <>
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{step.title}</h1>
          <p className="text-lg text-gray-600">{step.description}</p>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 text-left">
            <Label htmlFor={`${step.key}-name`} className="text-sm font-medium text-neutral-700">
              {step.nameLabel}
            </Label>
            <Input
              id={`${step.key}-name`}
              value={state.name}
              onChange={event => updateState('name', event.target.value)}
              placeholder={step.namePlaceholder}
              className="rounded-xl border-gray-200 bg-white/70 px-4 py-3 text-neutral-800"
            />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <Label
              htmlFor={`${step.key}-description`}
              className="text-sm font-medium text-neutral-700"
            >
              {step.descriptionLabel}
            </Label>
            <Textarea
              id={`${step.key}-description`}
              value={state.description}
              onChange={event => updateState('description', event.target.value)}
              placeholder={step.descriptionPlaceholder}
              className="min-h-[140px] rounded-xl border-gray-200 bg-white/70 px-4 py-3 text-neutral-800"
            />
          </div>
        </div>
      </>
    );
  };

  const renderAddOnStep = (step: Extract<StepDefinition, { type: 'addon' }>) => (
    <>
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{step.title}</h1>
        <p className="text-lg text-gray-600">{step.description}</p>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="add-on-name" className="text-sm font-medium text-neutral-700">
            {step.nameLabel}
          </Label>
          <Input
            id="add-on-name"
            value={addOn.name}
            onChange={event => setAddOn(prev => ({ ...prev, name: event.target.value }))}
            placeholder={step.namePlaceholder}
            className="rounded-xl border-gray-200 bg-white/70 px-4 py-3 text-neutral-800"
          />
        </div>
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="add-on-description" className="text-sm font-medium text-neutral-700">
            {step.descriptionLabel}
          </Label>
          <Textarea
            id="add-on-description"
            value={addOn.description}
            onChange={event =>
              setAddOn(prev => ({
                ...prev,
                description: event.target.value,
              }))
            }
            placeholder={step.descriptionPlaceholder}
            className="min-h-[140px] rounded-xl border-gray-200 bg-white/70 px-4 py-3 text-neutral-800"
          />
        </div>
        <p className="text-sm text-neutral-500 text-left">{step.hint}</p>
      </div>
    </>
  );

  const renderThreadsStep = (step: Extract<StepDefinition, { type: 'threads' }>) => (
    <div className="flex flex-col items-center text-center gap-6 md:gap-10">
      <img src="/twyn-logo-blk.svg" alt="Twyn logo" className="w-28 md:w-32 h-auto" />
      <div className="space-y-4 max-w-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{step.title}</h1>
        <p className="text-lg text-gray-600 whitespace-pre-line">{step.description}</p>
        <p className="text-sm text-neutral-500">{step.note}</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="py-5 px-8 text-base font-medium rounded-xl"
          onClick={handleConnectThreads}
        >
          <img src="/threads.svg" alt="Threads" className="w-6 h-6 mr-2" />
          {t('connectThreads')}
        </Button>
        <button
          type="button"
          onClick={handleSkipThreads}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t('connectLater')}
        </button>
        {threadsStatus === 'skipped' ? (
          <p className="text-xs text-neutral-500">{t('connectThreadsSkipped')}</p>
        ) : null}
      </div>
    </div>
  );

  if (!currentStep) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <OnboardingHeader />
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-black h-1 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-3xl w-full mx-auto px-4 py-16">
        <div className="flex-1 space-y-8">
          {currentStep.type === 'options' && renderOptionsStep(currentStep)}
          {currentStep.type === 'threads' && renderThreadsStep(currentStep)}
          {currentStep.type === 'form' && renderFormStep(currentStep)}
          {currentStep.type === 'addon' && renderAddOnStep(currentStep)}
        </div>
        <div className="mt-12 flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            {activeStepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full md:w-auto rounded-full px-6"
                disabled={isSubmitting}
              >
                {t('back')}
              </Button>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full md:w-auto rounded-full px-8 py-4 text-base font-semibold"
            onClick={handlePrimaryAction}
            disabled={!isContinueEnabled}
          >
            {currentStep.key === 'addon' ? t('finish') : t('continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
