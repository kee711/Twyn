/**
 * Web3 Configuration Utilities
 * 
 * This module provides utilities for checking web3 mode status and managing
 * feature flags throughout the application.
 */

export type PlatformKey = 'farcaster' | 'threads' | 'x';

/**
 * Check if the application is running in web3 mode
 * @returns boolean indicating if web3 mode is enabled
 */
export function isWeb3Mode(): boolean {
    return process.env.NEXT_PUBLIC_WEB3_MODE === 'true';
}

/**
 * Get the list of supported platforms based on the current mode
 * @returns Array of supported platform keys
 */
export function getSupportedPlatforms(): PlatformKey[] {
    if (isWeb3Mode()) {
        return ['farcaster'];
    }
    return ['threads', 'x', 'farcaster'];
}

/**
 * Check if a specific platform is supported in the current mode
 * @param platform - The platform to check
 * @returns boolean indicating if the platform is supported
 */
export function isPlatformSupported(platform: PlatformKey): boolean {
    return getSupportedPlatforms().includes(platform);
}

/**
 * Get platform display names for supported platforms
 * @returns Record of platform keys to display names
 */
export function getPlatformDisplayNames(): Partial<Record<PlatformKey, string>> {
    const allNames: Record<PlatformKey, string> = {
        farcaster: 'Farcaster',
        threads: 'Threads',
        x: 'X (Twitter)',
    };

    if (isWeb3Mode()) {
        return { farcaster: allNames.farcaster };
    }

    return allNames;
}

/**
 * Feature flags for conditional rendering
 */
export const featureFlags = {
    /**
     * Check if statistics menu should be shown
     */
    showStatistics: (): boolean => !isWeb3Mode(),

    /**
     * Check if comments menu should be shown
     */
    showComments: (): boolean => !isWeb3Mode(),

    /**
     * Check if landing page should be shown
     */
    showLandingPage: (): boolean => !isWeb3Mode(),

    /**
     * Check if email authentication should be shown
     */
    showEmailAuth: (): boolean => !isWeb3Mode(),

    /**
     * Check if Google authentication should be shown
     */
    showGoogleAuth: (): boolean => !isWeb3Mode(),

    /**
     * Check if only Farcaster authentication should be shown
     */
    showOnlyFarcasterAuth: (): boolean => isWeb3Mode(),

    /**
     * Check if direct topic-finder routing should be enabled
     */
    enableDirectTopicFinderRouting: (): boolean => isWeb3Mode(),

    /**
     * Check if automatic Farcaster account linking should be enabled
     */
    enableAutoFarcasterLinking: (): boolean => isWeb3Mode(),
} as const;

/**
 * Web3 mode configuration object
 */
export const web3Config = {
    /**
     * Default redirect path for authenticated users in web3 mode
     */
    defaultRedirectPath: '/contents/topic-finder',

    /**
     * Check if web3 mode is enabled
     */
    isEnabled: isWeb3Mode,

    /**
     * Get supported platforms
     */
    supportedPlatforms: getSupportedPlatforms,

    /**
     * Feature flags
     */
    features: featureFlags,
} as const;

/**
 * Navigation configuration for web3 mode
 */
export function getNavigationConfig() {
    const baseNavigation = [
        {
            name: 'contents',
            key: 'contents',
            isExpandable: true,
            subItems: [
                { name: 'topicFinder', key: 'topic-finder', href: '/contents/topic-finder' },
                { name: 'draft', key: 'draft', href: '/contents/draft' },
            ],
        },
        {
            name: 'schedule',
            key: 'schedule',
            href: '/schedule',
        },
        {
            name: 'settings',
            key: 'settings',
            href: '/settings',
        },
    ];

    // Add statistics and comments menus only in non-web3 mode
    if (!isWeb3Mode()) {
        baseNavigation.splice(1, 0,
            {
                name: 'statistics',
                key: 'statistics',
                href: '/statistics',
            },
            {
                name: 'comments',
                key: 'comments',
                href: '/comments',
            }
        );
    }

    return baseNavigation;
}

/**
 * Type definitions for web3 configuration
 */
export interface Web3Config {
    isEnabled: boolean;
    supportedPlatforms: PlatformKey[];
    defaultRedirectPath: string;
    features: typeof featureFlags;
}

/**
 * Get complete web3 configuration object
 */
export function getWeb3Config(): Web3Config {
    return {
        isEnabled: isWeb3Mode(),
        supportedPlatforms: getSupportedPlatforms(),
        defaultRedirectPath: web3Config.defaultRedirectPath,
        features: featureFlags,
    };
}