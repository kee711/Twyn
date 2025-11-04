/**
 * React hook for accessing web3 configuration
 * 
 * This hook provides a convenient way for React components to access
 * web3 mode status and feature flags.
 */

import { useMemo } from 'react';
import { getWeb3Config, isWeb3Mode, featureFlags, getSupportedPlatforms, type PlatformKey } from '../lib/config/web3';

/**
 * Hook for accessing web3 configuration in React components
 */
export function useWeb3Config() {
    const config = useMemo(() => getWeb3Config(), []);

    return {
        /**
         * Whether web3 mode is enabled
         */
        isWeb3Mode: config.isEnabled,

        /**
         * Supported platforms in current mode
         */
        supportedPlatforms: config.supportedPlatforms,

        /**
         * Default redirect path for authenticated users
         */
        defaultRedirectPath: config.defaultRedirectPath,

        /**
         * Feature flags for conditional rendering
         */
        features: config.features,

        /**
         * Check if a specific platform is supported
         */
        isPlatformSupported: (platform: PlatformKey) =>
            config.supportedPlatforms.includes(platform),

        /**
         * Get the complete configuration object
         */
        config,
    };
}

/**
 * Hook for checking specific feature flags
 */
export function useFeatureFlags() {
    return useMemo(() => ({
        showStatistics: featureFlags.showStatistics(),
        showComments: featureFlags.showComments(),
        showLandingPage: featureFlags.showLandingPage(),
        showEmailAuth: featureFlags.showEmailAuth(),
        showGoogleAuth: featureFlags.showGoogleAuth(),
        showOnlyFarcasterAuth: featureFlags.showOnlyFarcasterAuth(),
        enableDirectTopicFinderRouting: featureFlags.enableDirectTopicFinderRouting(),
        enableAutoFarcasterLinking: featureFlags.enableAutoFarcasterLinking(),
    }), []);
}

/**
 * Hook for getting supported platforms
 */
export function useSupportedPlatforms() {
    return useMemo(() => getSupportedPlatforms(), []);
}

/**
 * Hook for checking if web3 mode is enabled
 */
export function useIsWeb3Mode() {
    return useMemo(() => isWeb3Mode(), []);
}