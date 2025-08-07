import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PostType = 'single' | 'thread';
type Language = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr' | 'de';

interface ContentGenerationStore {
  postType: PostType;
  language: Language;
  setPostType: (type: PostType) => void;
  setLanguage: (lang: Language) => void;
}

export const useContentGenerationStore = create<ContentGenerationStore>()(
  persist(
    (set) => ({
      postType: 'thread',
      language: 'en',
      setPostType: (type) => set({ postType: type }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'content-generation-settings',
    }
  )
);