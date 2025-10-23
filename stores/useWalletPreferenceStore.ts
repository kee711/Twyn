"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletPreferenceState {
  hideOwnershipPrompt: boolean;
  setHideOwnershipPrompt: (value: boolean) => void;
}

export const useWalletPreferenceStore = create<WalletPreferenceState>()(
  persist(
    (set) => ({
      hideOwnershipPrompt: false,
      setHideOwnershipPrompt: (value) => set({ hideOwnershipPrompt: value }),
    }),
    {
      name: 'wallet-preferences',
    },
  ),
);
