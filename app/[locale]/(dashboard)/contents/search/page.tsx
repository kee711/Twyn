'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ThreadSearchResult {
  id: string;
  url: string;
  title: string;
  content: string;
  username: string;
  timestamp: string | null;
  like_count: number;
  reply_count: number;
  quality_score: number;
  relevance_score: number;
  final_score: number;
}

const formatNumber = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString() : undefined;

const formatScore = (value?: number) =>
  typeof value === 'number' ? value.toFixed(2) : undefined;

const formatTimestamp = (value: string | null, locale: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

// TODO(test-feature): remove this entire page once the experimental Threads search ships officially
export default function ThreadsSearchTestPage() {
  const t = useTranslations('navigation');
  const locale = useLocale();

  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ThreadSearchResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);

  const disabled = useMemo(
    () => isSearching || keyword.trim().length === 0,
    [isSearching, keyword],
  );

  const handleSearch = useCallback(async () => {
    if (disabled) return;

    const trimmed = keyword.trim();
    if (!trimmed) {
      return;
    }

    setIsSearching(true);
    setErrors([]);
    setWarnings([]);
    setResults([]);
    setLastQuery(trimmed);

    try {
      const response = await fetch('/api/threads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      const payload = await response.json().catch(() => ({}));
      console.log('[threads-search-test] raw response payload', payload);
      if (!response.ok) {
        const message =
          typeof payload?.error === 'string' && payload.error.trim().length > 0
            ? payload.error
            : 'Threads 검색 중 오류가 발생했습니다.';
        throw new Error(message);
      }

      const items = Array.isArray(payload?.results) ? payload.results : [];
      const sanitized = items.filter(
        (item: unknown): item is ThreadSearchResult =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as ThreadSearchResult).id === 'string' &&
          typeof (item as ThreadSearchResult).url === 'string',
      );

      setResults(sanitized);
      setWarnings(
        Array.isArray(payload?.warnings)
          ? payload.warnings.filter((warning: unknown) => typeof warning === 'string')
          : [],
      );
      setLastRunAt(new Date());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Threads 검색이 실패했습니다.';
      setErrors((prev) => [...prev, message]);
    } finally {
      setIsSearching(false);
    }
  }, [disabled, keyword]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleSearch();
      }
    },
    [handleSearch],
  );

  const renderResultEmptyState =
    !isSearching && Boolean(lastQuery) && results.length === 0 && errors.length === 0;

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {t('threadsSearchTest')}
        </h1>
        <p className="text-sm text-muted-foreground">
          Threads 레퍼런스를 한번에 탐색해보세요.
        </p>
      </div>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground/90">
            검색 키워드 입력
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Threads 공식 API만 호출하여 결과를 반환합니다. 
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: social media marketing"
              className="flex-1"
              disabled={isSearching}
            />
            <Button
              className="md:w-48"
              onClick={() => void handleSearch()}
              disabled={disabled}
            >
              {isSearching ? (
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  검색 중
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm font-medium">
                  <SearchIcon className="h-4 w-4" />
                  검색
                </span>
              )}
            </Button>
          </div>
          {lastRunAt && (
            <p className="text-xs text-muted-foreground">
              마지막 실행: {lastRunAt.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {errors.length > 0 && (
          <Alert variant="destructive" className="border-red-300/60 bg-red-50/90 text-red-900">
            <AlertTitle>검색 중 문제가 발생했습니다</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((error) => (
                  <li key={error} className="text-sm leading-snug">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert className="border-border/60 bg-muted/40 text-foreground/80">
            <AlertTitle>검색 결과 안내</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {warnings.map((warning) => (
                  <li key={warning} className="text-sm leading-snug">
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex-1 rounded-xl border border-border/60 bg-white/40 p-6 shadow-inner">
        {isSearching && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm font-medium">Threads 검색을 실행 중입니다…</p>
          </div>
        )}

        {renderResultEmptyState && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>검색 결과가 없습니다.</p>
            <p className="mt-1 text-xs">
              키워드를 조금 더 구체적으로 입력하거나 다른 주제를 시도해보세요.
            </p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
            {results.map((item) => {
              const formattedTimestamp = formatTimestamp(item.timestamp, locale);

              return (
                <Card
                  key={item.id}
                  className="border border-border/50 bg-white/95 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {item.username ? `@${item.username}` : 'Unknown author'}
                        </span>
                        {formattedTimestamp && (
                          <span className="text-xs text-muted-foreground/80">
                            {formattedTimestamp}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formatScore(item.final_score) && (
                          <Badge variant="secondary" className="bg-slate-100 text-xs font-semibold text-slate-600">
                            Final {formatScore(item.final_score)}
                          </Badge>
                        )}
                        {formatScore(item.relevance_score) && (
                          <Badge variant="outline" className="text-xs font-semibold text-foreground/70">
                            Relevance {formatScore(item.relevance_score)}
                          </Badge>
                        )}
                        {formatScore(item.quality_score) && (
                          <Badge variant="outline" className="text-xs font-semibold text-foreground/70">
                            Quality {formatScore(item.quality_score)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {item.title && (
                      <h2 className="text-base font-semibold text-foreground/90">
                        {item.title}
                      </h2>
                    )}

                    {item.content && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                        {item.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                      <div className="flex flex-wrap items-center gap-3">
                        {formatNumber(item.like_count) && (
                          <span>♥ {formatNumber(item.like_count)}</span>
                        )}
                        {formatNumber(item.reply_count) && (
                          <span>💬 {formatNumber(item.reply_count)}</span>
                        )}
                      </div>
                      {item.url && (
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary transition hover:text-primary/80"
                        >
                          Threads에서 보기
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
