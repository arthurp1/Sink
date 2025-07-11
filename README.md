# ⚡ Sink

**A Simple / Speedy / Secure Link Shortener with Analytics, 100% run on Cloudflare.**

<a href="https://trendshift.io/repositories/10421" target="_blank">
  <img
    src="https://trendshift.io/api/badge/repositories/10421"
    alt="ccbikai/Sink | Trendshift"
    width="250"
    height="55"
  />
</a>
<a href="https://news.ycombinator.com/item?id=40843683" target="_blank">
  <img
    src="https://hackernews-badge.vercel.app/api?id=40843683"
    alt="Featured on Hacker News"
    width="250"
    height="55"
  />
</a>
<a href="https://www.uneed.best/tool/sink" target="_blank">
  <img
    src="https://www.uneed.best/POTW1.png"
    alt="Uneed Badge"
    height="55"
  />
</a>

![Cloudflare](https://img.shields.io/badge/Cloudflare-F69652?style=flat&logo=cloudflare&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt-00DC82?style=flat&logo=nuxtdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat&logo=shadcnui&logoColor=white)

![Hero](./public/image.png)

----

## ✨ Features

- **URL Shortening:** Compress your URLs to their minimal length.
- **Analytics:** Monitor link analytics and gather insightful statistics.
- **Serverless:** Deploy without the need for traditional servers.
- **Customizable Slug:** Support for personalized slugs and case sensitivity.
- **🪄 AI Slug:** Leverage AI to generate slugs.
- **Link Expiration:** Set expiration dates for your links.

## 🪧 Demo

Experience the demo at [Sink.Cool](https://sink.cool/dashboard). Log in using the Site Token below:

```txt
Site Token: SinkCool
```

<details>
  <summary><b>Screenshots</b></summary>
  <img alt="Analytics" src="./docs/images/sink.cool_dashboard.png"/>
  <img alt="Links" src="./docs/images/sink.cool_dashboard_links.png"/>
  <img alt="Link Analytics" src="./docs/images/sink.cool_dashboard_link_slug.png"/>
</details>

## 🧱 Technologies Used

- **Framework**: [Nuxt](https://nuxt.com/)
- **Database**: [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- **Analytics Engine**: [Cloudflare Workers Analytics Engine](https://developers.cloudflare.com/analytics/)
- **Additional Analytics**: [Google Analytics](https://analytics.google.com/) (optional)
- **UI Components**: [Shadcn-vue](https://www.shadcn-vue.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Cloudflare](https://www.cloudflare.com/)

## 🚗 Roadmap [WIP]

We welcome your contributions and PRs.

- [x] Browser Extension
      - [Sink Tool](https://github.com/zhuzhuyule/sink-extension)
- [x] Raycast Extension
      - [Raycast-Sink](https://github.com/foru17/raycast-sink)
- [x] Apple Shortcuts
      - [Sink Shortcuts](https://s.search1api.com/sink001)
- [ ] Enhanced Link Management (with Cloudflare D1)
- [ ] Analytics Enhancements (Support for merging filter conditions)
- [ ] Dashboard Performance Optimization (Infinite loading)
- [ ] Units Test
- [ ] Support for Other Deployment Platforms

## 🏗️ Deployment

> Video tutorial: [Watch here](https://www.youtube.com/watch?v=MkU23U2VE9E)

1. [Fork](https://github.com/ccbikai/Sink/fork) the repository to your GitHub account.
2. Create a project in [Cloudflare Pages](https://developers.cloudflare.com/pages/).
3. Select the `Sink` repository and choose the `Nuxt.js` preset.
4. Configure the following environment variables:
   - `NUXT_SITE_TOKEN`: Must be longer than **8** characters. This token grants access to your dashboard.
   - `NUXT_CF_ACCOUNT_ID`: Locate your [account ID](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/).
   - `NUXT_CF_API_TOKEN`: Create a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with at least `Account.Account Analytics` permissions. [See reference.](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/#authentication)
   - `NUXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`: (Optional) Google Tag Manager ID (e.g., GTM-XXXXXX) for Google Analytics integration.

5. Save and deploy the project.
6. Cancel the deployment, then navigate to **Settings** -> **Bindings** -> **Add**:
   - **KV Namespace**: Bind the variable name `KV` to a [KV namespace](https://developers.cloudflare.com/kv/) (create a new one under **Storage & Databases** -> **KV**).
   - **Workers AI** (_Optional_): Bind the variable name `AI` to the Workers AI Catalog.
   - **Analytics Engine**:
     - In **Workers & Pages**, go to **Account details** on the right side, find `Analytics Engine`, and click `Set up` to enable the free version.
     - Return to **Settings** -> **Bindings** -> **Add** and select **Analytics engine**.
     - Bind the variable name `ANALYTICS` to the `sink` dataset.

7. Redeploy the project.
8. Update code, refer to the official GitHub documentation [Syncing a fork branch from the web UI](https://docs.github.com/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-web-ui).

## ⚒️ Configuration

[Configuration Docs](./docs/configuration.md)

## 🔌 API

[API Docs](./docs/api.md)

## 🙋🏻 FAQs

[FAQs](./docs/faqs.md)

## 💖 Credits

1. [**Cloudflare**](https://www.cloudflare.com/)
2. [**NuxtHub**](https://hub.nuxt.com/)
3. [**Astroship**](https://astroship.web3templates.com/)

## ☕ Sponsor

1. [Follow Me on X(Twitter)](https://404.li/kai).
2. [Become a sponsor to on GitHub](https://github.com/sponsors/ccbikai).

## URL Shortener with Analytics

A modern URL shortener application with Google Analytics 4 and Cloudflare Analytics integration.

## Features

- URL shortening with customizable slugs
- Analytics tracking for link clicks and page views
- Admin dashboard for monitoring link performance
- Server-side and client-side tracking
- Google Analytics 4 integration
- Cloudflare Analytics support

## Setup

### Prerequisites

- Node.js 18 or newer
- Nuxt.js 3
- Google Analytics 4 account
- Cloudflare account (optional)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration
   ```bash
   # Required variables
   DOMAIN_NAME=yourdomain.com
   GA_MEASUREMENT_ID=G-XXXXXXXXXX
   GA_API_SECRET=your_api_secret_here

   # Optional variables
   GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

- `DOMAIN_NAME` - Your website's domain name
- `GA_MEASUREMENT_ID` - Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)
- `GA_API_SECRET` - Google Analytics API Secret for server-side tracking

### Optional Variables

- `GOOGLE_TAG_MANAGER_ID` - Google Tag Manager container ID (format: GTM-XXXXXXX)
- `NODE_ENV` - Environment setting (`development`, `production`)

## Google Analytics Setup

1. Create a Google Analytics 4 property in your Google Analytics account
2. Note your Measurement ID (format: G-XXXXXXXXXX)
3. Create an API Secret:
   - Go to: Admin > Data Streams > [Your Stream] > Measurement Protocol API secrets
   - Create a new API secret
   - Copy the secret value
4. Add these values to your `.env` file

## Analytics Dashboard

Access the analytics dashboard at `/admin/analytics` to view:

- Page view metrics
- Link click events
- Configuration status

## Deployment

To deploy the application:

1. Set up environment variables in your hosting platform
2. Build the application:
   ```bash
   npm run build
   ```
3. Deploy the built application to your hosting service

## Documentation

Additional documentation is available in the `docs` directory:
- [Analytics Integration](docs/analytics-integration.md)

## License

[MIT License](LICENSE)
