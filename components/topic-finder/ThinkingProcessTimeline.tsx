'use client';

import { motion } from 'framer-motion';
import { Circle, CircleCheck, Loader2, OctagonAlert } from 'lucide-react';

import type { ThinkingProcessStep } from './conversationTypes';

interface ThinkingProcessTimelineProps {
    steps: ThinkingProcessStep[];
}

const statusStyles: Record<ThinkingProcessStep['status'], { icon: JSX.Element; dotClass: string; textClass: string }> = {
    pending: {
        icon: <Circle className="h-4 w-4 text-muted-foreground" />,
        dotClass: 'bg-muted',
        textClass: 'text-muted-foreground',
    },
    in_progress: {
        icon: <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />,
        dotClass: 'bg-indigo-500',
        textClass: 'text-indigo-600',
    },
    complete: {
        icon: <CircleCheck className="h-4 w-4 text-emerald-600" />,
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-600',
    },
    error: {
        icon: <OctagonAlert className="h-4 w-4 text-rose-500" />,
        dotClass: 'bg-rose-500',
        textClass: 'text-rose-500',
    },
};

export const ThinkingProcessTimeline = ({ steps }: ThinkingProcessTimelineProps) => {
    if (!steps.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border/60 bg-background/70 p-4"
        >
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                Thinking Process
            </p>
            <ol className="mt-4 space-y-3">
                {steps.map((step, index) => {
                    const styles = statusStyles[step.status];
                    return (
                        <li key={step.id} className="flex items-start gap-3">
                            <div className="flex h-6 items-center justify-center">
                                {styles.icon}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${styles.textClass}`}>{step.label}</p>
                                {step.description && (
                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div className="ml-4 h-6 w-px bg-border/60" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </motion.div>
    );
};
