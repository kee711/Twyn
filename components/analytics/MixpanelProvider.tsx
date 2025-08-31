'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { initMixpanel, trackPageView, identifyUser } from '@/lib/analytics/mixpanel';

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Initialize Mixpanel on mount
  useEffect(() => {
    initMixpanel();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(pathname, {
        full_url: url,
        search_params: searchParams?.toString() || '',
      });
    }
  }, [pathname, searchParams]);

  // Identify user when session changes
  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id || session.user.email || '', {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);

  return <>{children}</>;
}