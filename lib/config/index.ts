/**
 * Application Configuration
 * 
 * Central configuration module that exports all configuration utilities
 * and provides a unified interface for accessing application settings.
 */

export * from './web3';

/**
 * Environment configuration utilities
 */
export const env = {
    /**
     * Check if running in development mode
     */
    isDevelopment: process.env.NODE_ENV === 'development',

    /**
     * Check if running in production mode
     */
    isProduction: process.env.NODE_ENV === 'production',

    /**
     * Check if running in test mode
     */
    isTest: process.env.NODE_ENV === 'test',

    /**
     * Get the current environment
     */
    current: process.env.NODE_ENV || 'development',

    /**
     * Web3 mode flag
     */
    web3Mode: process.env.NEXT_PUBLIC_WEB3_MODE === 'true',
} as const;

/**
 * Application URLs and endpoints
 */
export const urls = {
    /**
     * Base URL for the application
     */
    base: process.env.NEXTAUTH_URL || 'http://localhost:3000',

    /**
     * Supabase configuration
     */
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },

    /**
     * LangGraph API URL
     */
    langgraph: process.env.LANGGRAPH_API_URL,

    /**
     * Redis configuration
     */
    redis: {
        url: process.env.REDIS_URL,
        publicUrl: process.env.REDIS_PUBLIC_URL,
    },
} as const;

/**
 * OAuth configuration
 */
export const oauth = {
    /**
     * Google OAuth
     */
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },

    /**
     * Threads OAuth
     */
    threads: {
        clientId: process.env.THREADS_CLIENT_ID,
        clientSecret: process.env.THREADS_CLIENT_SECRET,
    },

    /**
     * X (Twitter) OAuth
     */
    x: {
        apiKey: process.env.X_API_KEY,
        apiKeySecret: process.env.X_API_KEY_SECRET,
        clientId: process.env.X_CLIENT_ID,
        clientSecret: process.env.X_CLIENT_SECRET,
    },
} as const;

/**
 * Feature flags and configuration
 */
export const features = {
    /**
     * Wallet integration
     */
    wallet: {
        enabled: Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    },

    /**
     * Analytics
     */
    analytics: {
        mixpanel: {
            token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
            enabled: Boolean(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN),
        },
    },

    /**
     * Debug features
     */
    debug: {
        nextAuth: process.env.NEXTAUTH_DEBUG === 'true',
    },
} as const;

/**
 * Security configuration
 */
export const security = {
    /**
     * NextAuth configuration
     */
    nextAuth: {
        secret: process.env.NEXTAUTH_SECRET,
        url: process.env.NEXTAUTH_URL,
    },

    /**
     * Encryption key
     */
    encryptionKey: process.env.ENCRYPTION_KEY,

    /**
     * CRON secret
     */
    cronSecret: process.env.CRON_SECRET,
} as const;

/**
 * Complete application configuration
 */
export const config = {
    env,
    urls,
    oauth,
    features,
    security,
} as const;

/**
 * Type definitions
 */
export type Config = typeof config;
export type Environment = typeof env.current;
export type Features = typeof features;