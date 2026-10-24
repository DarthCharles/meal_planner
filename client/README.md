# Comal client

Mobile-first React/Vite PWA for the Meal Planner API.

## Run locally

```bash
npm install
npm run dev
```

The client expects the Rails API at `http://127.0.0.1:3000`. Copy `.env.example` to `.env` to change it.

The app enters demo mode when the API is unavailable, so the visual shell can be developed independently of Rails.
