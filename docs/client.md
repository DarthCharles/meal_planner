# Consumer client

The consumer client is a mobile-first responsive PWA built with React, TypeScript, and Vite.

## Local setup

```bash
cd client
npm install
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

The client uses `VITE_API_URL` for the API base URL. The default is `http://127.0.0.1:3000`.

## Current flows

- View the current menu.
- Reorder the weekly grid so the current day appears first.
- Generate a weekly menu.
- Browse and filter meals.
- Add a meal to the library.
- Install the app as a PWA.

The client falls back to demo data when the API is unavailable so the visual shell can still be developed.

## Structure

```text
client/
  src/
    App.tsx       # application screens and interactions
    api.ts        # Rails API requests
    types.ts      # API-facing TypeScript types
    styles.css    # responsive visual system
  public/
    manifest.webmanifest
    sw.js
```

The visual system uses a warm cream canvas, terracotta actions, golden meal accents, green garnish cues, and a bowl-based Comal mark.
