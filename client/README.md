# SlidesMaker Client

React + TypeScript + Vite frontend for SlidesMaker. Provides a form to paste lyrics/text and styling controls.

## Quick start

1) Install dependencies

```bash
cd client
npm install
```

2) Run dev server

```bash
npm run dev
```

3) Open http://localhost:5173

- Paste your lyrics/text. Separate slides with a blank line.
- Adjust style options, then click "Generate Slides".

## Features

- Style controls: font family, font size, background color, font color
- Bold, italic, and center alignment toggles
- Auto-fit option (on by default); server computes a reliable font size

## Backend proxy

Vite is configured to proxy API calls to the Express server:

- Proxy target: http://localhost:3000
- Path: `/api/*`

See `vite.config.ts` for details. Be sure the server is running.

## Styling

- Tailwind CSS v4 is set up using the `@tailwindcss/postcss` plugin
- `src/styles.css` uses `@import "tailwindcss"` (Tailwind v4 style)

## Troubleshooting

- If requests fail, confirm the backend is running on port 3000 and your `.env` is configured
- If styles don't appear, restart the dev server after dependency updates

## Production Deployment

When deploying to Vercel or Netlify:

1. Set the environment variable:
   - `VITE_API_BASE_URL`: Your deployed server URL (e.g., `https://slidesmaker.onrender.com`)
   - No trailing slash!

2. The client will automatically use this URL instead of the dev proxy.

See the main README for full deployment instructions.
