# SlidesMaker Client

Minimal React + TypeScript client scaffold using Vite.

Quick start:

1. Install dependencies

```bash
cd client
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Open http://localhost:5173 and use the textarea to paste lyrics, then click "Generate Slides".

Notes:
- The client calls the server endpoint at `/api/generate`. When running the client locally, run the server concurrently and ensure the server is reachable at the same origin (or configure a proxy in Vite).
- This is a minimal scaffold; expand styling and controls as needed.
