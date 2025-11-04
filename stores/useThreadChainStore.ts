import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThreadContent {
  content: string
  media_urls?: string[]
  media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'
}

export type PlatformKey = 'threads' | 'x' | 'farcaster'

export const PLATFORM_KEYS: PlatformKey[] = ['threads', 'x', 'farcaster']

const createEmptyThread = (): ThreadContent => ({
  content: '',
  media_urls: [],
  media_type: 'TEXT'
})

const cloneThreads = (threads: ThreadContent[]): ThreadContent[] =>
  threads.map((thread) => ({
    ...thread,
    media_urls: thread.media_urls ? [...thread.media_urls] : []
  }))

const buildPlatformContentsFromThreads = (threads: ThreadContent[]): Record<PlatformKey, ThreadContent[]> =>
  PLATFORM_KEYS.reduce((acc, platform) => {
    acc[platform] = cloneThreads(threads)
    return acc
  }, {} as Record<PlatformKey, ThreadContent[]>)

const createInitialPlatformContents = (): Record<PlatformKey, ThreadContent[]> => ({
  threads: [createEmptyThread()],
  x: [createEmptyThread()],
  farcaster: [createEmptyThread()]
})

const createInitialPlatformStatus = (): Record<PlatformKey, boolean> => ({
  threads: true,
  x: false,
  farcaster: false
})

const deriveMediaType = (media_urls: string[] = []): ThreadContent['media_type'] => {
  if (!media_urls || media_urls.length === 0) return 'TEXT'
  return media_urls.length > 1 ? 'CAROUSEL' : 'IMAGE'
}

interface ThreadChainState {
  // Main thread chain
  threadChain: ThreadContent[]

  // Platform specific state
  platformMode: 'linked' | 'unlinked'
  activePlatforms: Record<PlatformKey, boolean>
  platformContents: Record<PlatformKey, ThreadContent[]>

  // Generation UI state
  generationStatus: string | null
  generationPreview: string

  // Core actions
  setThreadChain: (threads: ThreadContent[]) => void
  updateThreadContent: (index: number, content: string) => void
  updateThreadMedia: (index: number, media_urls: string[]) => void
  addThread: () => void
  removeThread: (index: number) => void
  clearThreadChain: () => void
  setGenerationStatus: (status: string | null) => void
  setGenerationPreview: (content: string) => void
  clearGenerationPreview: () => void

  // Platform specific actions
  setPlatformMode: (mode: 'linked' | 'unlinked') => void
  togglePlatformActive: (platform: PlatformKey) => void
  setPlatformActive: (platform: PlatformKey, isActive: boolean) => void
  setPlatformThreads: (platform: PlatformKey, threads: ThreadContent[]) => void
  getPlatformThreads: (platform: PlatformKey) => ThreadContent[]
  syncLinkedPlatformContents: (threads?: ThreadContent[]) => void
  ensurePlatformThreadCount: (platform: PlatformKey, count: number) => void
  updatePlatformThreadContent: (platform: PlatformKey, index: number, content: string) => void
  updatePlatformThreadMedia: (platform: PlatformKey, index: number, media_urls: string[]) => void
  addPlatformThread: (platform: PlatformKey) => void
  removePlatformThread: (platform: PlatformKey, index: number) => void

  // Safe helpers (functional updates to avoid race conditions during streaming)
  ensureThreadCount: (count: number) => void
  setThreadContentAt: (index: number, content: string) => void

  // Add content from external sources
  addContentAsThread: (content: string) => void
  removeContentFromThread: (content: string) => void

  // Pending thread chain (from topic finder)
  pendingThreadChain: ThreadContent[] | null
  setPendingThreadChain: (threads: ThreadContent[] | null) => void
  applyPendingThreadChain: () => void
  clearPendingThreadChain: () => void
}

