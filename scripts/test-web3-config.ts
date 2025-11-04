/**
 * Simple test script to validate web3 configuration
 */

import { isWeb3Mode, getSupportedPlatforms, featureFlags, getWeb3Config } from '../lib/config/web3';

// Test with web3 mode disabled
process.env.NEXT_PUBLIC_WEB3_MODE = 'false';
console.log('=== Testing Regular Mode ===');
console.log('Web3 Mode:', isWeb3Mode());
console.log('Supported Platforms:', getSupportedPlatforms());
console.log('Show Statistics:', featureFlags.showStatistics());
console.log('Show Comments:', featureFlags.showComments());
console.log('Show Only Farcaster Auth:', featureFlags.showOnlyFarcasterAuth());

// Test with web3 mode enabled
process.env.NEXT_PUBLIC_WEB3_MODE = 'true';
console.log('\n=== Testing Web3 Mode ===');
console.log('Web3 Mode:', isWeb3Mode());
console.log('Supported Platforms:', getSupportedPlatforms());
console.log('Show Statistics:', featureFlags.showStatistics());
console.log('Show Comments:', featureFlags.showComments());
console.log('Show Only Farcaster Auth:', featureFlags.showOnlyFarcasterAuth());
console.log('Enable Direct Topic Finder Routing:', featureFlags.enableDirectTopicFinderRouting());

// Test complete configuration
console.log('\n=== Complete Configuration ===');
const config = getWeb3Config();
console.log('Config:', JSON.stringify(config, null, 2));

console.log('\n✅ Web3 configuration test completed successfully!');