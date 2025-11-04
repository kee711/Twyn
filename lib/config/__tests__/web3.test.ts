/**
 * Tests for web3 configuration utilities
 */

import { isWeb3Mode, getSupportedPlatforms, isPlatformSupported, featureFlags, getWeb3Config } from '../web3';

// Mock environment variable
const originalEnv = process.env.NEXT_PUBLIC_WEB3_MODE;

describe('Web3 Configuration', () => {
    afterEach(() => {
        // Restore original environment
        process.env.NEXT_PUBLIC_WEB3_MODE = originalEnv;
    });

    describe('isWeb3Mode', () => {
        it('should return true when NEXT_PUBLIC_WEB3_MODE is "true"', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'true';
            expect(isWeb3Mode()).toBe(true);
        });

        it('should return false when NEXT_PUBLIC_WEB3_MODE is "false"', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'false';
            expect(isWeb3Mode()).toBe(false);
        });

        it('should return false when NEXT_PUBLIC_WEB3_MODE is undefined', () => {
            delete process.env.NEXT_PUBLIC_WEB3_MODE;
            expect(isWeb3Mode()).toBe(false);
        });
    });

    describe('getSupportedPlatforms', () => {
        it('should return only farcaster in web3 mode', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'true';
            expect(getSupportedPlatforms()).toEqual(['farcaster']);
        });

        it('should return all platforms in regular mode', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'false';
            expect(getSupportedPlatforms()).toEqual(['threads', 'x', 'farcaster']);
        });
    });

    describe('isPlatformSupported', () => {
        it('should support only farcaster in web3 mode', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'true';
            expect(isPlatformSupported('farcaster')).toBe(true);
            expect(isPlatformSupported('threads')).toBe(false);
            expect(isPlatformSupported('x')).toBe(false);
        });

        it('should support all platforms in regular mode', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'false';
            expect(isPlatformSupported('farcaster')).toBe(true);
            expect(isPlatformSupported('threads')).toBe(true);
            expect(isPlatformSupported('x')).toBe(true);
        });
    });

    describe('featureFlags', () => {
        it('should hide statistics and comments in web3 mode', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'true';
            expect(featureFlags.showStatistics()).toBe(false);
            expect(featureFlags.showComments()).toBe(false);
            expect(featureFlags.showOnlyFarcasterAuth()).toBe(true);
            expect(featureFlags.enableDirectTopicFinderRouting()).toBe(true);
        });

        it('should show all features in regular mode', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'false';
            expect(featureFlags.showStatistics()).toBe(true);
            expect(featureFlags.showComments()).toBe(true);
            expect(featureFlags.showOnlyFarcasterAuth()).toBe(false);
            expect(featureFlags.enableDirectTopicFinderRouting()).toBe(false);
        });
    });

    describe('getWeb3Config', () => {
        it('should return complete configuration object', () => {
            process.env.NEXT_PUBLIC_WEB3_MODE = 'true';
            const config = getWeb3Config();

            expect(config.isEnabled).toBe(true);
            expect(config.supportedPlatforms).toEqual(['farcaster']);
            expect(config.defaultRedirectPath).toBe('/contents/topic-finder');
            expect(config.features).toBeDefined();
        });
    });
});