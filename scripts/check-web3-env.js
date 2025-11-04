#!/usr/bin/env node

/**
 * Web3 Environment Variables Checker
 * 
 * This script checks if all required environment variables for web3 mode are properly set.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🔍 Checking Web3 Environment Variables...\n');

const requiredEnvVars = [
    'NEXT_PUBLIC_WEB3_MODE',
    'NEXT_PUBLIC_DOMAIN',
    'NEXT_PUBLIC_FARCASTER_SIWE_URI',
    'NEXT_PUBLIC_FARCASTER_OPTIMISM_RPC_URL',
    'NEXT_PUBLIC_FARCASTER_RELAY_URL',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
];

const results = [];
let hasErrors = false;

for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const isSet = value && value.length > 0;

    results.push({
        name: envVar,
        isSet,
        value: isSet ? (envVar.includes('SECRET') ? '[HIDDEN]' : value) : 'NOT SET'
    });

    if (!isSet) {
        hasErrors = true;
    }
}

// Display results
console.log('📋 Environment Variables Status:\n');
for (const result of results) {
    const icon = result.isSet ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.value}`);
}

// Check web3 mode specifically
const web3Mode = process.env.NEXT_PUBLIC_WEB3_MODE;
console.log(`\n🔧 Web3 Mode Status: ${web3Mode === 'true' ? '✅ ENABLED' : '❌ DISABLED'}`);

if (web3Mode !== 'true') {
    console.log('⚠️  Web3 mode is not enabled. Set NEXT_PUBLIC_WEB3_MODE=true to enable Farcaster login.');
    hasErrors = true;
}

// Check domain consistency
const domain = process.env.NEXT_PUBLIC_DOMAIN;
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (domain && nextAuthUrl) {
    const expectedAuthUrl = `https://${domain}`;
    if (nextAuthUrl !== expectedAuthUrl) {
        console.log(`⚠️  Domain mismatch: NEXTAUTH_URL (${nextAuthUrl}) should match NEXT_PUBLIC_DOMAIN (${expectedAuthUrl})`);
        hasErrors = true;
    }
}

console.log(`\n📊 Summary: ${results.filter(r => r.isSet).length}/${results.length} variables set`);

if (hasErrors) {
    console.log('\n❌ Environment check failed. Please fix the issues above.');
    process.exit(1);
} else {
    console.log('\n✅ All environment variables are properly configured for web3 mode!');
}