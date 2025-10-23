import { ProfileAnalytics } from './analytics';

type SimplePreference = {
    id?: string;
    name: string;
    description?: string | null;
};

type SimpleAddOn = SimplePreference;

export interface RecommendedTopic {
    id: string;
    title: string;
    description: string;
    expectedScore: number;
    rationale: string;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

const sanitiseKeyword = (value: string): string =>
    value
        .replace(/[#~`"*]+/g, '')
        .trim();

const extractKeywords = (source: string): string[] => {
    if (!source) return [];
    const candidates = source.includes(',')
        ? source.split(',')
        : source.split(/\s+/);
    const deduped: string[] = [];
    candidates.forEach((candidate) => {
        const cleaned = sanitiseKeyword(candidate);
        if (cleaned && !deduped.includes(cleaned) && cleaned.length > 2) {
            deduped.push(cleaned);
        }
    });
    return deduped.slice(0, 6);
};

const scoreForMetric = (analytics: ProfileAnalytics | null, index: number): number => {
    if (!analytics?.topMetric) {
        return Math.max(5.5, 7.5 - index * 0.6);
    }
    const base = Math.min(9.5, 6 + Math.log1p(Math.abs(analytics.topMetric.delta || 0)));
    return Math.max(5.5, Math.min(10, base - index * 0.4));
};

const buildDescription = (
    subject: string,
    audience?: SimplePreference | null,
    objective?: SimplePreference | null,
    addOns: SimpleAddOn[] = [],
): string => {
    const pieces: string[] = [];
    if (audience?.name) {
        pieces.push(`Tailored for ${audience.name}`);
    }
    if (objective?.name) {
        pieces.push(`aligns with the goal of "${objective.name}"`);
    }
    if (addOns.length) {
        pieces.push(`incorporates add-ons: ${addOns.map((item) => item.name).join(', ')}`);
    }
    return pieces.length ? `${subject}. ${pieces.join('. ')}.` : `${subject}.`;
};

export const generateRecommendedTopics = (
    analytics: ProfileAnalytics | null,
    currentHeadline: string,
    audience?: SimplePreference | null,
    objective?: SimplePreference | null,
    addOns: SimpleAddOn[] = [],
): RecommendedTopic[] => {
    const keywords = extractKeywords(currentHeadline);
    const primaryKeyword = keywords[0] || 'growth';
    const secondaryKeyword = keywords[1] || analytics?.topMetric?.label?.toLowerCase() || 'engagement';
    const audienceName = audience?.name || 'your audience';

    const templates = [
        {
            title: `Why ${audienceName} responds to ${primaryKeyword}-driven storytelling`,
            subject: `Break down a recent success angle that boosted ${analytics?.topMetric?.label ?? 'engagement'}.`,
            rationale: `Connects audience pain points with a proven engagement lever (${analytics?.topMetric?.label ?? 'engagement'}).`,
        },
        {
            title: `${secondaryKeyword.toUpperCase()} hacks: quick wins ${audienceName} can apply today`,
            subject: `Offer actionable tactics that align with audience routines and highlight measurable outcomes.`,
            rationale: `Delivers pragmatic value around ${secondaryKeyword}, increasing shareability.`,
        },
        {
            title: `The hidden metric ${audienceName} should track next`,
            subject: `Demystify a lesser-known KPI and show how it ladders up to ${objective?.name ?? 'growth objectives'}.`,
            rationale: `Educational angle builds authority while nudging toward the stated objective.`,
        },
        {
            title: `Behind-the-scenes: building trust with ${audienceName}`,
            subject: `Share narrative details that emphasise authenticity and align with persona tone.`,
            rationale: `Narrative format increases saves and conversations by humanising the brand voice.`,
        },
        {
            title: `Future-proof strategies for ${audienceName} in ${new Date().getFullYear()}`,
            subject: `Predict emerging shifts and how to respond with agility, referencing add-on guidance.`,
            rationale: `Forward-looking content positions you as a strategist and drives higher repost potential.`,
        },
    ];

    return templates.map((template, index) => ({
        id: generateId(),
        title: template.title,
        description: buildDescription(template.subject, audience, objective, addOns),
        expectedScore: Number(scoreForMetric(analytics, index).toFixed(1)),
        rationale: template.rationale,
    }));
};

export const buildRecommendationsSummary = (topics: RecommendedTopic[]): string => {
    if (!topics.length) return '';
    return topics
        .map((topic, index) => `${index + 1}. ${topic.title} (expected score: ${topic.expectedScore})`)
        .join('\n');
};
