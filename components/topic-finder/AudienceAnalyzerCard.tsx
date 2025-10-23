'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, CircleSlash2, Quote } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { AudienceAnalysis } from '@/lib/topic-finder/audience';

interface AudienceAnalyzerCardProps {
    analysis: AudienceAnalysis;
}

const BulletList = ({
    items,
    icon,
    tone,
}: {
    items: string[];
    icon: 'do' | 'dont';
    tone?: 'neutral' | 'subtle';
}) => {
    if (!items.length) return null;
    return (
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={`${icon}-${index}`} className="flex items-start gap-2 text-sm text-foreground/90">
                    {icon === 'do' ? (
                        <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-600" />
                    ) : (
                        <CircleSlash2 className="mt-1 h-4 w-4 text-rose-500" />
                    )}
                    <span className={tone === 'subtle' ? 'text-muted-foreground' : undefined}>{item}</span>
                </li>
            ))}
        </ul>
    );
};

export const AudienceAnalyzerCard = ({ analysis }: AudienceAnalyzerCardProps) => {
    return (
        <Card className="w-full border border-border/70 bg-white/70 shadow-sm">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-5"
            >
                <header className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                        Audience Analyzer
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">{analysis.personaName}</h3>
                    <p className="text-sm text-muted-foreground">{analysis.personaDescription}</p>
                </header>

                {analysis.motivations.length > 0 && (
                    <section className="rounded-2xl bg-muted/40 p-4">
                        <div className="flex items-start gap-2">
                            <Quote className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Motivations</p>
                                <ul className="mt-2 space-y-2 text-sm text-foreground/90">
                                    {analysis.motivations.slice(0, 3).map((motivation, index) => (
                                        <li key={`mot-${index}`}>{motivation}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <section className="rounded-xl border border-emerald-100/70 bg-emerald-50/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Do&apos;s</p>
                        <BulletList items={analysis.dos} icon="do" />
                    </section>
                    <section className="rounded-xl border border-rose-100/70 bg-rose-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Don&apos;ts</p>
                        <BulletList items={analysis.donts} icon="dont" />
                    </section>
                </div>

                {analysis.toneGuidelines.length > 0 && (
                    <section className="rounded-xl border border-border/60 bg-background/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Tone &amp; Voice
                        </p>
                        <BulletList items={analysis.toneGuidelines.slice(0, 3)} icon="do" tone="subtle" />
                    </section>
                )}
            </motion.div>
        </Card>
    );
};
