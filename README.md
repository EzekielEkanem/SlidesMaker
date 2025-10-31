# SlidesMaker

Generate Google Slides presentations from lyrics or any text, with per-slide styling. Server is Express + TypeScript; client is React + Vite + Tailwind.

## Features

- Convert text into Google Slides presentations
- Split content by blank lines into separate slides
- Customize fonts, colors, bold/italic, center alignment
- Auto-fit behavior approximated server-side for reliable sizing
- Secure Google OAuth2 integration (no service account for Phase 1)
- TypeScript end to end

## Setup

1. Clone the repository:
```bash
git clone https://github.com/EzekielEkanem/SlidesMaker.git
cd SlidesMaker
```

2. Install dependencies (server + client):
```bash
npm install
cd client && npm install
cd ..
```

3. Set up Google OAuth2 (Slides + Drive APIs):
   - Create a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable: Google Slides API and Google Drive API
   - Configure an OAuth Consent Screen (Internal or External as needed)
   - Create OAuth 2.0 Client Credentials (type: Desktop App is simplest for dev)
   - Get a refresh token (one-time) using the helper script:
     1) Save your downloaded OAuth client file as `credentials.json` in project root (do NOT commit it)
     2) Run: `node src/getRefreshToken.js` and follow the prompt to authorize
     3) Copy the printed `refresh_token`
   - Copy `.env.example` to `.env` and fill values:
     - `CLIENT_ID` and `CLIENT_SECRET` from your OAuth client
     - `REFRESH_TOKEN` from the step above
     - `REDIRECT_URI` (first redirect URI in your OAuth client; for Desktop App, it will be the default installed URI)

4. Start the servers (two terminals):
```bash
# Terminal A (server)
npm run build && npm run dev

# Terminal B (client)
cd client && npm run dev
```

Server runs on http://localhost:3000 (or PORT in `.env`). The client runs on http://localhost:5173 and proxies `/api` to the server.

## API Usage

### POST /api/generate

Generate a new presentation from text input.

Request body:
```json
{
  "lyrics": "Your text content\nSplit by lines",
  "style": {
    "fontFamily": "Times New Roman",
    "fontSize": 24,
    "backgroundColor": "#ffffff",
    "fontColor": "#000000",
    "isAutoFit": true,
    "isBold": true,
    "isItalic": false,
    "isCentered": true
  }
}
```

Response:
```json
{
  "presentationUrl": "https://docs.google.com/presentation/d/...",
  "slideCount": 2
}
```

## Development

### Available Scripts

- `npm run dev` - Build once and run the server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run type-check` - Check TypeScript types

### Project Structure

- `/src` - Source code
  - `/routes` - Express route handlers
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions and classes
  - `/__tests__` - Test files
  - `getRefreshToken.js` - Helper to obtain OAuth refresh token (dev only)
- `/client` - React + Vite app (Tailwind v4)
  - `src/components/StyleControls.tsx` - UI for styling options

### Styling notes

- Tailwind CSS v4 is configured in the client with `@tailwindcss/postcss` and `@import "tailwindcss"` in `styles.css`.
- The server applies text styles using Google Slides batchUpdate. Auto-fit is implemented via a heuristic to avoid Slides API autofit inconsistencies.

### Security notes

- Never commit secrets. `.env.example` is provided; create your own `.env` locally.
- Keep `credentials.json` and `token.json` out of version control. These files are ignored via `.gitignore`.

## Deployment (Production)

### Recommended: Split Hosting (Render + Vercel)

This approach separates your server and client for optimal performance and simplicity.

#### Server on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Environment Variables**:
     - `CLIENT_ID`: Your Google OAuth client ID
     - `CLIENT_SECRET`: Your Google OAuth client secret
     - `REFRESH_TOKEN`: Your refresh token from `getRefreshToken.js`
     - `REDIRECT_URI`: Your OAuth redirect URI
     - `PORT`: Leave empty (Render auto-assigns) or set to `3000`
4. Deploy and note your server URL (e.g., `https://slidesmaker.onrender.com`)

#### Client on Vercel

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: Your Render server URL (no trailing slash, e.g., `https://slidesmaker.onrender.com`)
4. Deploy

#### Alternative: Client on Netlify

1. Create a new site on [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Configure:
   - **Base Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: Your Render server URL (e.g., `https://slidesmaker.onrender.com`)
4. Deploy

### How It Works

- **Development**: Client uses Vite proxy (`/api` → `http://localhost:3000`)
- **Production**: Client uses `VITE_API_BASE_URL` to call your deployed server
- **Mobile/Desktop**: Works on all devices—the "Desktop app" OAuth type only affects how you obtained the refresh token, not how users access your site
- **Authentication**: Server-side only. Browsers never authenticate with Google; they just call your API

### Testing Production Setup Locally

```bash
# Build both
npm run build
cd client && npm run build && cd ..

# Set production API URL
export VITE_API_BASE_URL=http://localhost:3000

# Start server
node dist/index.js &

# Serve client (using a static server)
npx serve client/dist -p 5173
```

Open http://localhost:5173 and test.

## API Quotas and Limits

The Google Slides API has the following quotas:

- Queries per minute per user: 300
- Queries per minute per project: 1800
- Requests per day per project: 86,400

For more details, see [Google Slides API Quotas](https://developers.google.com/slides/quotas).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm test`)
5. Submit a pull request

## License

[MIT License](LICENSE)