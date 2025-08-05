'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 온보딩 단계 타입
type OnboardingStep = 'account_type' | 'account_info' | 'welcome';

// 계정 유형 타입
type AccountType = 'biz' | 'expert' | 'casual';

// 온보딩 모달 Props
interface OnboardingModalProps {
    open: boolean;
    onClose: () => void;
    socialAccountId: string;
}

export function OnboardingModal({ open, onClose, socialAccountId }: OnboardingModalProps) {
    const t = useTranslations('components.onboardingModal');
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('account_type');
    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [accountInfo, setAccountInfo] = useState('');
    const [tags, setTags] = useState<string[]>(['AI', 'Design', 'Tech', 'Mobile', 'App']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    // 계정 유형 선택 핸들러
    const handleAccountTypeSelect = (type: AccountType) => {
        setAccountType(type);
        if (type === 'casual') {
            // 캐주얼 타입은 info 입력 단계를 건너뛰고 환영 단계로
            setCurrentStep('welcome');
        } else {
            setCurrentStep('account_info');
        }
    };

    // 이전 단계로 이동 핸들러
    const handlePrevious = () => {
        if (currentStep === 'account_info') {
            setCurrentStep('account_type');
        } else if (currentStep === 'welcome') {
            // accountType이 'casual'인 경우 직접 account_type으로, 아닌 경우 account_info로
            setCurrentStep(accountType === 'casual' ? 'account_type' : 'account_info');
        }
    };

    // 온보딩 스킵 핸들러
    const handleSkip = async () => {
        if (currentStep === 'welcome') {
            await completeOnboarding();
        } else {
            // 스킵 시 확인 모달 표시가 필요하다면 여기에 구현
            const confirmSkip = window.confirm(t('confirmSkip'));
            if (confirmSkip) {
                if (currentStep === 'account_type') {
                    // 계정 유형 스킵, welcome 단계로 이동
                    setCurrentStep('welcome');
                } else if (currentStep === 'account_info') {
                    // 계정 정보 스킵, welcome 단계로 이동
                    setCurrentStep('welcome');
                }
            }
        }
    };

    // 온보딩 완료 핸들러
    const completeOnboarding = async () => {
        if (!session?.user?.id || !socialAccountId) {
            toast.error(t('userNotFound'));
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // 온보딩 상태 및 계정 정보를 social_accounts 테이블에 직접 업데이트
            const { error: updateError } = await supabase
                .from('social_accounts')
                .update({
                    onboarding_completed: true,
                    account_type: accountType || null,
                    account_info: accountInfo.trim() || null,
                    account_tags: tags.length > 0 ? tags : null
                })
                .eq('id', socialAccountId);

            if (updateError) throw updateError;

            toast.success(t('onboardingCompleted'));
            onClose();

            // '/contents-cooker/topic-finder'로 리다이렉트
            router.push('/contents/topic-finder');
        } catch (error) {
            console.error('온보딩 저장 오류:', error);
            toast.error(t('errorSavingOnboarding'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // 태그 추가 핸들러
    const addTag = (tag: string) => {
        if (!tags.includes(tag) && tag.trim() !== '') {
            setTags([...tags, tag]);
        }
    };

    // 태그 삭제 핸들러
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // AI 태그 생성 - 실제로는 OpenAI API 연동 필요
    const generateTags = async () => {
        // 실제 구현에서는 OpenAI 호출하여 태그 생성
        // 지금은 임시로 기본 태그 설정
        setTags(['AI', 'Design', 'Tech', 'Mobile', 'App']);
        toast.success(t('keywordsGenerated'));
    };

    // 다음 버튼 핸들러
    const handleNext = () => {
        if (currentStep === 'account_info') {
            setCurrentStep('welcome');
        } else if (currentStep === 'welcome') {
            completeOnboarding();
        }
    };

    // 계정 타입에 따른 타이틀과 힌트
    const getInfoTitleAndHint = () => {
        if (accountType === 'biz') {
            return {
                title: t('businessChannelQuestion'),
                hint: t('businessChannelHint')
            };
        } else {
            return {
                title: t('expertQuestion'),
                hint: t('expertHint')
            };
        }
    };

    // 현재 단계에 따른 컨텐츠 렌더링
    const renderStepContent = () => {
        switch (currentStep) {
            case 'account_type':
                return (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-2xl font-bold">{t('howToUseAccount')}</DialogTitle>
                            <DialogDescription className="pt-2">
                                {t('helpWithQuestions')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4 px-8">
                            {/* 비즈니스 마케팅 옵션 */}
                            <Button
                                variant={accountType === 'biz' ? 'default' : 'outline'}
                                className="justify-start p-4 h-auto"
                                onClick={() => handleAccountTypeSelect('biz')}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-lg">{t('businessMarketing')}</span>
                                    <span className="text-sm text-muted-foreground">{t('businessDescription')}</span>
                                </div>
                            </Button>

                            {/* 전문가 옵션 */}
                            <Button
                                variant={accountType === 'expert' ? 'default' : 'outline'}
                                className="justify-start p-4 h-auto"
                                onClick={() => handleAccountTypeSelect('expert')}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-lg">{t('expert')}</span>
                                    <span className="text-sm text-muted-foreground">{t('expertDescription')}</span>
                                </div>
                            </Button>

                            {/* 일반 사용자 옵션 */}
                            <Button
                                variant={accountType === 'casual' ? 'default' : 'outline'}
                                className="justify-start p-4 h-auto"
                                onClick={() => handleAccountTypeSelect('casual')}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold text-lg">{t('general')}</span>
                                    <span className="text-sm text-muted-foreground">{t('generalDescription')}</span>
                                </div>
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleSkip}>
                                {t('doLater')}
                            </Button>
                        </DialogFooter>
                    </>
                );

            case 'account_info':
                const { title, hint } = getInfoTitleAndHint();
                return (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                            <DialogDescription className="pt-2">
                                {t('saltAiHelp')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4 px-8">
                            <div>
                                <Textarea
                                    placeholder={hint}
                                    value={accountInfo}
                                    onChange={(e) => setAccountInfo(e.target.value)}
                                    className="min-h-[150px]"
                                />
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold">{t('keywords')}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={generateTags}
                                    >
                                        {t('saltAiGenerate')}
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="px-3 py-1">
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="ml-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('addNewTag')}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                addTag((e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                                            addTag(input.value);
                                            input.value = '';
                                        }}
                                    >
                                        {t('add')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handlePrevious}>
                                {t('previous')}
                            </Button>
                            <Button variant="outline" onClick={handleSkip}>
                                {t('doLater')}
                            </Button>
                            <Button onClick={handleNext} disabled={isSubmitting}>
                                {t('next')}
                            </Button>
                        </DialogFooter>
                    </>
                );

            case 'welcome':
                return (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-2xl font-bold">{t('welcomeToViralChef')}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-8 px-8">
                            <Image
                                src="/welcome-chef.png"
                                alt="Welcome"
                                width={200}
                                height={200}
                                className="mb-4"
                            />
                            <p className="text-center text-muted-foreground">
                                {t('welcomeMessage')}
                            </p>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handlePrevious}>
                                {t('previous')}
                            </Button>
                            <Button onClick={completeOnboarding} disabled={isSubmitting}>
                                {t('getStarted')}
                            </Button>
                        </DialogFooter>
                    </>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            // 닫기 버튼 클릭 시 onClose 콜백 호출
            if (!isOpen) {
                // 여기서는 자동으로 닫히지 않도록 함
                const confirmClose = window.confirm(t('confirmCloseOnboarding'));
                if (confirmClose) {
                    onClose();
                }
            }
        }}>
            <DialogContent className="sm:max-w-[750px]">
                <div className="flex-col">
                    <div className="mb-4 flex items-center justify-center">
                        <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 'account_type' || currentStep === 'account_info' || currentStep === 'welcome' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'} rounded-full text-sm font-medium`}>
                            1
                        </div>
                        <div className="mx-2 h-1 w-16 bg-gray-200">
                            <div
                                className="h-1 bg-primary"
                                style={{ width: currentStep === 'account_type' ? '0%' : currentStep === 'account_info' || currentStep === 'welcome' ? '100%' : '0%' }}
                            ></div>
                        </div>
                        <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 'account_info' || currentStep === 'welcome' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'} rounded-full text-sm font-medium`}>
                            2
                        </div>
                        <div className="mx-2 h-1 w-16 bg-gray-200">
                            <div
                                className="h-1 bg-primary"
                                style={{ width: currentStep === 'welcome' ? '100%' : '0%' }}
                            ></div>
                        </div>
                        <div className={`flex items-center justify-center w-8 h-8 ${currentStep === 'welcome' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'} rounded-full text-sm font-medium`}>
                            3
                        </div>
                    </div>

                    {/* 모달 내용 */}
                    <div className="min-h-[400px] flex flex-col">
                        {renderStepContent()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 