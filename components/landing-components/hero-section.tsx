"use client";

import { motion } from "framer-motion";
import { Circle, PartyPopper } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ShimmerButton } from "../ui/shimmer-button";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

function HeroSection() {
    const t = useTranslations('landing.hero');
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    };

    const handleGetStarted = () => {
        router.push('/signin');
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage(t('emailRequired'));
            setIsSuccess(false);
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/waitinglist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setIsSuccess(true);
                setEmail(""); // 성공 시 입력 초기화
            } else {
                setMessage(data.error || t('registrationError'));
                setIsSuccess(false);
            }
        } catch (error) {
            setMessage(t('networkError'));
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="hero">
            <div className="relative min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-50 to-white">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-30">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '50px 50px',
                            maskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)',
                            WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)'
                        }}
                    />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex-1 flex flex-col">
                    {/* Top section for text */}
                    <div className="flex-1 flex items-center justify-center pt-32 pb-8">
                        <div className="container mx-auto px-4 md:px-6">
                            <div className="max-w-4xl mx-auto text-center">
                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-landing-primary-100 border border-landing-primary-200 mb-6"
                                >
                                    <Circle className="h-2 w-2 fill-landing-primary-600" />
                                    <span className="text-sm text-landing-primary-700 tracking-wide">
                                        {t('badge')}
                                    </span>
                                </motion.div>

                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-landing-text-primary">
                                        {t('title')}
                                    </h1>
                                </motion.div>

                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <p className="text-lg text-landing-text-secondary mb-8 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                                        {t('subtitle')}
                                    </p>
                                </motion.div>

                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                >
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        {/* 시작하기 버튼 */}
                                        <div className="rounded-2xl p-1 bg-landing-primary-100 hover:bg-landing-primary-200 hover:p-1.5 transition-all duration-300">
                                            <Button className="flex flex-col px-12 py-6 text-md rounded-xl bg-landing-primary-600 hover:bg-landing-primary-600 text-white" onClick={handleGetStarted}>
                                                {t('ctaButton')}
                                                <div className="flex items-center gap-2 opacity-80 text-landing-text-reverse">
                                                    <PartyPopper className="w-4 h-4" />
                                                    <div className="text-xs">{t('betaPrivilege')}</div>
                                                </div>
                                            </Button>
                                        </div>

                                        {/* 베타 사용자 이메일 등록
                                        <div className="flex flex-col items-center gap-4 w-full max-w-md">
                                            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 w-full h-12">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder={t('emailPlaceholder')}
                                                    disabled={isLoading}
                                                    className="flex-1 h-full px-4 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-landing-primary-500 focus:border-transparent text-landing-text-primary placeholder:text-landing-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="px-6 py-3 h-full rounded-2xl text-base bg-landing-primary-600 hover:bg-landing-primary-700 text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isLoading ? t('registering') : t('register')}
                                                </Button>
                                            </form>

                                            {message && (
                                                <div className={`text-sm text-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                                                    {message}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-landing-primary-600">
                                                <PartyPopper className="w-4 h-4" />
                                                <span className="text-sm">{t('registerBetaTester')}</span>
                                            </div>
                                        </div> */}

                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom section for dashboard image */}
                    <div className="flex-1 flex items-start justify-center pb-12">
                        <div className="container mx-auto px-4 md:px-6">
                            <motion.div
                                variants={fadeUpVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="max-w-6xl mx-auto"
                            >
                                {/* Placeholder for dashboard image */}
                                <div className="relative">
                                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-1">
                                        <div className="bg-gray-100 h-fit flex items-center justify-center rounded-2xl">
                                            <img src="/hero-img3.png" alt="Dashboard Preview" className="w-full h-full object-cover rounded-xl" />
                                            {/* <div className="text-center">
                                                <div className="w-16 h-16 bg-landing-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-landing-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-landing-text-primary mb-2">Dashboard Preview</h3>
                                                <p className="text-landing-text-secondary">Your analytics dashboard will appear here</p>
                                            </div> */}
                                        </div>
                                    </div>
                                    {/* Subtle shadow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-200/20 to-transparent rounded-lg -z-10 transform translate-y-4 blur-xl" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export { HeroSection }
