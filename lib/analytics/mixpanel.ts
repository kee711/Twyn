import mixpanel from 'mixpanel-browser';

// Mixpanel configuration
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Mixpanel
let mixpanelInitialized = false;

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN || mixpanelInitialized) {
    if (!MIXPANEL_TOKEN) {
      console.warn('Mixpanel token not found. Analytics will not be tracked.');
    }
    return;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: isDevelopment,
      track_pageview: true, // Automatically track page views
      persistence: 'localStorage',
      ignore_dnt: false, // Respect Do Not Track
      secure_cookie: true,
      cross_subdomain_cookie: true,
      batch_requests: true,
      batch_size: 10,
      batch_flush_interval_ms: 2000,
    });
    
    mixpanelInitialized = true;
    console.log('Mixpanel initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Mixpanel:', error);
  }
};

// Track events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!mixpanelInitialized || !MIXPANEL_TOKEN) return;
  
  try {
    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: isDevelopment ? 'development' : 'production',
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// Identify user
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!mixpanelInitialized || !MIXPANEL_TOKEN) return;
  
  try {
    mixpanel.identify(userId);
    if (userProperties) {
      mixpanel.people.set(userProperties);
    }
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
};

// Reset user (for logout)
export const resetUser = () => {
  if (!mixpanelInitialized || !MIXPANEL_TOKEN) return;
  
  try {
    mixpanel.reset();
  } catch (error) {
    console.error('Failed to reset user:', error);
  }
};

// Track page view
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent('Page View', {
    page: pageName,
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer,
    ...properties,
  });
};

// Track user actions
export const trackUserAction = {
  // Content creation events
  aiContentGenerated: (properties: {
    topic?: string;
    postType: 'single' | 'thread';
    language: string;
    threadCount?: number;
  }) => {
    trackEvent('AI Content Generated', properties);
  },

  contentSaved: (properties: {
    type: 'draft' | 'scheduled' | 'published';
    isAiGenerated: boolean;
    threadCount?: number;
  }) => {
    trackEvent('Content Saved', properties);
  },

  contentScheduled: (properties: {
    scheduledTime: string;
    threadCount: number;
    isAiGenerated: boolean;
  }) => {
    trackEvent('Content Scheduled', properties);
  },

  contentPublished: (properties: {
    threadCount: number;
    isAiGenerated: boolean;
    publishType: 'immediate' | 'scheduled';
  }) => {
    trackEvent('Content Published', properties);
  },

  // User account events
  userLogin: (properties: {
    provider: string;
    userId: string;
  }) => {
    trackEvent('User Login', properties);
    identifyUser(properties.userId);
  },

  userLogout: () => {
    trackEvent('User Logout');
    resetUser();
  },

  socialAccountConnected: (properties: {
    platform: string;
    accountId: string;
  }) => {
    trackEvent('Social Account Connected', properties);
  },

  // Feature usage events
  topicFinderUsed: () => {
    trackEvent('Topic Finder Used');
  },

  scheduleTimeSet: (properties: {
    times: string[];
  }) => {
    trackEvent('Schedule Time Set', properties);
  },

  statisticsViewed: (properties: {
    dateRange: number;
    metrics: string[];
  }) => {
    trackEvent('Statistics Viewed', properties);
  },
};

// Time tracking utilities
export const timeTrack = {
  start: (eventName: string) => {
    if (!mixpanelInitialized || !MIXPANEL_TOKEN) return;
    mixpanel.time_event(eventName);
  },
  
  end: (eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties);
  },
};

// Track form submissions
export const trackFormSubmission = (formName: string, properties?: Record<string, any>) => {
  trackEvent('Form Submitted', {
    form_name: formName,
    ...properties,
  });
};

// Track errors
export const trackError = (error: Error | string, context?: Record<string, any>) => {
  trackEvent('Error Occurred', {
    error_message: typeof error === 'string' ? error : error.message,
    error_stack: typeof error === 'object' ? error.stack : undefined,
    ...context,
  });
};