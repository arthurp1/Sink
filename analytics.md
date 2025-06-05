# Plan for Google Analytics Integration

**Goal:** Integrate real Google Analytics 4 (GA4) data into the dashboard to display comprehensive analytics for each slug, replacing current mock data.

**Current State Assessment:**

*   `AnalyticsDashboard.vue`: Renders basic metrics (Page Views, Link Clicks, Downloads) based on data fetched via `fetchSlugEventCount`.
*   `server/api/analytics/slug-data.ts`: Serves as the API endpoint. Currently returns mock data but includes placeholders for GA4 API integration, authentication (`GA_MEASUREMENT_ID`, `GA_API_SECRET`), and error handling for missing configuration.
*   `pages/admin/analytics.vue`: Manages the slug input and passes it to `AnalyticsDashboard.vue`. Includes a configuration verification check.
*   `~/utils/ga-data.ts`: Contains `fetchSlugEventCount` and `verifyGAConfig`. `fetchSlugEventCount` likely calls the `slug-data.ts` API.

**Proposed Solution:**

The solution involves three main phases:

1.  **Backend Integration (`server/api/analytics/slug-data.ts`):** Implement the actual GA4 Data API v1 calls to fetch real data.
2.  **Frontend Enhancement (`components/AnalyticsDashboard.vue` & `~/utils/ga-data.ts`):** Update the frontend to request and display additional GA4 metrics and dimensions.
3.  **Configuration and Setup:** Outline necessary environment variables and Google Cloud Project setup.

---

### Phase 1: Backend Integration (`server/api/analytics/slug-data.ts`)

**Objective:** Replace mock data with real data fetched from Google Analytics Data API v1.

**Steps:**

1.  **Install Google Analytics Data API Client Library:**
    *   Add the `@google-analytics/data` Node.js client library to the project's dependencies.
    *   `npm install @google-analytics/data googleapis` (The `googleapis` library might also be useful for broader Google API interactions, but `@google-analytics/data` is specific).

2.  **Authentication:**
    *   For the Data API, service account authentication is generally recommended for server-to-server communication.
    *   **Action:** Modify `slug-data.ts` to use a Google Service Account key file.
        *   Obtain a service account JSON key file from Google Cloud Platform.
        *   Store the path to this key file (or the content directly) securely in environment variables (e.g., `GOOGLE_APPLICATION_CREDENTIALS` or `GA_SERVICE_ACCOUNT_KEY`).
        *   Initialize the Google Analytics Data client using these credentials.

3.  **Constructing GA4 Data API Requests:**
    *   Use the `runReport` method from the `@google-analytics/data` client.
    *   **Dimensions:**
        *   For slug data: `pagePath` or `pagePathPlusQueryString` (to handle query parameters).
        *   For custom events: `eventName`.
        *   To get more detail, consider `date`, `deviceCategory`, `country`, `city`, `browser`, `operatingSystem`, `source`, `medium`.
    *   **Metrics:**
        *   `activeUsers`
        *   `sessions`
        *   `screenPageViews` (for page views)
        *   `eventCount` (for specific events like `custom_redirect`, `link_click`, `file_download`)
        *   `totalUsers`
        *   `bounceRate`
        *   `averageSessionDuration`
        *   `engagementRate`
    *   **Date Range:** Use `startDate: '7daysAgo'` and `endDate: 'today'` for the last 7 days, or make it configurable.
    *   **Filters:** Apply dimension filters to retrieve data for the specific `slug` (using `pagePath` or `pagePathPlusQueryString` and a `REGEXP_CONTAINS` filter) and for specific `eventName` values.

4.  **Process API Response:**
    *   Parse the response from the GA4 Data API (which is row-based).
    *   Extract the relevant dimensions and metrics from `rows` and `dimensionHeaders`/`metricHeaders`.
    *   Aggregate and structure the data into a clear format suitable for the `AnalyticsDashboard.vue` component. This might involve summing up event counts for specific events.
    *   Map `pagePath` (or `pagePathPlusQueryString`) to the `slug` and populate event counts (e.g., `custom_redirect`, `linkClick`, `download`) based on `eventName` and `eventCount` from the GA4 response.

### Phase 2: Frontend Enhancement (`components/AnalyticsDashboard.vue` & `~/utils/ga-data.ts`)

**Objective:** Extend the UI to display additional metrics and handle the new data structure from the backend.

**Steps:**

1.  **Update `~/utils/ga-data.ts`:**
    *   Modify `fetchSlugEventCount` (consider renaming to `fetchAnalyticsData` for broader scope) to reflect the new data structure from the backend. The function should return a comprehensive analytics object including all desired metrics and event counts.
    *   Ensure the API call to `server/api/analytics/slug-data.ts` is updated if the backend endpoint's request parameters change.

