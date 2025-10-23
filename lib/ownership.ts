import type { ThreadContent } from '@/app/actions/threadChain';
import type { OwnershipActionKind, OwnershipMetadata } from '@/hooks/useOwnershipTransaction';

const buildPreview = (threads: ThreadContent[]): string => {
  return threads
    .map((thread, index) => {
      const text = (thread.content || '').trim();
      if (!text) return '';
      return `${index + 1}. ${text}`;
    })
    .filter(Boolean)
    .join(' | ')
    .slice(0, 220);
};

export const buildOwnershipMetadataFromThreads = (
  threads: ThreadContent[],
  action: OwnershipActionKind,
  scheduledAt?: string,
): OwnershipMetadata => {
  const preview = buildPreview(threads);

  return {
    action,
    threadCount: threads.length,
    scheduledAt,
    preview,
    afterPreview: preview,
  };
};

export const buildOwnershipEditMetadata = (
  beforeThreads: ThreadContent[],
  afterThreads: ThreadContent[],
  scheduledAt?: string,
): OwnershipMetadata => {
  const beforePreview = buildPreview(beforeThreads);
  const afterPreview = buildPreview(afterThreads);

  return {
    action: 'edit',
    threadCount: afterThreads.length,
    scheduledAt,
    preview: afterPreview,
    beforePreview,
    afterPreview,
  };
};

