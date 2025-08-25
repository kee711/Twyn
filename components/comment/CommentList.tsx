"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { ErrorUI } from "@/components/ui/error-ui";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ContentItem, Comment, PostComment } from "../contents-helper/types";
import {
    getAllCommentsWithRootPosts,
    postComment,
    markCommentAsReplied,
    hideComment,
} from "@/app/actions/comment";
import { fetchAndSaveComments } from "@/app/actions/fetchComment";
import { EyeOff, Sparkles, ArrowUp, BadgeCheck, Loader } from "lucide-react";
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { ThreadsProfilePicture } from "../ThreadsProfilePicture";
import { useMobileKeyboardScroll } from "@/hooks/useMobileKeyboardScroll";

export function CommentList() {
    const t = useTranslations('comments');
    const { currentSocialId, currentUsername } = useSocialAccountStore();
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const textareaRefs = useRef<Record<string, HTMLTextAreaElement>>({});
    const commentsScrollRef = useRef<HTMLDivElement>(null);
    const ensureVisible = useMobileKeyboardScroll(commentsScrollRef as unknown as { current: HTMLElement | null });
    const [hideDialogOpen, setHideDialogOpen] = useState(false);
    const [commentToHide, setCommentToHide] = useState<string | null>(null);
    const [locallyHidden, setLocallyHidden] = useState<Record<string, boolean>>({});

    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery<{
        comments: Comment[];
        postsWithComments: ContentItem[];
        hiddenComments: string[];
    }>({
        queryKey: ['comments', currentSocialId],
        queryFn: async () => {
            if (!currentSocialId) {
                throw new Error('currentSocialId is not available');
            }

            await fetchAndSaveComments();
            const result = await getAllCommentsWithRootPosts();

            return result;
        },
        enabled: !!currentSocialId && currentSocialId.trim() !== '', // currentSocialId가 있을 때만 실행
        staleTime: 1000 * 60 * 5,
        retry: (failureCount, error) => {
            // currentSocialId 관련 에러는 재시도하지 않음
            if (error.message.includes('currentSocialId is not available')) {
                return false;
            }
            return failureCount < 3;
        },
    });

    const comments = data?.comments ?? [];
    const postsWithComments = data?.postsWithComments ?? [];
    const hiddenComments = data?.hiddenComments ?? [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [aiGenerating, setAiGenerating] = useState<Record<string, boolean>>({});
    const [sending, setSending] = useState<Record<string, boolean>>({});

    // Calculate remaining posts to reply - only show posts with unreplied comments
    const postsWithUnrepliedComments = postsWithComments.filter(post => {
        const postComments = comments.filter(c =>
            c.root_post_content?.my_contents_id === post.my_contents_id &&
            !hiddenComments.includes(c.id)
        );
        return postComments.some(comment => !comment.is_replied);
    });

    const remainingPosts = postsWithUnrepliedComments.length;

    // Calculate replied comments for current post
    const currentPost = postsWithUnrepliedComments[currentIndex];
    const currentPostComments = comments.filter(c =>
        c.root_post_content?.my_contents_id === currentPost?.my_contents_id &&
        !hiddenComments.includes(c.id)
    );
    const repliedCount = currentPostComments.filter(c => c.is_replied).length;

    // Auto resize textarea
    const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }, []);

    // Handle textarea change with auto resize
    const handleTextareaChange = (commentId: string, value: string) => {
        setReplyTexts(prev => ({ ...prev, [commentId]: value }));
        const textarea = textareaRefs.current[commentId];
        if (textarea) {
            autoResize(textarea);
        }
    };

    // Get post element heights for dynamic scrolling
    const getPostElementHeights = useCallback(() => {
        if (!leftPanelRef.current) return [];
        const posts = leftPanelRef.current.querySelectorAll('[data-post-index]');
        return Array.from(posts).map(post => (post as HTMLElement).offsetHeight);
    }, []);

    // Sticky scroll behavior with dynamic heights
    const handleScroll = useCallback(() => {
        if (!leftPanelRef.current) return;

        const container = leftPanelRef.current;
        const scrollTop = container.scrollTop;
        const heights = getPostElementHeights();

        let accumulatedHeight = 0;
        let newIndex = 0;

        for (let i = 0; i < heights.length; i++) {
            const nextHeight = accumulatedHeight + heights[i] + 20; // 20px for margin
            if (scrollTop < nextHeight - (heights[i] / 2)) {
                newIndex = i;
                break;
            }
            accumulatedHeight = nextHeight;
            newIndex = i + 1;
        }

        const clampedIndex = Math.max(0, Math.min(newIndex, postsWithUnrepliedComments.length - 1));

        if (clampedIndex !== currentIndex) {
            setCurrentIndex(clampedIndex);
        }
    }, [currentIndex, postsWithUnrepliedComments.length, getPostElementHeights]);

    useEffect(() => {
        const container = leftPanelRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Reply mutation
    const replyMutation = useMutation({
        mutationFn: async ({ commentId, reply }: { commentId: string, reply: PostComment }) => {
            await postComment(reply);
            await markCommentAsReplied(commentId, reply);
            return { commentId, reply };
        },
        onMutate: async ({ commentId, reply }) => {
            // currentSocialId 재검증
            if (!currentSocialId || currentSocialId.trim() === '') {
                throw new Error(t('ai.loadingAccount'));
            }

            await queryClient.cancelQueries({ queryKey: ['comments', currentSocialId] });
            const previousComments = queryClient.getQueryData(['comments', currentSocialId]);

            // Safely update query data with null checks
            queryClient.setQueryData(['comments', currentSocialId], (old: { comments: Comment[]; } | undefined) => {
                if (!old || !old.comments) {
                    // Don't update if we don't have proper data - let the success handler do the work
                    return old;
                }

                return {
                    ...old,
                    comments: old.comments.map((comment: Comment) =>
                        comment.id === commentId
                            ? { ...comment, replies: [...comment.replies, reply], is_replied: true }
                            : comment
                    )
                };
            });

            return { previousComments };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['comments', currentSocialId], context?.previousComments);
            toast.error(t('actions.hideCommentFailed'));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', currentSocialId] });
            toast.success(t('ai.generated'));
        }
    });

    // Handle AI reply generation
    const generateAIReply = async (commentText: string, commentId: string) => {
        setAiGenerating(prev => ({ ...prev, [commentId]: true }));

        try {
            const response = await fetch('/api/generate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentText, postContent: currentPost?.content })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'AI generation failed');
            }

            const { reply } = await response.json();
            setReplyTexts(prev => ({ ...prev, [commentId]: reply }));

            // Auto resize after setting AI generated text
            setTimeout(() => {
                const textarea = textareaRefs.current[commentId];
                if (textarea) {
                    autoResize(textarea);
                }
            }, 1);

            toast.success(t('ai.generated'));
        } catch (error) {
            console.error('AI generation error:', error);
            toast.error(t('ai.generationFailed'));
        } finally {
            setAiGenerating(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // Handle sending reply
    const sendReply = async (commentId: string) => {
        // currentSocialId 검증
        if (!currentSocialId || currentSocialId.trim() === '') {
            toast.error(t('ai.loadingAccount'));
            return;
        }

        const replyText = replyTexts[commentId]?.trim();

        if (!replyText) {
            return;
        }

        setSending(prev => ({ ...prev, [commentId]: true }));

        try {
            const newReply: PostComment = {
                media_type: "TEXT_POST",
                text: replyText,
                reply_to_id: commentId,
            };

            await replyMutation.mutateAsync({ commentId, reply: newReply });

            // Don't clear the reply text - it will be hidden by conditional rendering
        } catch (error) {
            // Error handled by mutation
        } finally {
            setSending(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // Write all replies
    const writeAllReplies = async () => {
        const unrepliedComments = currentPostComments.filter(c => !c.is_replied);

        if (unrepliedComments.length === 0) {
            toast.info(t('ai.allReplied'));
            return;
        }

        toast.info(t('ai.draftingReplies'));

        for (const comment of unrepliedComments) {
            await generateAIReply(comment.text, comment.id);
        }

        toast.success(t('ai.draftingCompleted'));
    };

    // Handle post click with dynamic positioning
    const handlePostClick = (index: number) => {
        setCurrentIndex(index);
        if (leftPanelRef.current) {
            const heights = getPostElementHeights();
            let scrollTop = 0;
            for (let i = 0; i < index; i++) {
                scrollTop += heights[i] + 20; // 20px for margin
            }
            leftPanelRef.current.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    };

    // currentSocialId가 없으면 로딩 상태로 처리
    if (!currentSocialId || currentSocialId.trim() === '') {
        return (
            <div className="h-full w-full overflow-hidden p-6 flex flex-col">
                <h1 className="text-3xl font-bold text-zinc-700 mb-6">{t('title')}</h1>
                <div className="flex-1 flex flex-col gap-3 items-center justify-center bg-muted rounded-[20px] min-h-0">
                    <Loader className="w-10 h-10 text-muted-foreground/30 animate-spin speed-50" />
                    <div className="text-muted-foreground">{t('loadingAccount')}</div>
                </div>
            </div>
        );
    }

    if (!isLoading && postsWithUnrepliedComments.length === 0) {
        return (
            <div className="h-full w-full overflow-hidden p-6 flex flex-col">
                {/* Header */}
                <h1 className="text-3xl font-bold text-zinc-700 mb-6">{t('title')}</h1>

                {/* Empty State */}
                <div className="flex items-center justify-center flex-1">
                    <div className="bg-muted rounded-[20px] w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                            {/* Check Icon */}
                            <div className="rounded-full flex items-center justify-center">
                                <BadgeCheck
                                    className="w-8 h-8 text-muted-foreground/30"
                                />
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col items-center gap-3 w-full">
                                <h2 className="text-zinc-700 text-xl font-semibold text-center">
                                    {t('noCommentsToReply')}
                                </h2>
                                <p className="text-zinc-500 text-sm font-normal text-center">
                                    {t('postToGetComments')}
                                </p>
                            </div>

                            {/* Get Ideas Button */}
                            <Link
                                href="/contents/topic-finder"
                                className="bg-zinc-100 border border-muted-foreground/10 rounded-xl px-3 py-2 flex items-center justify-center gap-2.5 cursor-pointer hover:bg-zinc-200 transition-colors"
                            >
                                <span className="text-black text-sm font-medium">
                                    {t('getIdeas')}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden flex flex-col p-4" style={{ height: 'calc(100vh - 1rem)' }}>
            {/* Header */}

            <h1 className="text-2xl md:text-3xl mt-1 md:mt-0 mb-4 md:mb-6 font-bold text-zinc-700">{t('title')}</h1>

            {isLoading && (
                <div className="flex-1 flex flex-col gap-3 items-center justify-center bg-muted rounded-[20px] min-h-0">
                    <Loader className="w-10 h-10 text-muted-foreground/30 animate-spin speed-50" />
                    <div className="text-muted-foreground">{t('gettingComments')}</div>
                </div>
            )}

            {isError && (
                <div className="flex-1 min-h-0">
                    <ErrorUI />
                </div>
            )}

            {!isLoading && !isError && (
                <>
                    {/* Main Content */}
                    <div className="flex flex-col md:flex-row gap-6 min-h-0">
                        {/* Left Panel - Posts List */}
                        <div className="h-2/5 md:h-auto md:flex-1 bg-gray-50 rounded-2xl p-4 md:p-6 flex flex-col min-h-0 overflow-hidden">
                            <div className="md:h-9 flex items-center ml-1 md:ml-0 mb-3 md:mb-6 flex-shrink-0">
                                <p className="text-gray-500 text-[13px] md:text-[17px]">
                                    {t('remainingPostsToReply', { count: remainingPosts })}
                                </p>
                            </div>

                            <div
                                ref={leftPanelRef}
                                className="flex-1 overflow-y-auto space-y-3 md:space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-96 scroll-pb-96 min-h-0"
                                style={{ scrollSnapType: 'y mandatory' }}
                            >
                                {postsWithUnrepliedComments.map((post, index) => (
                                    <div
                                        key={post.my_contents_id}
                                        data-post-index={index}
                                        className={`
                                        rounded-2xl p-5 md:min-h-[200px] min-h-[100px] cursor-pointer transition-all duration-200 flex-shrink-0
                                        ${index === currentIndex
                                                ? 'bg-white shadow-sm'
                                                : 'opacity-40'
                                            }
                                    `}
                                        style={{ scrollSnapAlign: 'start' }}
                                        onClick={() => handlePostClick(index)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="mb-2">
                                                    <h3 className="font-semibold text-black text-[15px] md:text-[17px] break-words">
                                                        {currentUsername || t('me')}
                                                    </h3>
                                                </div>
                                                <p className="text-black text-[15px] md:text-[17px] leading-relaxed break-words">
                                                    {post.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Comments */}
                        <div className="flex-1 bg-transparent md:bg-gray-50 rounded-2xl p-0 md:p-6 flex flex-col min-h-0">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-3 md:mb-6 flex-shrink-0">
                                <p className="ml-1 text-gray-500 text-[13px] md:text-[17px]">
                                    {t('repliedStatus', { repliedCount, totalCount: currentPostComments.length })}
                                </p>
                                <Button
                                    onClick={writeAllReplies}
                                    variant="ghost"
                                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl px-2.5 py-1"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm md:text-base font-medium">{t('draftAllReplies')}</span>
                                </Button>
                            </div>

                            {/* Comments List */}
                            <div ref={commentsScrollRef} className="flex-1 overflow-y-auto space-y-2 md:space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-6 min-h-0">
                                {currentPostComments.map((comment) => {
                                    const isHidden = (locallyHidden[comment.id] === true) || hiddenComments.includes(comment.id);
                                    return (
                                        <div
                                            key={comment.id}
                                            className="bg-white md:rounded-2xl p-2 pb-4 md:p-5 flex-shrink-0 border-b border-gray-200 md:border-none"
                                        >
                                            {/* Comment Header */}
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-3 w-full">
                                                    <div className="w-full">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex flex-row items-center gap-2">
                                                                <span className="flex-1 font-semibold text-black text-[15px] md:text-[17px]">
                                                                    {comment.username}
                                                                </span>
                                                                <RelativeTime
                                                                    timestamp={comment.timestamp}
                                                                    className="text-gray-400 text-[15px] md:text-[17px]"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => {
                                                                        setCommentToHide(comment.id);
                                                                        setHideDialogOpen(true);
                                                                    }}
                                                                    className="rounded-full p-2 mt-[-4px] flex items-center gap-1.5 bg-transparent hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                                                </button>
                                                            </div>
                                                        </div>


                                                        {/* Comment Text */}
                                                        <p className="text-black text-[15px] md:text-[17px] leading-relaxed mb-3 md:mb-5">
                                                            {comment.text}
                                                        </p>

                                                        {/* Hidden Notice */}
                                                        {isHidden && (
                                                            <div className="bg-gray-100 rounded-[16px] p-3 mb-5">
                                                                <p className="text-gray-500 text-[15px] md:text-[17px]">{t('hiddenNotice')}</p>
                                                            </div>
                                                        )}

                                                        {/* My Reply (if exists) */}
                                                        {comment.is_replied && comment.replies.length > 0 && (
                                                            <div className="bg-gray-100 rounded-[16px] p-3 mb-5">
                                                                <p className="text-gray-500 text-xs font-bold mb-1.5">{t('me')}</p>
                                                                <p className="text-black text-[15px] md:text-[17px]">
                                                                    {comment.replies[0]?.text}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Reply Input - Only show if not replied and not hidden */}
                                                        {!comment.is_replied && !isHidden && (
                                                            <div className="flex items-start gap-2">
                                                                <div className="flex-1 relative">
                                                                    <Textarea
                                                                        ref={(el) => {
                                                                            if (el) textareaRefs.current[comment.id] = el;
                                                                        }}
                                                                        rows={1}
                                                                        value={replyTexts[comment.id] || ''}
                                                                        onChange={(e) => handleTextareaChange(comment.id, e.target.value)}
                                                                        onFocus={(e) => ensureVisible(e.currentTarget)}
                                                                        placeholder={t('replyPlaceholder')}
                                                                        className={`
                                                                        bg-gray-100 border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 resize-none py-2 px-4
                                                                        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] focus:outline-none focus:focus-visible:ring-0
                                                                        min-h-[34px]
                                                                    `}
                                                                    />
                                                                </div>

                                                                <Button
                                                                    onClick={() => generateAIReply(comment.text, comment.id)}
                                                                    disabled={aiGenerating[comment.id]}
                                                                    className={`bg-black hover:bg-gray-800 text-white rounded-full h-[34px] px-2.5 flex items-center gap-1 flex-shrink-0 ${aiGenerating[comment.id] ? 'animate-pulse' : ''}`}
                                                                >
                                                                    <Sparkles className="w-4 h-4" />
                                                                </Button>

                                                                <Button
                                                                    onClick={() => sendReply(comment.id)}
                                                                    disabled={!replyTexts[comment.id]?.trim() || sending[comment.id]}
                                                                    className={`bg-black hover:bg-gray-800 text-white rounded-full w-[34px] h-[34px] p-0 flex items-center justify-center flex-shrink-0 ${sending[comment.id] ? 'animate-pulse' : ''}`}
                                                                >
                                                                    {sending[comment.id] ? (
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <ArrowUp className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* Hide Comment Dialog */}
                    <Dialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('actions.hideCommentTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('actions.hideCommentConfirm')}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    onClick={() => setHideDialogOpen(false)}
                                >
                                    {t('actions.cancel')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (!commentToHide) return;
                                        const id = commentToHide;
                                        // 즉시 다이얼로그 닫고 로컬로 숨김 처리
                                        setHideDialogOpen(false);
                                        setCommentToHide(null);
                                        setLocallyHidden(prev => ({ ...prev, [id]: true }));

                                        hideComment(id)
                                            .then(() => {
                                                toast.success(t('actions.commentHidden'));
                                                queryClient.invalidateQueries({ queryKey: ['comments', currentSocialId] });
                                            })
                                            .catch(() => {
                                                // 실패 시 로컬 숨김 상태 롤백
                                                setLocallyHidden(prev => {
                                                    const { [id]: _removed, ...rest } = prev;
                                                    return rest;
                                                });
                                                toast.error(t('actions.hideCommentFailed'));
                                            });
                                    }}
                                >
                                    {t('actions.confirm')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}