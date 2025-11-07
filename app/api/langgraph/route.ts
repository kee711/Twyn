import { NextResponse } from 'next/server';

const DEFAULT_TOPIC = 'social media marketing strategy for AI startups';
const API_BASE = process.env.LANGGRAPH_API_URL;

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

function toArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function adaptToUiSchema(input: unknown): Record<string, unknown> | null {
  if (!isRecord(input)) return null;

  const out: Record<string, unknown> = {};

  // 1) Audience Analyzer
  const audience = input.audience_profile || input.audience || input.audienceAnalyzer;
  if (isRecord(audience)) {
    out['Audience Analyzer'] = { audience_profile: audience };
  }

  // 2) Summarizer
  const summarizer: Record<string, unknown> = {};
  if (typeof input.summary === 'string') summarizer.summary = input.summary;
  if (Array.isArray(input.keywords)) summarizer.keywords = input.keywords;
  if (isRecord(input.search_queries)) summarizer.search_queries = input.search_queries;
  if (Array.isArray(input.references)) summarizer.references = input.references;
  if (Object.keys(summarizer).length > 0) {
    out['Enhanced Summarizer'] = summarizer;
  }

  // 3) Recommended Topics
  const recTopicsFromUpstream = (input.recommended_topics || input.recommendedTopics);

  // Build Recommended Topics from multiple possible sources
  const recommendedTopics: Array<Record<string, unknown>> = [];

  if (Array.isArray(recTopicsFromUpstream)) {
    for (const item of recTopicsFromUpstream) {
      if (typeof item === 'string') {
        recommendedTopics.push({ title: item, rationale: '' });
      } else if (isRecord(item)) {
        const title = toStringValue(item.title) || toStringValue((item as any).topic) || toStringValue((item as any).keyword);
        const description = toStringValue((item as any).description) || toStringValue((item as any).recommended_content_type) || '';
        const expectedRaw = (item as any).expected_score ?? (item as any).expected_viral_score ?? (item as any).score ?? (item as any).expected_engagement;
        const expectedScore = typeof expectedRaw === 'number' ? expectedRaw : undefined;
        const rationale = toStringValue((item as any).rationale) || '';
        if (title) recommendedTopics.push({ title, description, expected_score: expectedScore, rationale });
      }
    }
  }

  // From selected_sub_keywords (keyword suggestions)
  if (Array.isArray(input.selected_sub_keywords)) {
    for (const item of input.selected_sub_keywords as any[]) {
      if (!isRecord(item)) continue;
      const title = toStringValue(item.keyword);
      const rationale = toStringValue(item.selection_reason) || '';
      const expected = typeof item.final_score === 'number' ? item.final_score : undefined;
      if (title) recommendedTopics.push({ title, description: '', expected_score: expected, rationale });
    }
  }

  // From content_recommendations (map keyword/type/engagement to a topic)
  if (Array.isArray(input.content_recommendations)) {
    for (const item of input.content_recommendations as any[]) {
      if (!isRecord(item)) continue;
      const title = toStringValue(item.keyword);
      const description = toStringValue(item.recommended_content_type) || '';
      const expected = typeof item.expected_engagement === 'number' ? item.expected_engagement : undefined;
      const rationale = toStringValue(item.priority) ? `Priority: ${item.priority}` : '';
      if (title) recommendedTopics.push({ title, description, expected_score: expected, rationale });
    }
  }

  // Deduplicate by normalized title
  if (recommendedTopics.length) {
    const seen = new Set<string>();
    const deduped: Array<Record<string, unknown>> = [];
    for (const t of recommendedTopics) {
      const key = toStringValue(t.title) || '';
      const norm = key.trim().toLowerCase();
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      deduped.push(t);
    }
    out['Recommended Topics'] = deduped;
    out['recommended_topics'] = deduped;
  }

  // 4) Keyword Intelligence nodes
  if (isRecord(input.main_keyword)) out['main_keyword'] = input.main_keyword;
  if (Array.isArray(input.keyword_breakdown)) out['keyword_breakdown'] = input.keyword_breakdown;
  if (Array.isArray(input.selected_sub_keywords)) out['selected_sub_keywords'] = input.selected_sub_keywords;
  if (isRecord(input.search_queries)) out['search_queries'] = input.search_queries;

  // 5) Engagement Analyzer
  if (isRecord(input.engagement_metrics)) out['engagement_metrics'] = input.engagement_metrics;

  // 6) Strategy Generator
  const actionable = toArray<string>(input.actionable_insights);
  const recommendations = toArray(input.content_recommendations);
  const competitive = isRecord(input.competitive_analysis) ? input.competitive_analysis : undefined;
  if (actionable.length || recommendations.length || competitive) {
    out['Strategy Generator'] = {
      actionable_insights: actionable,
      content_recommendations: recommendations,
      competitive_analysis: competitive,
    };
    if (actionable.length) out['actionable_insights'] = actionable;
    if (recommendations.length) out['content_recommendations'] = recommendations;
    if (competitive) out['competitive_analysis'] = competitive;
  }

  // 7) Reference Analyzer
  const refAnalysis = input.reference_analysis || input.referenceAnalyzer;
  if (Array.isArray(refAnalysis)) {
    out['Reference Analyzer'] = { reference_analysis: refAnalysis };
  }

  // 8) Search results
  if (isRecord(input.search_results)) {
    out['search_results'] = input.search_results;
  } else {
    // Sometimes upstream may return threads/x arrays directly
    const threadsItems = toArray(input.threads);
    const xItems = toArray(input.x);
    if (threadsItems.length || xItems.length) {
      out['search_results'] = { threads: threadsItems, x: xItems };
    }
  }

  // 9) Topic / Keyword planner-like hints
  const topic = toStringValue(input.topic) || toStringValue(input.title) || toStringValue(input.subject);
  if (topic) {
    out['Keyword Planner'] = {
      topic,
      keywords: Array.isArray(input.keywords) ? input.keywords : undefined,
      search_queries: isRecord(input.search_queries) ? input.search_queries : undefined,
    };
  }

  // 10) Flatten common top-level fields for UI fallbacks
  if (Array.isArray(input.references)) out['references'] = input.references;
  if (Array.isArray(input.errors)) out['errors'] = input.errors;

  return Object.keys(out).length ? out : null;
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const topic: string =
    typeof body?.topic === 'string' && body.topic.trim().length > 0
      ? body.topic.trim()
      : DEFAULT_TOPIC;

  try {
    const upstream = await fetch(`${API_BASE}/research/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = typeof (data as any)?.detail === 'string' ? (data as any).detail : JSON.stringify(data);
      console.error('[langgraph][proxy] upstream error', upstream.status, message);
      return NextResponse.json({ error: message || 'Upstream error' }, { status: upstream.status });
    }

    // If upstream already returns streaming events, pass-through.
    if (Array.isArray((data as any)?.events)) {
      return NextResponse.json(data);
    }

    // Unwrap common envelopes like { result: {...} } or { data: {...} }
    const root = (isRecord(data) && (data as any).result && isRecord((data as any).result))
      ? (data as any).result
      : (isRecord(data) && (data as any).data && isRecord((data as any).data))
        ? (data as any).data
        : data;

    // Adapt to UI-friendly aggregated schema and also build UI blocks on the server.
    const adapted = adaptToUiSchema(root) || {};

    const createId = () => Math.random().toString(36).slice(2);

    // Normalizers for UI block payloads
    const buildRecommendedTopics = (): any[] => {
      const src = (adapted as any)['Recommended Topics'] || (adapted as any)['recommended_topics'] || [];
      const list: any[] = Array.isArray(src) ? src : [];
      return list.map((item: any) => ({
        id: createId(),
        title: toStringValue(item?.title) || '',
        description: toStringValue(item?.description) || '',
        expectedScore: typeof item?.expected_score === 'number' ? item.expected_score : (typeof item?.score === 'number' ? item.score : 7),
        rationale: toStringValue(item?.rationale) || '',
      })).filter((t) => t.title);
    };

    const buildKeywordIntelligence = (): any | null => {
      const main = isRecord((adapted as any)['main_keyword']) ? (adapted as any)['main_keyword'] : null;
      const breakdown = Array.isArray((adapted as any)['keyword_breakdown']) ? (adapted as any)['keyword_breakdown'] : [];
      const selected = Array.isArray((adapted as any)['selected_sub_keywords']) ? (adapted as any)['selected_sub_keywords'] : [];
      const queries = isRecord((adapted as any)['search_queries']) ? (adapted as any)['search_queries'] : {};
      if (!main && breakdown.length === 0 && selected.length === 0 && Object.keys(queries).length === 0) return null;
      return {
        mainKeyword: main ? {
          keyword: toStringValue(main.keyword) || '',
          searchVolume: typeof main.search_volume === 'number' ? main.search_volume : undefined,
          competitionLevel: toStringValue(main.competition_level),
          trendScore: typeof main.trend_score === 'number' ? main.trend_score : undefined,
          relevanceScore: typeof main.relevance_score === 'number' ? main.relevance_score : undefined,
          cpcRange: isRecord(main.cpc_range) ? { min: main.cpc_range.min, max: main.cpc_range.max } : undefined,
        } : null,
        keywordBreakdown: breakdown.map((b: any) => ({ keyword: toStringValue(b?.keyword) || '', type: toStringValue(b?.type), relevance: typeof b?.relevance === 'number' ? b.relevance : undefined })).filter((b: any) => b.keyword),
        selectedSubKeywords: selected.map((s: any) => ({
          keyword: toStringValue(s?.keyword) || '',
          finalScore: typeof s?.final_score === 'number' ? s.final_score : undefined,
          engagementPotential: typeof s?.engagement_potential === 'number' ? s.engagement_potential : undefined,
          trendMomentum: typeof s?.trend_momentum === 'number' ? s.trend_momentum : undefined,
          competitionAdvantage: typeof s?.competition_advantage === 'number' ? s.competition_advantage : undefined,
          commercialValue: typeof s?.commercial_value === 'number' ? s.commercial_value : undefined,
          topicCoherenceScore: typeof s?.topic_coherence_score === 'number' ? s.topic_coherence_score : undefined,
          selectionReason: toStringValue(s?.selection_reason) || '',
        })).filter((s: any) => s.keyword),
        searchQueries: queries,
      };
    };

    const buildEngagementOverview = (): any | null => {
      const em = (adapted as any)['engagement_metrics'];
      if (!isRecord(em)) return null;
      const perfObj = isRecord(em.platform_performance) ? em.platform_performance : {};
      const platformPerformance = Object.entries(perfObj).map(([platform, v]: any) => ({
        platform,
        contentCount: typeof v?.content_count === 'number' ? v.content_count : undefined,
        averageQuality: typeof v?.average_quality === 'number' ? v.average_quality : undefined,
        topQualityScore: typeof v?.top_quality_score === 'number' ? v.top_quality_score : undefined,
      }));
      return {
        totalContentAnalyzed: typeof em.total_content_analyzed === 'number' ? em.total_content_analyzed : 0,
        averageQualityScore: typeof em.average_quality_score === 'number' ? em.average_quality_score : 0,
        platformPerformance,
        sentimentDistribution: isRecord(em.sentiment_distribution) ? em.sentiment_distribution : { positive: 0, neutral: 0, negative: 0 },
        keywordStrategy: (adapted as any)['keyword_strategy'] || undefined,
      };
    };

    const buildContentOpportunities = (): any | null => {
      const actionable = Array.isArray((adapted as any)['actionable_insights']) ? (adapted as any)['actionable_insights'] : [];
      const recs = Array.isArray((adapted as any)['content_recommendations']) ? (adapted as any)['content_recommendations'] : [];
      const comp = isRecord((adapted as any)['competitive_analysis']) ? (adapted as any)['competitive_analysis'] : null;
      if (!actionable.length && !recs.length && !comp) return null;
      return {
        actionableInsights: actionable,
        recommendations: recs.map((r: any) => ({
          keyword: toStringValue(r?.keyword) || '',
          recommendedContentType: toStringValue(r?.recommended_content_type) || undefined,
          expectedEngagement: typeof r?.expected_engagement === 'number' ? r.expected_engagement : undefined,
          priority: toStringValue(r?.priority) || undefined,
        })).filter((r: any) => r.keyword),
        competitiveAnalysis: comp ? {
          marketSaturation: toStringValue((comp as any).market_saturation),
          contentGapOpportunities: Array.isArray((comp as any).content_gap_opportunities) ? (comp as any).content_gap_opportunities : [],
          differentiationStrategies: Array.isArray((comp as any).differentiation_strategies) ? (comp as any).differentiation_strategies : [],
        } : null,
      };
    };

    const normalizeSocialItems = (items: any[], platformKey: 'threads'|'x') => {
      return (Array.isArray(items) ? items : []).map((it) => {
        const title = toStringValue(it?.title) || '';
        const content = toStringValue(it?.content) || '';
        const text = [title, content].filter(Boolean).join('\n\n');
        return {
          id: createId(),
          text,
          link: toStringValue(it?.url) || undefined,
          platform: platformKey,
        };
      });
    };

    const blocks: any[] = [];

    // Audience widget (if any)
    if (isRecord((adapted as any)['Audience Analyzer'])) {
      blocks.push({ id: createId(), type: 'widget', widgetType: 'audience', data: (adapted as any)['Audience Analyzer'].audience_profile });
    }

    // Recommended topics
    const topics = buildRecommendedTopics();
    if (topics.length) {
      blocks.push({ id: createId(), type: 'widget', widgetType: 'topics', data: topics });
    }

    // Keyword intelligence
    const ki = buildKeywordIntelligence();
    if (ki) {
      blocks.push({ id: createId(), type: 'widget', widgetType: 'keyword-intelligence', data: ki });
    }

    // Engagement overview
    const eo = buildEngagementOverview();
    if (eo) {
      blocks.push({ id: createId(), type: 'widget', widgetType: 'engagement-overview', data: eo });
    }

    // Content opportunities
    const co = buildContentOpportunities();
    if (co) {
      blocks.push({ id: createId(), type: 'widget', widgetType: 'content-opportunities', data: co });
    }

    // Threads/X blocks
    const sr = isRecord((adapted as any)['search_results']) ? (adapted as any)['search_results'] : {};
    if (isRecord(sr)) {
      const threadsItems = normalizeSocialItems(Array.isArray((sr as any).threads) ? (sr as any).threads : [], 'threads');
      const xItems = normalizeSocialItems(Array.isArray((sr as any).x) ? (sr as any).x : [], 'x');
      if (threadsItems.length || Array.isArray((sr as any).threads)) {
        blocks.push({ id: createId(), type: 'threads', title: 'Threads Search', items: threadsItems, audienceAnalysis: undefined, emptyMessage: threadsItems.length ? undefined : 'No Threads conversations met the quality threshold.' });
      }
      if (xItems.length || Array.isArray((sr as any).x)) {
        blocks.push({ id: createId(), type: 'x', title: 'X Search', items: xItems, audienceAnalysis: undefined, emptyMessage: xItems.length ? undefined : 'No X conversations matched the search intent.' });
      }
    }

    // Keyword Planner text
    const kp = isRecord((adapted as any)['Keyword Planner']) ? (adapted as any)['Keyword Planner'] : null;
    if (kp) {
      const parts: string[] = [];
      if (toStringValue((kp as any).topic)) parts.push(`Topic: ${(kp as any).topic}`);
      const kws = Array.isArray((kp as any).keywords) ? (kp as any).keywords : [];
      if (kws.length) parts.push(`Keywords: ${kws.join(', ')}`);
      if (isRecord((kp as any).search_queries)) {
        const sq: string[] = [];
        if (toStringValue((kp as any).search_queries?.threads)) sq.push(`Threads: ${(kp as any).search_queries.threads}`);
        if (toStringValue((kp as any).search_queries?.x)) sq.push(`X: ${(kp as any).search_queries.x}`);
        if (sq.length) parts.push(['Search Queries:', ...sq.map((l) => `- ${l}`)].join('\n'));
      }
      const text = parts.join('\n\n');
      if (text) blocks.push({ id: createId(), type: 'text', title: 'Keyword Planner', content: text });
    }

    // Summary text with external links (if any)
    const summarizer = isRecord((adapted as any)['Enhanced Summarizer']) ? (adapted as any)['Enhanced Summarizer'] : null;
    if (summarizer) {
      const summaryText = toStringValue((summarizer as any).summary) || '';
      const links: Array<{ id: string; label: string; url: string }> = [];
      const refs = Array.isArray((summarizer as any).references) ? (summarizer as any).references : [];
      const seen = new Set<string>();
      for (const ref of refs) {
        if (!isRecord(ref)) continue;
        const url = toStringValue(ref.url);
        if (!url) continue;
        const norm = url.trim();
        if (seen.has(norm)) continue; seen.add(norm);
        const label = toStringValue((ref as any).title) || norm.replace(/^https?:\/\//, '');
        // Skip social post links here; they show up in platform blocks
        const plat = toStringValue((ref as any).platform)?.toLowerCase() || '';
        if (['threads','thread','x','twitter','farcaster'].includes(plat)) continue;
        links.push({ id: createId(), label, url: norm });
      }
      if (summaryText || links.length) {
        blocks.push({ id: createId(), type: 'text', title: 'Summary', content: summaryText || 'Additional references provided.', links });
      }
    }

    return NextResponse.json({ blocks, aggregated: adapted, raw: root });
  } catch (error) {
    console.error('[langgraph][proxy] failed to call upstream', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
