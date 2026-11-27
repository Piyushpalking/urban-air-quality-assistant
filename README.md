# Urban Air Quality Assistant

A mobile-first, dark environmental intelligence web application built with **React**, **TypeScript**, **Tailwind CSS v4**, **Vite**, **Express**, and **Netlify Functions**, integrated with the **Open-Meteo Air Quality API**, **Open-Meteo Geocoding API**, and server-side **Gemini AI (`@google/genai`)**.

## Implementation Stages

- **Stage 1 (Frontend Architecture)**: Responsive dark environmental-tech UI, Android-optimized bottom thumb navigation, desktop sidebar workspace, accessible AQI scale displays, and structured loading/empty/error states.
- **Stage 2A (Real Air Quality Data Integration)**:
  - Live model-based air quality data from `https://air-quality-api.open-meteo.com/v1/air-quality`.
  - Global city search powered by `https://geocoding-api.open-meteo.com/v1/search`.
  - Dual AQI standard switcher (**US EPA AQI** and **European AQI / EAQI**) without redundant network calls.
  - Full 6-pollutant breakdown (**PM2.5**, **PM10**, **NO₂**, **O₃**, **SO₂**, **CO**) with API units and WHO reference comparisons.
  - Interactive **Next 24 Hours** hourly forecast and **5-Day Outlook** daily range aggregation.
  - **Pollution Map** multi-city coordinate projection and comparison table backed by batched Open-Meteo requests.
  - **Insights** computed deterministically from the active city's live Open-Meteo snapshot.
- **Stage 2B (Secure Server-Side Gemini AI Backend — Current)**:
  - Server-side Netlify Function at `netlify/functions/assistant.ts` mapped from `POST /api/assistant` via `netlify.toml`.
  - Local/full-stack Express development server at `server.ts` exposing the identical `POST /api/assistant` contract using the shared `server/assistantCore.ts` module.
  - Calls Gemini (`gemini-4-hydrogen`) strictly on the server via `@google/genai`, grounded in the selected city's live Open-Meteo readings, units, AQI standard, timestamp, and 24h/5-day forecasts.
  - Request validation, per-IP sliding-window rate limiting, timeout handling, safe plain-text rendering, and honest error propagation (zero fake fallback answers).

---

## Architecture Overview

```text
├── netlify.toml                      # Build config, functions bundler & /api/assistant redirect
├── netlify/
│   └── functions/
│       └── assistant.ts              # Netlify Function (POST /api/assistant)
├── server.ts                         # Express + Vite dev/prod server mounting POST /api/assistant
├── server/
│   ├── assistantCore.ts              # Shared validation, rate limiting, Gemini SDK call & prompt builder
│   └── __tests__/
│       └── assistantCore.test.ts     # Unit tests for validation, rate limits, error paths & Netlify handler
└── src/
    ├── components/
    │   ├── common/
    │   │   └── StateViews.tsx            # Accessible loading skeletons, empty states & error recovery
    │   ├── dashboard/
    │   │   ├── AqiOverviewCard.tsx       # Radial AQI gauge, US/EU standard comparison & timestamps
    │   │   ├── AssistantPreviewPanel.tsx # Dashboard assistant handoff panel
    │   │   ├── ForecastSection.tsx       # 24-hour touch-scrollable chart & 5-day min–max outlook
    │   │   └── PollutantGrid.tsx         # 6 primary pollutant cards + inline WHO/source details
    │   ├── layout/
    │   │   ├── AppShell.tsx              # Desktop sidebar + Android bottom tab bar
    │   │   └── CitySearchControl.tsx     # Debounced Open-Meteo Geocoding city search
    │   └── views/
    │       ├── AiAssistantView.tsx       # Live Gemini assistant workspace + sent context inspector
    │       ├── DashboardView.tsx         # Primary overview workspace
    │       ├── InsightsView.tsx          # Data-driven insights & active AQI reference table
    │       └── PollutionMapView.tsx      # Geographic coordinate city comparison map & table
    ├── data/
    │   └── demonstrationData.ts          # Starter prompt templates & basemap surface asset URL
    ├── services/
    │   ├── airQualityMapper.ts           # Pure Open-Meteo -> domain mapper & missing-value handling
    │   ├── airQualityService.ts          # Open-Meteo fetch client with timeouts, TTL cache & dedupe
    │   ├── assistantService.ts           # Frontend POST /api/assistant client with timeout & errors
    │   └── __tests__/
    │       └── airQualityMapper.test.ts  # Unit tests for mapping, AQI scales & missing values
    ├── types/
    │   └── airQuality.ts                 # Shared TypeScript interfaces & API contracts
    ├── utils/
    │   ├── aqiHelpers.ts                 # US EPA & European AQI classifiers, units & formatters
    │   └── insightsGenerator.ts          # Deterministic insights derived from live Open-Meteo data
    └── App.tsx                           # Application state orchestration & lazy map loading
```

---

## Gemini AI Integration (`POST /api/assistant`)

### Request Flow
1. The browser (`src/services/assistantService.ts`) sends a `POST /api/assistant` request containing:
   - User question (validated, max 600 characters)
   - Selected AQI standard (`"us"` or `"european"`)
   - Active city name, region, country, latitude, and longitude
   - Actual Open-Meteo current US/EU AQI, 6 pollutant readings with units & WHO guidelines, model timestamp/timezone, next 24 hours forecast, and 5-day forecast
