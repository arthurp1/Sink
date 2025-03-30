# Google Analytics Integration

This project includes Google Analytics integration as an alternative to Cloudflare Analytics Engine, which is only available with paid Cloudflare plans.

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
