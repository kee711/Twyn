type SimplePreference = {
    id?: string;
    name: string;
    description?: string | null;
};

type SimpleAddOn = SimplePreference;

export interface AudienceAnalysis {
    personaName: string;
    personaDescription: string;
    motivations: string[];
    dos: string[];
    donts: string[];
    toneGuidelines: string[];
    summary: string;
}

const extractSentences = (text?: string | null, fallback?: string): string[] => {
    if (!text) return fallback ? [fallback] : [];
    const sentences = text
        .split(/[\n•\-]+/g)
        .map((segment) => segment.replace(/^[\s•\-]+/, '').trim())
        .filter(Boolean);
    if (sentences.length > 0) {
        return sentences.map((sentence) =>
            sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?')
                ? sentence
                : `${sentence}.`,
        );
    }
    return fallback ? [fallback] : [];
};

const createDos = (audience?: SimplePreference | null, objective?: SimplePreference | null, addOns: SimpleAddOn[] = []): string[] => {
    const items: string[] = [];

    if (objective?.name) {
        items.push(`Keep the core objective in focus: ${objective.name}.`);
    }

    if (audience?.description) {
        items.push(`Reflect the audience's needs by referencing: ${audience.description.trim().slice(0, 120)}${audience.description.length > 120 ? '...' : ''}`);
    } else if (audience?.name) {
        items.push(`Speak directly to ${audience.name} with tangible outcomes.`);
    }

    addOns.forEach((addOn) => {
        items.push(`Integrate the "${addOn.name}" add-on${addOn.description ? ` (${addOn.description.trim()})` : ''}.`);
    });

    if (items.length < 3) {
        items.push('Share concrete examples or micro-stories that build trust.');
    }

    return items.slice(0, 4);
};

const createDonts = (audience?: SimplePreference | null, objective?: SimplePreference | null): string[] => {
    const items: string[] = [];

    if (audience?.name) {
        items.push(`Avoid generic claims that do not resonate with ${audience.name}.`);
    }

    if (objective?.name) {
        items.push(`Do not dilute the main call-to-action away from ${objective.name}.`);
    }

    items.push('Avoid jargon-heavy explanations without practical examples.');
    items.push('Do not overlook feedback loops—invite replies, comments, or shares.');

    return items.slice(0, 4);
};

export const buildAudienceAnalysis = (
    persona?: SimplePreference | null,
    audience?: SimplePreference | null,
    objective?: SimplePreference | null,
    addOns: SimpleAddOn[] = [],
): AudienceAnalysis | null => {
    if (!persona && !audience && !objective) {
        return null;
    }

    const personaName = audience?.name ? `${audience.name} Persona` : persona?.name || 'Target Persona';
    const personaDescription = persona?.description || audience?.description || 'Refine messaging to align with audience motivations and pain points.';

    const motivations = extractSentences(audience?.description, 'Focus on concrete pains, desired outcomes, and lifestyle aspirations.');
    const dos = createDos(audience, objective, addOns);
    const donts = createDonts(audience, objective);
    const toneGuidelines = extractSentences(persona?.description, 'Keep the voice authentic, empathetic, and insight-driven.');

    const summaryParts = [
        `Persona: ${personaName}`,
        `Audience focus: ${audience?.name ?? 'Unknown audience'}`,
        motivations.length ? `Motivations: ${motivations.join(' ')}` : '',
        dos.length ? `Do's: ${dos.join(' ')}` : '',
        donts.length ? `Don'ts: ${donts.join(' ')}` : '',
    ].filter(Boolean);

    return {
        personaName,
        personaDescription,
        motivations,
        dos,
        donts,
        toneGuidelines,
        summary: summaryParts.join('\n'),
    };
};

export const buildAudienceSummaryText = (analysis: AudienceAnalysis | null): string => {
    if (!analysis) return '';
    const segments = [
        `${analysis.personaName}: ${analysis.personaDescription}`,
        analysis.motivations.length ? `Motivations: ${analysis.motivations.join(' ')}` : '',
        analysis.dos.length ? `Key Do's: ${analysis.dos.slice(0, 2).join(' ')}` : '',
        analysis.donts.length ? `Key Don'ts: ${analysis.donts.slice(0, 2).join(' ')}` : '',
    ].filter(Boolean);
    return segments.join('\n');
};
