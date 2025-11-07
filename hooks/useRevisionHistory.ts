'use client';

import { useState, useCallback } from 'react';
import {
    createRevisionHistory,
    getRevisionHistory,
    getRevisionById,
    updateRevisionHistory,
    deleteRevisionHistory,
    getRevisionStatistics,
    saveRevisionOnPublish
} from '@/lib/supabase/revision-history';
import type {
    RevisionHistory,
    CreateRevisionHistoryInput,
    RevisionStatistics,
    RevisionType
} from '@/types/revision-history';

export function useRevisionHistory() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(async (input: CreateRevisionHistoryInput) => {
        setLoading(true);
        setError(null);
        try {
            const result = await createRevisionHistory(input);
            if (result.error) {
                setError(result.error);
                return null;
            }
            return result.data;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async (
        page: number = 1,
        pageSize: number = 20,
        filters?: {
            revision_type?: RevisionType;
            content_id?: string;
            tags?: string[];
        }
    ) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getRevisionHistory(page, pageSize, filters);
            if (result.error) {
                setError(result.error);
                return { data: null, count: 0 };
            }
            return { data: result.data, count: result.count };
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchById = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getRevisionById(id);
            if (result.error) {
                setError(result.error);
                return null;
            }
            return result.data;
        } finally {
            setLoading(false);
        }
    }, []);

    const update = useCallback(async (
        id: string,
        updates: Partial<CreateRevisionHistoryInput>
    ) => {
        setLoading(true);
        setError(null);
        try {
            const result = await updateRevisionHistory(id, updates);
            if (result.error) {
                setError(result.error);
                return null;
            }
            return result.data;
        } finally {
            setLoading(false);
        }
    }, []);

    const remove = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await deleteRevisionHistory(id);
            if (result.error) {
                setError(result.error);
                return false;
            }
            return true;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getRevisionStatistics();
            if (result.error) {
                setError(result.error);
                return null;
            }
            return result.data;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveOnPublish = useCallback(async (params: {
        contentId?: string;
        aiContent: string;
        finalContent: string;
        isScheduled: boolean;
        generationParams?: any;
        metadata?: any;
    }) => {
        setLoading(true);
        setError(null);
        try {
            const result = await saveRevisionOnPublish(params);
            if (result.error) {
                setError(result.error);
                return false;
            }
            return true;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        create,
        fetchHistory,
        fetchById,
        update,
        remove,
        fetchStatistics,
        saveOnPublish
    };
}
