<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6e4192b6-31ad-4125-a8e7-f5d8c0972907

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Changelog — v19.7

- **Fixed: daily stats now reset at midnight.** Previously the app read the date only once at page load, so a tab left open past 00:00 (or a laptop waking the next day) kept writing focus time and oranges into yesterday's record. Two-layer fix: (1) the per-second study loop detects the date change mid-session and starts a fresh day instantly; (2) a background watcher checks every 30s and on tab-visibility change, covering idle/paused/sleep-wake cases.
- Midnight is based on **each device's local clock and timezone** — every user resets at their own local 00:00.
- `.env.local` is not included in this package for security. Create it from `.env.example` and add your own `GEMINI_API_KEY`.
