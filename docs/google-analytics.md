# Google Analytics Integration

This project includes Google Analytics integration as an alternative to Cloudflare Analytics Engine, which is only available with paid Cloudflare plans.

## Dual Analytics Implementation

Sink implements two parallel analytics systems:

1. **Cloudflare Analytics Engine** (when available with paid plans)
2. **Google Analytics 4** (available for all users)

When Google Analytics is configured, both systems will track link clicks simultaneously. If you're using a free Cloudflare plan, only the Google Analytics data will be available.

## Setup Instructions

1. Create a Google Analytics 4 (GA4) property in the [Google Analytics console](https://analytics.google.com/).

2. Set up a Google Tag Manager (GTM) account and container at [Google Tag Manager](https://tagmanager.google.com/).

3. In Google Tag Manager:
   - Create a new GA4 Configuration tag
   - Add your GA4 Measurement ID
   - Set trigger to "All Pages"
   - Publish your container

4. Get your GTM Container ID (format: `GTM-XXXXXXX`) from the GTM dashboard.

5. Add your GTM Container ID to your environment variables:
   ```
   NUXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
   ```

## How Link Click Tracking Works

When Google Analytics is configured:

1. When a user accesses a shortened link, the system logs the access in Cloudflare Analytics (if available)
2. The system then serves a special HTML page with embedded Google Analytics tracking
3. This page sends a page view event to Google Analytics with the slug path
4. After a short delay (100ms), the user is automatically redirected to the destination URL

This approach ensures both analytics systems receive the click data without any user-visible delay.

## Viewing Analytics Data

### Cloudflare Analytics
If you have a paid Cloudflare plan, you can view link analytics in the Sink dashboard as usual.

### Google Analytics
To view link analytics in Google Analytics:

1. Go to the GA4 dashboard
2. Navigate to **Reports** → **Engagement** → **Pages and screens**
3. Look for entries with paths matching your link slugs (e.g., `/abc123`)
4. The page view count shows how many times each link was accessed

## Usage

Google Analytics is automatically integrated when you provide a valid GTM ID. The plugin will:

- Only track in production mode, not during development
- Automatically track page views 
- Provide utility functions for custom tracking

### Custom Event Tracking

You can use the utility functions from `utils/analytics.ts` to track custom events:

```javascript
import { trackEvent } from '~/utils/analytics'

// Track a custom event
trackEvent('button_click', { 
  button_id: 'create-link',
  button_text: 'Create Link' 
})
```

### Page View Tracking

Page views are automatically tracked on route changes. If you need manual control, use:

```javascript
import { trackPageView } from '~/utils/analytics'

// Track a page view manually
trackPageView('My Page Title', '/my-custom-path')
```

## Privacy Considerations

When implementing Google Analytics, ensure you comply with privacy regulations like GDPR and CCPA:

1. Update your privacy policy to disclose Google Analytics usage
2. Consider implementing a cookie consent banner
3. Configure Google Analytics for data anonymization where appropriate 
