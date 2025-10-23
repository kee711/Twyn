'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { OwnershipPromptModal } from '@/components/modals/OwnershipPromptModal';
import { useWalletPreferenceStore } from '@/stores/useWalletPreferenceStore';
import { OwnershipMetadata, useOwnershipTransaction } from '@/hooks/useOwnershipTransaction';

type PendingAction = {
  metadata: OwnershipMetadata;
  action: () => Promise<void>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

export function useOwnershipFlow() {
  const hidePrompt = useWalletPreferenceStore((state) => state.hideOwnershipPrompt);
  const setHidePrompt = useWalletPreferenceStore((state) => state.setHideOwnershipPrompt);
  const { isConnected, recordTransaction } = useOwnershipTransaction();
  const { connectModalOpen } = useConnectModal();

  const pendingRef = useRef<PendingAction | null>(null);
  const closingRef = useRef(false);
  const prevConnectModalOpenRef = useRef<boolean | undefined>(connectModalOpen);
  const prevIsConnectedRef = useRef(isConnected);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [localHidePrompt, setLocalHidePrompt] = useState(hidePrompt);
  const [walletFlowActive, setWalletFlowActive] = useState(false);

  useEffect(() => {
    if (!modalOpen) {
      setLocalHidePrompt(hidePrompt);
    }
  }, [hidePrompt, modalOpen]);

  const applyPreference = useCallback(() => {
    if (localHidePrompt !== hidePrompt) {
      setHidePrompt(localHidePrompt);
    }
  }, [hidePrompt, localHidePrompt, setHidePrompt]);

  const finalizeFlow = useCallback(() => {
    closingRef.current = true;
    setModalOpen(false);
    setModalVisible(false);
    setWalletFlowActive(false);
  }, []);

  const completeWithoutTransaction = useCallback(async () => {
    const pending = pendingRef.current;
    pendingRef.current = null;

    try {
      applyPreference();
      await pending?.action();
      pending?.resolve();
    } catch (error) {
      pending?.reject(error);
    } finally {
      finalizeFlow();
    }
  }, [applyPreference, finalizeFlow]);

  const completeWithTransaction = useCallback(async () => {
    const pending = pendingRef.current;
    pendingRef.current = null;

    try {
      applyPreference();
      if (pending) {
        await recordTransaction(pending.metadata);
        await pending.action();
        pending.resolve();
      }
    } catch (error) {
      pending?.reject(error);
    } finally {
      finalizeFlow();
    }
  }, [applyPreference, finalizeFlow, recordTransaction]);

  const handleConnect = useCallback(() => {
    if (!pendingRef.current) return;
    setWalletFlowActive(true);
    closingRef.current = true;
    setModalOpen(false);
    setModalVisible(false);
  }, []);

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setModalVisible(true);
        setModalOpen(true);
        return;
      }

      if (closingRef.current) {
        closingRef.current = false;
        return;
      }

      completeWithoutTransaction();
    },
    [completeWithoutTransaction],
  );

  const runOwnershipFlow = useCallback(
    async (metadata: OwnershipMetadata, action: () => Promise<void>) => {
      if (pendingRef.current) {
        throw new Error('Ownership flow already in progress.');
      }

      if (hidePrompt) {
        if (isConnected) {
          await recordTransaction(metadata);
        }
        await action();
        return;
      }

      return new Promise<void>((resolve, reject) => {
        pendingRef.current = { metadata, action, resolve, reject };
        setLocalHidePrompt(hidePrompt);
        setWalletFlowActive(false);
        setModalVisible(true);
        setModalOpen(true);
      });
    },
    [hidePrompt, isConnected, recordTransaction],
  );

  useEffect(() => {
    const wasConnected = prevIsConnectedRef.current;

    if (walletFlowActive && !wasConnected && isConnected && pendingRef.current) {
      setWalletFlowActive(false);
      setModalVisible(true);
      setModalOpen(true);
    }

    prevIsConnectedRef.current = isConnected;
  }, [walletFlowActive, isConnected]);

  useEffect(() => {
    const wasOpen = prevConnectModalOpenRef.current;

    if (walletFlowActive && wasOpen && !connectModalOpen && !isConnected && pendingRef.current) {
      setWalletFlowActive(false);
      setModalVisible(true);
      setModalOpen(true);
    }

    prevConnectModalOpenRef.current = connectModalOpen;
  }, [connectModalOpen, isConnected, walletFlowActive]);

  const OwnershipModal = useMemo(() => {
    if (!modalVisible) return () => null;

    return function OwnershipModalRenderer() {
      return (
        <OwnershipPromptModal
          open={modalOpen}
          onOpenChange={handleModalOpenChange}
          dontShowAgain={localHidePrompt}
          onDontShowAgainChange={setLocalHidePrompt}
          onContinueWithout={completeWithoutTransaction}
          onConnectWallet={handleConnect}
          canPublishWithReceipt={isConnected}
          onPublishWithReceipt={completeWithTransaction}
        />
      );
    };
  }, [
    completeWithoutTransaction,
    completeWithTransaction,
    handleConnect,
    handleModalOpenChange,
    isConnected,
    localHidePrompt,
    modalOpen,
    modalVisible,
  ]);

  return {
    runOwnershipFlow,
    OwnershipModal,
  };
}
