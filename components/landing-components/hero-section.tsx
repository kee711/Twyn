"use client";

import { motion } from "framer-motion";
import { Circle, PartyPopper } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ShimmerButton } from "../ui/shimmer-button";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

function HeroSection({
    badge = "Beta Access - Limited Spots",
    title1 = "Conquering the Algorithm has Never Been Easier",
    subtitle = "Post, engage, and grow 10x faster on Threads.\nYour AI Marketing Agent does all the heavy lifting",
}: {
    badge?: string;
    title1?: string;
    subtitle?: string;
}) {
    const router = useRouter();

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    };

    const handleGetStarted = () => {
        router.push('/signin');
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
                                        {badge}
                                    </span>
                                </motion.div>

                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                >
                                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-landing-text-primary">
                                        {title1}
                                    </h1>
                                </motion.div>

                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <p className="text-lg text-landing-text-secondary mb-8 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                                        {subtitle}
                                    </p>
                                </motion.div>

                                <motion.div
                                    variants={fadeUpVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                >
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                        {/* <Button className="px-6 py-3 bg-white border border-gray-300 text-landing-text-tertiary hover:bg-gray-50 flex items-center space-x-2">
                                            <Circle className="w-4 h-4 text-landing-text-muted" />
                                            <span>Demo</span>
                                        </Button> */}
                                        <Button className="flex flex-col px-12 py-6 text-md rounded-xl bg-landing-primary-600 hover:bg-landing-primary-700 text-white" onClick={handleGetStarted}>
                                            Get 2 months free
                                            <div className="flex items-center gap-2 opacity-80 text-landing-text-reverse">
                                                <PartyPopper className="w-4 h-4" />
                                                <div className="text-xs">Beta privilege</div>
                                            </div>
                                        </Button>
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
                                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-1">
                                        <div className="bg-gray-100 rounded-md h-fit flex items-center justify-center">
                                            <img src="/dashboard-bg-img.png" alt="Dashboard Preview" className="w-full h-full object-cover" />
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
