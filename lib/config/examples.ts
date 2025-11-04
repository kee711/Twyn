/**
 * Examples of how to use web3 configuration utilities
 * 
 * This file contains examples and patterns for using the web3 configuration
 * system throughout the application.
 */

import { isWeb3Mode, featureFlags, getSupportedPlatforms, isPlatformSupported } from './web3';

/**
 * Example: Conditional rendering based on web3 mode
 */
export function ExampleConditionalRendering() {
    // Check if we're in web3 mode
    if (isWeb3Mode()) {
        return 'Web3 Mode: Farcaster Only';
    }
    return 'Regular Mode: All Platforms';
}

/**
 * Example: Platform filtering
 */
export function ExamplePlatformFiltering() {
    const supportedPlatforms = getSupportedPlatforms();

    // Filter platforms based on current mode
    const availablePlatforms = ['farcaster', 'threads', 'x'].filter(platform =>
        isPlatformSupported(platform as any)
    );

    return availablePlatforms;
}

/**
 * Example: Feature flag usage
 */
export function ExampleFeatureFlags() {
    const showStatistics = featureFlags.showStatistics();
    const showComments = featureFlags.showComments();
    const showOnlyFarcaster = featureFlags.showOnlyFarcasterAuth();

    return {
        navigationItems: [
            { name: 'Contents', href: '/contents', visible: true },
            { name: 'Statistics', href: '/statistics', visible: showStatistics },
            { name: 'Comments', href: '/comments', visible: showComments },
            { name: 'Schedule', href: '/schedule', visible: true },
            { name: 'Settings', href: '/settings', visible: true },
        ].filter(item => item.visible),

        authOptions: [
            { name: 'Email', visible: !showOnlyFarcaster },
            { name: 'Google', visible: !showOnlyFarcaster },
            { name: 'Farcaster', visible: true },
        ].filter(option => option.visible),
    };
}

/**
 * Example: React component usage
 */
export const ExampleReactComponent = `
import { useWeb3Config, useFeatureFlags } from '@/hooks/useWeb3Config';

export function MyComponent() {
  const { isWeb3Mode, supportedPlatforms, isPlatformSupported } = useWeb3Config();
  const { showStatistics, showComments } = useFeatureFlags();

  return (
    <div>
      {isWeb3Mode && <div>Web3 Mode Active</div>}
      
      {showStatistics && <StatisticsSection />}
      {showComments && <CommentsSection />}
      
      <PlatformSelector 
        platforms={supportedPlatforms}
        onSelect={(platform) => {
          if (isPlatformSupported(platform)) {
            // Handle platform selection
          }
        }}
      />
    </div>
  );
}
`;

/**
 * Example: Server-side usage
 */
export const ExampleServerSide = `
import { isWeb3Mode, featureFlags } from '@/lib/config/web3';

export async function getServerSideProps() {
  // Check web3 mode on server side
  if (isWeb3Mode()) {
    return {
      redirect: {
        destination: '/contents/topic-finder',
        permanent: false,
      },
    };
  }

  return {
    props: {
      showLandingPage: featureFlags.showLandingPage(),
    },
  };
}
`;

/**
 * Example: Middleware usage
 */
export const ExampleMiddleware = `
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isWeb3Mode } from '@/lib/config/web3';

export function middleware(request: NextRequest) {
  // Redirect to topic-finder in web3 mode
  if (isWeb3Mode() && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/contents/topic-finder', request.url));
  }

  return NextResponse.next();
}
`;