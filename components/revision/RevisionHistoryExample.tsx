'use client';

import { useEffect, useState } from 'react';
import { useRevisionHistory } from '@/hooks/useRevisionHistory';
import type { RevisionHistory } from '@/types/revision-history';

/**
 * 퇴고 이력 사용 예시 컴포넌트
 * 실제 프로젝트에서는 디자인 시스템에 맞게 수정하여 사용
 */
export function RevisionHistoryExample() {
    const { fetchHistory, fetchStatistics, loading, error } = useRevisionHistory();
    const [history, setHistory] = useState<RevisionHistory[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // 최근 퇴고 이력 조회
        const historyResult = await fetchHistory(1, 10);
        if (historyResult.data) {
            setHistory(historyResult.data);
        }

        // 통계 조회
        const statsResult = await fetchStatistics();
        if (statsResult) {
            setStats(statsResult);
        }
    };

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error.message}</div>;

    return (
        <div className="space-y-6">
            {/* 통계 섹션 */}
            {stats && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">퇴고 통계</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">총 퇴고 횟수</p>
                            <p className="text-2xl font-bold">{stats.total_revisions}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">발행된 콘텐츠</p>
                            <p className="text-2xl font-bold">{stats.published_count}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">평균 단어 수 차이</p>
                            <p className="text-2xl font-bold">{stats.avg_word_count_diff?.toFixed(1)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">평균 편집 거리</p>
                            <p className="text-2xl font-bold">{stats.avg_edit_distance?.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 이력 목록 */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">최근 퇴고 이력</h2>
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="border-b pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                    {item.revision_type === 'published' ? '발행됨' :
                                        item.revision_type === 'scheduled' ? '예약됨' : '임시저장'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-gray-700 mb-1">AI 생성 원본</p>
                                    <p className="text-gray-600 line-clamp-3">
                                        {item.ai_generated_content}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-700 mb-1">최종 수정본</p>
                                    <p className="text-gray-600 line-clamp-3">
                                        {item.user_final_content}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                <span>편집 거리: {item.edit_distance}</span>
                                <span>단어 수 차이: {item.word_count_diff}</span>
                                {item.tags && item.tags.length > 0 && (
                                    <span>태그: {item.tags.join(', ')}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * 콘텐츠 발행 시 퇴고 이력 저장 예시
 */
export function PublishWithRevisionTracking() {
    const { saveOnPublish } = useRevisionHistory();
    const [aiContent] = useState('AI가 생성한 원본 텍스트...');
    const [editedContent, setEditedContent] = useState('AI가 생성한 원본 텍스트...');

    const handlePublish = async () => {
        // 1. 실제 발행 로직 실행
        // await publishContent(editedContent);

        // 2. 퇴고 이력 저장
        const success = await saveOnPublish({
            aiContent,
            finalContent: editedContent,
            isScheduled: false,
            generationParams: {
                model: 'gpt-4',
                temperature: 0.7
            },
            metadata: {
                platform: 'threads',
                category: 'tech'
            }
        });

        if (success) {
            console.log('퇴고 이력 저장 완료');
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">AI 생성 원본</label>
                <div className="p-4 bg-gray-50 rounded">{aiContent}</div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">수정하기</label>
                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full p-4 border rounded"
                    rows={6}
                />
            </div>

            <button
                onClick={handlePublish}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                발행하기
            </button>
        </div>
    );
}
