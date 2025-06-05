# Analytics Integration

This document outlines the analytics implementation for this Nuxt.js application, which uses both Google Analytics 4 (GA4) and Cloudflare Analytics.

## Table of Contents

1. [Google Analytics 4 (GA4) Setup](#google-analytics-4-ga4-setup)
2. [Environment Variables](#environment-variables)
3. [Cloudflare Analytics](#cloudflare-analytics)
4. [Event Tracking](#event-tracking)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Privacy Considerations](#privacy-considerations)
7. [Troubleshooting](#troubleshooting)

## Google Analytics 4 (GA4) Setup

GA4 is implemented using both client-side and server-side tracking:

### Configuration

The necessary configuration values are defined in `nuxt.config.ts` but are loaded from environment variables:

```ts
runtimeConfig: {
  public: {
    gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
  },
  gaApiSecret: process.env.GA_API_SECRET || '',
}
```

To set up GA4 tracking, you need to:

1. Create a Google Analytics 4 property in the Google Analytics admin
2. Get your Measurement ID (G-XXXXXXXXXX) and API Secret
3. Add these values to your `.env` file as shown below

## Environment Variables

The following environment variables are required for analytics to function properly:

```bash
# .env file
# Google Analytics Configuration
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your_api_secret
DOMAIN_NAME=yourdomain.com
```

> **Important:** Never commit the `.env` file to your repository. Always add it to `.gitignore` to prevent sensitive credentials from being exposed.

For deployment environments (development, staging, production), set these environment variables in your hosting platform's environment configuration:

- Cloudflare Pages: Set in the Environment Variables section
- Vercel: Set in the Project Settings → Environment Variables
- Netlify: Set in the Site Settings → Build & Deploy → Environment

Each environment (development, staging, production) can have different analytics configurations to separate testing data from production data.

### Client-Side Tracking

Client-side tracking is implemented in `/plugins/analytics.client.ts`, which:

- Initializes Google Analytics tracking
- Tracks page views
- Sets up enhanced click tracking
- Handles user consent management

### Server-Side Tracking

Server-side tracking is implemented in `/server/middleware/0.analytics.ts`, which:

- Tracks server-side page views
- Handles redirects while preserving analytics data
- Sends events to GA4 using the Measurement Protocol

## Cloudflare Analytics

Cloudflare Analytics is enabled for this site, providing:

- Web traffic metrics
- Site performance data
- Security insights

No additional code implementation is needed as tracking is automatic once enabled in your Cloudflare dashboard.

## Event Tracking

### Tracked Events

The following events are tracked:

| Event Name | Description | Platform |
|------------|-------------|----------|
| `page_view` | Each page view | GA4, Cloudflare |
| `link_click` | User clicks on internal or external links | GA4 |
| `download` | User downloads a file | GA4 |
| `form_submit` | User submits a form | GA4 |

### Custom Tracking

To track custom events in your components:

```vue
<script setup>
import { trackEvent } from '~/utils/analytics'

function handleAction() {
  // Do something
  trackEvent('custom_action', {
    category: 'engagement',
    label: 'feature_used',
  })
}
</script>
```

## Analytics Dashboard

An admin dashboard is available to view analytics data for your content. This feature provides:

- Page view metrics for specific URLs
- Event tracking data (link clicks, downloads)
- Configuration verification

### Accessing the Dashboard

The analytics dashboard is available at `/admin/analytics` and requires authentication to access.

### Custom Slug Analysis

You can analyze specific content by entering the URL slug in the dashboard interface. For example:
- To analyze the homepage, enter `home`
- To analyze a blog post, enter `blog/my-post-slug`

### Configuration Verification

The dashboard includes a verification tool that checks if your Google Analytics setup is working correctly. Use this to diagnose any tracking issues.

## Privacy Considerations

Our analytics implementation follows privacy best practices:

- IP anonymization is enabled
- We respect "Do Not Track" browser settings
- Cookie usage is minimized
- Data is automatically deleted after 14 months
- User consent is required in regions governed by GDPR, CCPA, etc.

## Troubleshooting

### Common Issues

If analytics data isn't appearing:

1. **Check environment variables**: Ensure your `.env` file contains valid GA_MEASUREMENT_ID and GA_API_SECRET values
2. Verify your GA configuration using the verification endpoint: `/api/analytics/verify`
3. Check browser console for JavaScript errors
4. Confirm that your ad blocker isn't preventing tracking

### Debug Tools

For debugging purposes, you can:

- Add `?debug_analytics=true` to any URL to enable verbose console logging
- Use the verification endpoint to test your configuration: `/api/analytics/verify`
- Check server logs for Measurement Protocol errors
- Inspect the runtime configuration in your browser console: `console.log(useRuntimeConfig().public.gaMeasurementId)`