2. On Netlify, `netlify.toml` rewrites `/api/assistant` (`status = 200`, `force = true`) to `/.netlify/functions/assistant` (`netlify/functions/assistant.ts`). Locally and in full-stack Node hosting, `server.ts` handles `POST /api/assistant` directly.
3. Both runtimes delegate to `server/assistantCore.ts`, which:
   - Enforces `POST`-only requests, 32 KB payload size limit, and strict JSON schema/type/range validation.
   - Enforces sliding-window per-IP rate limiting (12 requests per 60 seconds, returning `429` with `Retry-After`).
   - Reads `process.env.GEMINI_API_KEY` exclusively on the server side.
   - Calls `ai.models.generateContent` (`gemini-4-hydrogen`) with system instructions requiring exact adherence to supplied Open-Meteo numbers/units and explicit distinction between atmospheric model-based estimates and physical ground monitoring stations (e.g. CPCB).
   - Returns structured JSON `{ answer, model, generatedAtIso, groundedContext }`, or explicit HTTP error statuses (`400`, `405`, `413`, `429`, `502`, `503`, `504`) without ever fabricating fallback AI answers.

---

## Security Decisions

- **Server-Only Secret Boundary**: `GEMINI_API_KEY` is read solely via server-side `process.env.GEMINI_API_KEY` inside `server/assistantCore.ts`. It is never prefixed with `VITE_`, never bundled into `dist/`, never returned to the browser, and never printed to server logs.
- **No Client-Side SDK Usage**: `@google/genai` is imported exclusively inside `server/assistantCore.ts`. Browser code communicates strictly through `/api/assistant`.
- **Input Validation & Bounds**: Rejects non-POST methods (`405`), malformed JSON (`400`), oversized request bodies (`413`), empty/over-length prompts (`> 600` chars), invalid AQI standards, and out-of-range coordinates (`lat` outside `-90..90`, `lon` outside `-180..180`).
- **Rate Limiting & Timeouts**: Per-IP sliding-window rate limiter prevents abuse; server enforces a 25-second timeout on Gemini requests and the browser enforces a 30-second `AbortController` timeout.
- **Safe Output Rendering**: Gemini text responses are rendered exclusively through React text nodes (`SafeAssistantText` splitting paragraphs and simple list items) with zero `dangerouslySetInnerHTML` or raw HTML injection.
- **Honest Failure Modes**: Missing keys (`503 GEMINI_NOT_CONFIGURED`), invalid keys (`502 GEMINI_AUTH_ERROR`), quota limits (`429 GEMINI_QUOTA_EXCEEDED`), and network failures are surfaced clearly in the UI with a Retry button—never masked with simulated answers.

---

## Data Sources & Integrity Assumptions

1. **Open-Meteo Air Quality API** (`https://air-quality-api.open-meteo.com/v1/air-quality`):
   - Requests `pm2_5`, `pm10`, `nitrogen_dioxide`, `sulphur_dioxide`, `ozone`, `carbon_monoxide`, `european_aqi`, and `us_aqi` (`current` + `hourly`, `forecast_days=5`, `timezone=auto`).
   - All readings are **atmospheric model-based estimates** (Copernicus CAMS & regional models) and explicitly labeled as such—not physical ground monitoring stations or CPCB sensors.
2. **Open-Meteo Geocoding API** (`https://geocoding-api.open-meteo.com/v1/search`):
   - Debounced city search (350ms, minimum 2 characters) with 30-minute caching.
3. **Missing Pollutant Values**:
   - Any `null`, `undefined`, `NaN`, or negative values remain `null` (never coerced to `0`), render as `Unavailable` / `—`, and are passed transparently to Gemini as `null`.

---

## Environment Variables & Deployment

### Local Development
1. Copy `.env.example` to `.env` (never commit `.env` to Git):
   ```bash
   cp .env.example .env
   ```
2. Set your server-side Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY="your-real-gemini-api-key"
   ```
3. Install dependencies and start the full-stack server (Express + Vite on port 3000):
   ```bash
   npm install
   npm run dev
   ```

### Netlify Deployment
1. Push the repository to GitHub (ensure `.env` is ignored via `.gitignore`).
2. Connect the repository in **Netlify -> Add new site -> Import an existing project**.
   - Netlify automatically reads `netlify.toml`:
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Functions directory: `netlify/functions` (`esbuild` bundler)
     - Redirect rule: `/api/assistant` -> `/.netlify/functions/assistant` (`200`, `force = true`)
3. In **Netlify -> Site configuration -> Environment variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: your Gemini API key (mark as secret / available to **Functions** scope)
4. Trigger a deploy (or redeploy after adding `GEMINI_API_KEY`).
5. Verify by opening the deployed site, navigating to **AI Assistant**, and submitting a question—confirm the browser Network tab calls `POST /api/assistant` with no API key headers or query strings.

---

## Development & Verification Scripts

```bash
# Start full-stack dev server (Express /api/assistant + Vite SPA on port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Run frontend mapper + backend assistant & Netlify Function unit tests
npm test

# Build production frontend bundle
npm run build
```
