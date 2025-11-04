# Web3 Configuration System

This directory contains the configuration utilities for the web3 Farcaster integration feature.

## Overview

The web3 configuration system allows the application to operate in two modes:
- **Regular Mode**: Full social media management with support for all platforms (Threads, X, Farcaster)
- **Web3 Mode**: Farcaster-focused experience with simplified UI and direct routing

## Environment Variables

### NEXT_PUBLIC_WEB3_MODE

Controls whether the application runs in web3 mode or regular mode.

```bash
# Regular mode (default)
NEXT_PUBLIC_WEB3_MODE=false

# Web3 mode
NEXT_PUBLIC_WEB3_MODE=true
```

## Usage

### Server-side Usage

```typescript
import { isWeb3Mode, getSupportedPlatforms, featureFlags } from '@/lib/config/web3';

// Check if web3 mode is enabled
if (isWeb3Mode()) {
  // Web3 mode logic
  redirect('/contents/topic-finder');
}

// Get supported platforms
const platforms = getSupportedPlatforms(); // ['farcaster'] in web3 mode

// Use feature flags
if (featureFlags.showStatistics()) {
  // Show statistics menu
}
```

### Client-side Usage with React Hooks

```typescript
import { useWeb3Config, useFeatureFlags } from '@/hooks/useWeb3Config';

function MyComponent() {
  const { isWeb3Mode, supportedPlatforms } = useWeb3Config();
  const { showStatistics, showComments } = useFeatureFlags();

  return (
    <div>
      {isWeb3Mode && <div>Web3 Mode Active</div>}
      {showStatistics && <StatisticsSection />}
      {showComments && <CommentsSection />}
    </div>
  );
}
```

### Platform Filtering

```typescript
import { isPlatformSupported, getSupportedPlatforms } from '@/lib/config/web3';

// Check if a specific platform is supported
if (isPlatformSupported('farcaster')) {
  // Platform is supported
}

// Filter platforms based on current mode
const availablePlatforms = allPlatforms.filter(platform => 
  isPlatformSupported(platform)
);
```

## Feature Flags

The system provides several feature flags for conditional rendering:

- `showStatistics()`: Show statistics menu (false in web3 mode)
- `showComments()`: Show comments menu (false in web3 mode)
- `showLandingPage()`: Show landing page (false in web3 mode)
- `showEmailAuth()`: Show email authentication (false in web3 mode)
- `showGoogleAuth()`: Show Google authentication (false in web3 mode)
- `showOnlyFarcasterAuth()`: Show only Farcaster auth (true in web3 mode)
- `enableDirectTopicFinderRouting()`: Enable direct routing to topic-finder (true in web3 mode)
- `enableAutoFarcasterLinking()`: Enable automatic Farcaster account linking (true in web3 mode)

## Configuration Objects

### Complete Configuration

```typescript
import { getWeb3Config } from '@/lib/config/web3';

const config = getWeb3Config();
// Returns:
// {
//   isEnabled: boolean,
//   supportedPlatforms: PlatformKey[],
//   defaultRedirectPath: string,
//   features: FeatureFlags
// }
```

### Navigation Configuration

```typescript
import { getNavigationConfig } from '@/lib/config/web3';

const navigation = getNavigationConfig();
// Returns navigation items filtered based on current mode
```

## Testing

Run the configuration test to verify everything is working:

```bash
npx tsx scripts/test-web3-config.ts
```

## Files

- `web3.ts`: Core web3 configuration utilities
- `index.ts`: Main configuration exports
- `examples.ts`: Usage examples and patterns
- `__tests__/web3.test.ts`: Unit tests for web3 configuration
- `README.md`: This documentation file

## Integration Points

The web3 configuration system is designed to be integrated with:

1. **Routing**: Middleware and page components for direct routing
2. **Authentication**: Sign-in components for Farcaster-only auth
3. **Navigation**: Sidebar and menu components for simplified UI
4. **Platform Management**: Social account stores and selectors
5. **Feature Flags**: Conditional rendering throughout the app