const useThreadChainStore = create<ThreadChainState>()(
  persist(
    (set, get) => ({
      // Initial state
      threadChain: [createEmptyThread()],
      platformMode: 'linked',
      activePlatforms: createInitialPlatformStatus(),
      platformContents: createInitialPlatformContents(),
      pendingThreadChain: null,
      generationStatus: null,
      generationPreview: '',

      // Core actions
      setThreadChain: (threads) => set((state) => ({
        threadChain: threads,
        platformContents:
          state.platformMode === 'linked'
            ? buildPlatformContentsFromThreads(threads)
            : state.platformContents
      })),

      updateThreadContent: (index, content) => set((state) => {
        const nextThreadChain = state.threadChain.map((thread, i) =>
          i === index ? { ...thread, content } : thread
        )

        return {
          threadChain: nextThreadChain,
          platformContents:
            state.platformMode === 'linked'
              ? buildPlatformContentsFromThreads(nextThreadChain)
              : state.platformContents
        }
      }),

      updateThreadMedia: (index, media_urls) => set((state) => {
        const nextThreadChain = state.threadChain.map((thread, i) =>
          i === index ? {
            ...thread,
            media_urls,
            media_type: deriveMediaType(media_urls)
          } : thread
        )

        return {
          threadChain: nextThreadChain,
          platformContents:
            state.platformMode === 'linked'
              ? buildPlatformContentsFromThreads(nextThreadChain)
              : state.platformContents
        }
      }),

      addThread: () => set((state) => {
        const nextThreadChain = [...state.threadChain, createEmptyThread()]
        return {
          threadChain: nextThreadChain,
          platformContents:
            state.platformMode === 'linked'
              ? buildPlatformContentsFromThreads(nextThreadChain)
              : state.platformContents
        }
      }),

      removeThread: (index) => set((state) => {
        // Don't allow removing the last thread
        if (state.threadChain.length <= 1) return state

        const nextThreadChain = state.threadChain.filter((_, i) => i !== index)

        return {
          threadChain: nextThreadChain,
          platformContents:
            state.platformMode === 'linked'
              ? buildPlatformContentsFromThreads(nextThreadChain)
              : state.platformContents
        }
      }),

      clearThreadChain: () => set({
        threadChain: [createEmptyThread()],
        platformContents: createInitialPlatformContents()
      }),

      setGenerationStatus: (status) => set({ generationStatus: status }),
      setGenerationPreview: (content) => set({ generationPreview: content }),
      clearGenerationPreview: () => set({ generationPreview: '' }),

      setPlatformMode: (mode) => set((state) => {
        if (state.platformMode === mode) return state

        if (mode === 'linked') {
          return {
            platformMode: mode,
            platformContents: buildPlatformContentsFromThreads(state.threadChain)
          }
        }

        const updatedContents: Record<PlatformKey, ThreadContent[]> = {
          ...state.platformContents
        }

        PLATFORM_KEYS.forEach((platform) => {
          if (!updatedContents[platform] || updatedContents[platform].length === 0) {
            updatedContents[platform] = cloneThreads(state.threadChain)
          }
        })

        return {
          platformMode: mode,
          platformContents: updatedContents
        }
      }),

      togglePlatformActive: (platform) => set((state) => {
        const currentlyActive = state.activePlatforms[platform]
        return {
          activePlatforms: {
            ...state.activePlatforms,
            [platform]: !currentlyActive
          }
        }
      }),

      setPlatformActive: (platform, isActive) => set((state) => {
        return {
          activePlatforms: {
            ...state.activePlatforms,
            [platform]: isActive
          }
        }
      }),

      setPlatformThreads: (platform, threads) => set((state) => ({
        platformContents: {
          ...state.platformContents,
          [platform]: cloneThreads(threads)
        }
      })),

      getPlatformThreads: (platform) => {
        const { platformContents } = get()
        const threads = platformContents[platform]
        if (!threads || threads.length === 0) {
          return [createEmptyThread()]
        }
        return threads
      },

      syncLinkedPlatformContents: (threads) => set((state) => {
        return {
          platformContents: buildPlatformContentsFromThreads(threads ?? state.threadChain)
        }
      }),

      ensurePlatformThreadCount: (platform, count) => set((state) => {
        const existing = state.platformContents[platform] || []
        if (existing.length >= count) return state
        const next = [...existing]
        while (next.length < count) {
          next.push(createEmptyThread())
        }
        return {
          platformContents: {
            ...state.platformContents,
            [platform]: next
          }
        }
      }),

      updatePlatformThreadContent: (platform, index, content) => set((state) => {
        const threads = state.platformContents[platform] || []
        const updated = threads.map((thread, i) =>
          i === index ? { ...thread, content } : thread
        )

        return {
          platformContents: {
            ...state.platformContents,
            [platform]: updated
          }
        }
      }),

      updatePlatformThreadMedia: (platform, index, media_urls) => set((state) => {
        const threads = state.platformContents[platform] || []
        const updated = threads.map((thread, i) =>
          i === index
            ? {
                ...thread,
                media_urls,
                media_type: deriveMediaType(media_urls)
              }
            : thread
        )

        return {
          platformContents: {
            ...state.platformContents,
            [platform]: updated
          }
        }
      }),

      addPlatformThread: (platform) => set((state) => {
        const threads = state.platformContents[platform] || []
        const next = [...threads, createEmptyThread()]
        return {
          platformContents: {
            ...state.platformContents,
            [platform]: next
          }
        }
      }),

      removePlatformThread: (platform, index) => set((state) => {
        const threads = state.platformContents[platform] || []
        if (threads.length <= 1) return state
        const next = threads.filter((_, i) => i !== index)
        return {
          platformContents: {
            ...state.platformContents,
            [platform]: next
          }
        }
      }),

      ensureThreadCount: (count) => set((state) => {
        const next = [...state.threadChain]
        while (next.length < count) {
          next.push(createEmptyThread())
        }
        return {
          threadChain: next,
          platformContents:
            state.platformMode === 'linked'
              ? buildPlatformContentsFromThreads(next)
              : state.platformContents
        }
      }),

      setThreadContentAt: (index, content) => set((state) => {
        const next = state.threadChain.map((t, i) => (i === index ? { ...t, content } : t))
        return {
          threadChain: next,
          platformContents:
            state.platformMode === 'linked'
              ? buildPlatformContentsFromThreads(next)
              : state.platformContents
        }
      }),

      // Add content from external sources (like ContentList)
      addContentAsThread: (content) => set((state) => {
        // If first thread is empty, replace it
        if (state.threadChain.length === 1 && state.threadChain[0].content === '') {
          return {
            threadChain: [{ content, media_urls: [], media_type: 'TEXT' }]
          };
        }

        // Otherwise add as new thread
        return {
          threadChain: [...state.threadChain, { content, media_urls: [], media_type: 'TEXT' }]
        };
      }),

      // Remove specific content from thread chain
      removeContentFromThread: (content) => set((state) => {
        const updatedThreadChain = state.threadChain.filter(thread =>
          thread.content.trim() !== content.trim()
        );

        // If we removed all content, ensure at least one empty thread remains
        if (updatedThreadChain.length === 0) {
          return {
            threadChain: [{ content: '', media_urls: [], media_type: 'TEXT' }]
          };
        }

        return { threadChain: updatedThreadChain };
      }),

      // Pending thread chain functionality
      setPendingThreadChain: (threads) => set({ pendingThreadChain: threads }),

      applyPendingThreadChain: () => set((state) => {
        if (state.pendingThreadChain) {
          return {
            threadChain: state.pendingThreadChain,
            pendingThreadChain: null
          };
        }
        return state;
      }),

      clearPendingThreadChain: () => set({ pendingThreadChain: null })
    }),
    {
      name: 'thread-chain-storage',
      // Only persist the main threadChain, not pendingThreadChain
      partialize: (state) => ({
        threadChain: state.threadChain,
        platformMode: state.platformMode,
        platformContents: state.platformContents,
        activePlatforms: state.activePlatforms
      })
    }
  )
)

export default useThreadChainStore