2.  **Update `components/AnalyticsDashboard.vue`:**
    *   **Expand Data Structure:** Adjust the `data` ref in the component's script to accommodate the new metrics and event counts received from the backend (e.g., `totalUsers`, `sessions`, `bounceRate`, `customRedirects`, etc.). Define a clear interface for the `data` object.
    *   **UI Layout:** Design new UI elements (cards, tables, or charts) to display the additional data in an organized and user-friendly manner.
        *   Add sections for:
            *   **Overview Metrics:** Sessions, Active Users, Total Users, Page Views.
            *   **Engagement:** Bounce Rate, Average Session Duration, Engagement Rate.
            *   **Event Specifics:** Dedicated cards for `custom_redirect` count, `link_click` count, `file_download` count, and any other relevant custom events.
            *   **Audience Insights (Optional, if fetched):** Device Category breakdown, Top Countries/Cities.
    *   **Data Binding:** Bind the new `data` fields to the corresponding UI elements in the template.
    *   **Conditional Rendering:** Implement `v-if` and `v-else` directives for graceful handling of data loading, errors, and cases where certain data points might be zero or not available.
    *   **Refinements:** Enhance the display with tooltips, clear labels, and appropriate formatting for numbers and percentages.

### Phase 3: Configuration and Setup

**Objective:** Ensure the environment is properly set up for GA4 Data API access.

**Steps:**

1.  **Google Cloud Project Setup:**
    *   Ensure a Google Cloud Project is set up.
    *   Enable the "Google Analytics Data API" in the project's API Library.
    *   Create a Service Account and generate a JSON key file. Store this file securely.
    *   Grant the Service Account appropriate permissions to read Google Analytics data (e.g., "Google Analytics Viewer" role) for your specific GA4 property.

2.  **Google Analytics Property:**
    *   Confirm you are using a GA4 property (not Universal Analytics). The Data API v1 only works with GA4 properties.
    *   Note your GA4 Property ID (e.g., `YOUR_PROPERTY_ID`). This is essential for all Data API calls and should be prefixed with `properties/` when used in the API.

3.  **Environment Variables:**
    *   Add the following to your `.env` file (or equivalent secure configuration management, ensuring these are not exposed in the frontend):
        *   `GA_PROPERTY_ID`: Your GA4 property ID (e.g., `123456789`).
        *   `GA_SERVICE_ACCOUNT_EMAIL`: The email address of your service account.
        *   `GA_SERVICE_ACCOUNT_PRIVATE_KEY`: The private key content from your service account JSON file. (Alternatively, `GOOGLE_APPLICATION_CREDENTIALS` can be set to the path of the JSON key file).
    *   Review and potentially remove `GA_MEASUREMENT_ID` and `GA_API_SECRET` if they are solely for the Measurement Protocol and not needed for the Data API.

---

**Example Metrics and Events to Display (Frontend & Backend Alignment):**

*   **Overall Engagement:**
    *   Page Views (`screenPageViews`)
    *   Sessions (`sessions`)
    *   Active Users (`activeUsers`)
    *   Total Users (`totalUsers`)
*   **Behavioral Metrics:**
    *   Bounce Rate (`bounceRate`)
    *   Average Session Duration (`averageSessionDuration`)
    *   Engagement Rate (`engagementRate`)
*   **Specific Event Counts (Filtered by `eventName` dimension):**
    *   `custom_redirect`
    *   `link_click`
    *   `file_download`
*   **User Attributes (Optional):**
    *   Top Devices (from `deviceCategory`)
    *   Top Countries/Cities (from `country`, `city`)
    *   Top Browsers (from `browser`)

---

**Key Considerations:**

*   **Error Handling:** Implement robust error handling on both the backend (API call failures, invalid configurations) and frontend (displaying user-friendly error messages).
*   **Loading States:** Provide clear loading indicators in the UI while data is being fetched.
*   **Date Range Selection:** Consider adding a date range picker in `pages/admin/analytics.vue` to allow users to select different timeframes for analysis.
*   **Performance:** For large datasets, consider pagination, caching mechanisms (e.g., Redis, in-memory caching), and efficient data aggregation on the backend to prevent slow responses.
*   **Security:** Ensure all API keys and service account credentials are kept secure and never exposed on the client-side.
*   **GA4 Data Model:** Remember that GA4 is event-based. All interactions are events. Page views are also a type of event (`page_view`).

This detailed plan should guide the integration of real GA4 data, providing a much richer analytics experience for each slug.
