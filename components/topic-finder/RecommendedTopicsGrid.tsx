'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { RecommendedTopic } from '@/lib/topic-finder/recommendations';

interface RecommendedTopicsGridProps {
    topics: RecommendedTopic[];
    onUseTopic: (topic: RecommendedTopic) => void;
}

export const RecommendedTopicsGrid = ({ topics, onUseTopic }: RecommendedTopicsGridProps) => {
    if (!topics.length) return null;

    return (
        <Card className="w-full border border-border/60 bg-white/70">
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5"
            >
                <header className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                            Recommended Topics
                        </p>
                        <h3 className="text-lg font-semibold text-foreground">
                            High-probability viral angles
                        </h3>
                    </div>
                </header>
                <div className="flex flex-col gap-4">
                    {topics.map((topic) => (
                        <motion.div
                            key={topic.id}
                            layout
                            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/75 p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-base font-semibold text-foreground">
                                        {topic.title}
                                    </h4>
                                    {topic.description && (
                                        <p className="text-sm leading-snug text-muted-foreground">
                                            {topic.description}
                                        </p>
                                    )}
                                    {topic.rationale && (
                                        <p className="text-xs text-muted-foreground/80">
                                            {topic.rationale}
                                        </p>
                                    )}
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                    {topic.expectedScore.toFixed(1)}/10
                                </span>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="inline-flex items-center gap-1 rounded-full"
                                    onClick={() => onUseTopic(topic)}
                                >
                                    Use
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </Card>
    );
};
