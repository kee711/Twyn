# Mixpanel Integration Guide

## Setup Complete ✅

Mixpanel has been successfully integrated into your application. Here's what you need to do to activate it:

## 1. Get Your Mixpanel Token

1. Go to [Mixpanel](https://mixpanel.com) and sign in to your account
2. Navigate to **Project Settings** → **Project Token**
3. Copy your project token

## 2. Add Token to Environment Variables

Replace `YOUR_MIXPANEL_TOKEN_HERE` in your `.env.local` file:

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=your_actual_mixpanel_token_here
```

## 3. Events Being Tracked

### Automatic Events
- **Page Views** - Every page navigation
- **User Identification** - When users log in

### Content Creation Events
- **AI Content Generated** - When AI generates content
  - Properties: topic, postType, language, threadCount
- **Content Saved** - When content is saved
  - Properties: type (draft/scheduled/published), isAiGenerated, threadCount
- **Content Scheduled** - When content is scheduled
  - Properties: scheduledTime, threadCount, isAiGenerated
- **Content Published** - When content is published
  - Properties: threadCount, isAiGenerated, publishType

### User Events (Ready to implement)
- **User Login** - When user logs in
- **User Logout** - When user logs out
- **Social Account Connected** - When Threads account is connected
- **Topic Finder Used** - When topic finder is accessed
- **Schedule Time Set** - When publishing times are configured
- **Statistics Viewed** - When statistics page is viewed

## 4. How to Use in Your Code

### Track Custom Events

```typescript
import { trackEvent, trackUserAction } from '@/lib/analytics/mixpanel';

// Simple event
trackEvent('Button Clicked', {
  button_name: 'Subscribe',
  location: 'header'
});

// Use predefined actions
trackUserAction.topicFinderUsed();
```

### Track Time-based Events

```typescript
import { timeTrack } from '@/lib/analytics/mixpanel';

// Start timing
timeTrack.start('Form Completion');

// ... user fills form ...

// End timing (automatically includes duration)
timeTrack.end('Form Completion', {
  form_name: 'signup'
});
```

### Track Errors

```typescript
import { trackError } from '@/lib/analytics/mixpanel';

try {
  // Some operation
} catch (error) {
  trackError(error, {
    context: 'content_generation',
    user_action: 'generate_ai_content'
  });
}
```

## 5. Testing Your Integration

1. Add your token to `.env.local`
2. Restart your development server: `npm run dev`
3. Open your browser console
4. Navigate through your app
5. You should see Mixpanel debug messages in the console (in development mode)
6. Check your Mixpanel dashboard for incoming events

## 6. Files Modified

- `/lib/analytics/mixpanel.ts` - Core Mixpanel utilities
- `/components/analytics/MixpanelProvider.tsx` - React provider for tracking
- `/app/[locale]/layout.tsx` - Integration point
- `/app/[locale]/(dashboard)/contents/topic-finder/page.tsx` - AI content tracking
- `/components/RightSidebar.tsx` - Content save/schedule/publish tracking

## 7. Environment Variables

Make sure you have this in your `.env.local`:

```bash
# Mixpanel Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here
```

## 8. Next Steps

1. Add your Mixpanel token
2. Deploy to production
3. Create custom dashboards in Mixpanel
4. Set up funnels and retention reports
5. Configure alerts for key metrics

## Notes

- Analytics respects Do Not Track (DNT) browser settings
- Data is batched for performance (10 events per batch)
- Automatic page view tracking is enabled
- User identification happens on login
- All events include timestamp and environment (dev/prod)