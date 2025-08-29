import { create } from 'zustand';
import { ThreadContent } from '@/components/contents-helper/types';

interface AiContentState {
  originalAiContent: ThreadContent[] | null;
  setOriginalAiContent: (content: ThreadContent[]) => void;
  clearOriginalAiContent: () => void;
}

const useAiContentStore = create<AiContentState>((set) => ({
  originalAiContent: null,
  setOriginalAiContent: (content) => set({ originalAiContent: content }),
  clearOriginalAiContent: () => set({ originalAiContent: null }),
}));

export default useAiContentStore;