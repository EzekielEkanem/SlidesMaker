# SlidesMaker

A full-stack web application that transforms lyrics and text into beautiful Google Slides presentations with customizable styling and AI-powered theme suggestions.

**Live Demo**: [Your deployed URL here]

## Overview

SlidesMaker is a modern web application built with:
- **Backend**: Node.js + Express + TypeScript (deployed on Render)
- **Frontend**: React + Vite + Tailwind CSS v4 (deployed on Vercel)
- **APIs**: Google Slides API, Google Drive API, lyrics.ovh, Gemini AI

## Features

### Core Functionality
- ✨ **Convert text to Google Slides presentations** - Automatically split content by blank lines into separate slides
- 🎨 **Rich styling controls** - Customize fonts, colors, bold/italic, center alignment, and auto-fit text sizing
- 🤖 **AI-powered theme suggestions** - Get intelligent color, font, and title recommendations based on your content
- 🎵 **Find song lyrics** - Search for song lyrics by title and artist using the free lyrics.ovh API
- 📖 **Church hymn search** - Access Deeper Life Bible Church hymns (1-260) with automatic chorus repetition after each verse
- 🔒 **Secure OAuth2 integration** - Google authentication handled entirely server-side
- 📱 **Responsive design** - Works seamlessly on desktop, tablet, and mobile devices
- 🚀 **TypeScript throughout** - Type-safe code from frontend to backend

### Smart Features
- **Auto-fit text sizing** - Server-side heuristic ensures text fits perfectly on slides
- **Verse separation** - Intelligent blank-line handling for proper slide splitting
- **Chorus interpolation** - For hymns, automatically inserts chorus after each verse
- **Real-time preview** - See your lyrics/text before generating slides
- **Tabbed interface** - Easy switching between song lyrics and hymn search

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
     - `GEMINI_API_KEY` from [Google AI Studio](https://makersuite.google.com/app/apikey) (for AI theme suggestions)

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

**Request body:**
```json
{
  "lyrics": "Your text content\n\nSeparate verses with blank lines",
  "presentationTitle": "My Amazing Presentation",
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

**Response:**
```json
{
  "presentationUrl": "https://docs.google.com/presentation/d/...",
  "slideCount": 3
}
```

### POST /api/find-lyrics

Search for song lyrics using the free lyrics.ovh API.

**Request body:**
```json
{
  "title": "Bohemian Rhapsody",
  "artist": "Queen"
}
```

**Response:**
```json
{
  "lyrics": "Is this the real life?\nIs this just fantasy?\n\nCaught in a landslide..."
}
```

### POST /api/find-hymn

Search for Deeper Life Bible Church hymns by number (1-260) or title.

**Request body:**
```json
{
  "number": "127",
  "title": "Rock of Ages"
}
```

**Response:**
```json
{
  "hymn": "Rock of Ages, cleft for me...\n\n[Chorus]\nLet me hide myself in Thee...",
  "title": "Rock of Ages",
  "number": "127"
}
```

### POST /api/suggest-theme

Get AI-powered theme suggestions based on lyrics content.

**Request body:**
```json
{
  "lyrics": "Your song lyrics or text content here"
}
```

**Response:**
```json
{
  "backgroundColor": "#1a1a2e",
  "fontColor": "#eaeaea",
  "fontFamily": "Montserrat",
  "title": "Midnight Dreams"
}
```

## Development

### Available Scripts

- `npm run dev` - Build once and run the server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run type-check` - Check TypeScript types

### Project Structure

```
SlidesMaker/
├── src/                          # Server source code (Node.js + Express + TypeScript)
│   ├── routes/                   # API route handlers
│   │   ├── generate.ts          # Generate Google Slides presentation
│   │   ├── find-lyrics.ts       # Search song lyrics (lyrics.ovh API)
│   │   ├── find-hymn.ts         # Search church hymns (gospel-hymns API)
│   │   └── suggest-theme.ts     # AI theme suggestions (Gemini API)
│   ├── types/                   # TypeScript type definitions
│   │   ├── api.ts               # API request/response types
│   │   └── slides.ts            # Google Slides API types
│   ├── utils/                   # Utility functions and classes
│   │   ├── googleClient.ts      # Google APIs OAuth2 client
│   │   └── color.ts             # Color conversion utilities
│   ├── __tests__/               # Server tests (Jest)
│   ├── index.ts                 # Express server entry point
│   └── getRefreshToken.js       # Helper to obtain OAuth refresh token (dev only)
├── client/                       # Frontend (React + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   └── StyleControls.tsx  # UI controls for slide styling
│   │   ├── types/
│   │   │   └── style.ts          # Frontend style types
│   │   ├── App.tsx               # Main application component (tabbed interface)
│   │   ├── main.tsx              # React app entry point
│   │   └── styles.css            # Tailwind CSS v4 styles
│   ├── index.html                # HTML template
│   └── vite.config.ts            # Vite configuration
├── .env.example                  # Environment variables template
├── tsconfig.json                 # Server TypeScript config
└── package.json                  # Server dependencies and scripts
```

### Styling notes

- **Tailwind CSS v4**: Configured in the client with `@tailwindcss/postcss` and `@import "tailwindcss"` in `styles.css`
- **Server-side styling**: Text styles applied using Google Slides `batchUpdate` API
- **Auto-fit implementation**: Server-side heuristic calculates font size based on text length and line count to avoid Slides API autofit inconsistencies
- **Available fonts**: Arial, Roboto, Montserrat, Open Sans, Lato, Georgia, Times New Roman
- **Gradient backgrounds**: Support for hex color backgrounds and font colors with high-contrast validation

### How the Web App Works

1. **User inputs lyrics/text**: Via manual entry, song search (lyrics.ovh), or hymn search (gospel-hymns API)
2. **Optional AI suggestions**: Click "Generate Slides with AI" to get theme recommendations from Gemini
3. **Customize styling**: Use the StyleControls panel to adjust fonts, colors, and formatting
4. **Generate slides**: Server creates a Google Slides presentation in your Drive using OAuth2
5. **Share**: Presentation is automatically set to "anyone with link can edit"

### Architecture

- **Client-Server separation**: Frontend (Vercel) and backend (Render) deployed independently
- **Server-side authentication**: All Google API calls happen on the server; client never handles credentials
- **CORS configuration**: Explicit CORS headers allow cross-origin requests from Vercel to Render
- **External APIs**:
  - **lyrics.ovh**: Free lyrics API, no key required
  - **gospel-hymns API**: Deeper Life Bible Church hymns database
  - **Gemini AI**: Theme suggestions based on content analysis

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
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables** (add all of these):
     - `CLIENT_ID`: Your Google OAuth client ID
     - `CLIENT_SECRET`: Your Google OAuth client secret
     - `REFRESH_TOKEN`: Your refresh token from `getRefreshToken.js`
     - `REDIRECT_URI`: Your OAuth redirect URI
     - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
     - `PORT`: Leave empty (Render auto-assigns) or set to `3000`
4. Deploy and note your server URL (e.g., `https://slidesmaker.onrender.com`)

**Important Notes:**
- Render automatically runs `npm install` before the build command
- TypeScript and type definitions are now in `dependencies` (not `devDependencies`) to ensure they're available during build
- The `.nvmrc` file pins Node to version 20.x for stability

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

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Google APIs** - Slides API v1, Drive API v3
- **OAuth2** - Secure authentication
- **Jest** - Testing framework

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript** - Type-safe components

### External APIs
- **lyrics.ovh** - Free lyrics search (no API key required)
- **gospel-hymns API** - Deeper Life Bible Church hymns database
- **Gemini AI** - AI-powered theme suggestions

### Deployment
- **Render** - Server hosting (Node.js)
- **Vercel** - Frontend hosting (React)
- **GitHub** - Version control and CI/CD

## API Quotas and Limits

### Google Slides API
- Queries per minute per user: 300
- Queries per minute per project: 1,800
- Requests per day per project: 86,400
- For more details, see [Google Slides API Quotas](https://developers.google.com/slides/quotas)

### External APIs
- **lyrics.ovh**: No documented rate limits (free tier)
- **gospel-hymns API**: No authentication required
- **Gemini API**: Free tier includes 60 requests per minute

## Troubleshooting

### Common Issues

**"OAuth authentication failed"**
- Verify `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, and `REDIRECT_URI` in your `.env`
- Regenerate refresh token using `node src/getRefreshToken.js`
- Ensure Google Slides API and Drive API are enabled in Google Cloud Console

**"Lyrics not found"**
- Check spelling of song title and artist name
- Try variations (e.g., "feat." vs "featuring")
- Some songs may not be in the lyrics.ovh database

**"CORS error" in production**
- Verify `VITE_API_BASE_URL` is set correctly in Vercel (no trailing slash)
- Check that Render server has CORS configured to allow your Vercel domain

**"Failed to generate presentation"**
- Check Google API quotas haven't been exceeded
- Verify the presentation title doesn't contain invalid characters
- Ensure lyrics text is not empty

**Client can't reach server in development**
- Make sure server is running on port 3000: `npm run dev`
- Check Vite proxy configuration in `client/vite.config.ts`

## What's the Difference?

**Website vs Web Application vs Desktop App:**

- **Website**: Static pages with mostly content (like a blog). Limited interactivity. Example: Wikipedia, news sites.
- **Web Application (Webapp)**: Interactive software running in a browser with dynamic features. SlidesMaker is a webapp—it has a React frontend, Node.js backend, APIs, and performs complex operations.
- **Desktop Application**: Standalone software installed on your computer (like Microsoft Word). Runs natively without a browser.

**SlidesMaker is a full-stack web application** with client-server architecture deployed on the cloud.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (`npm test`)
5. Submit a pull request

## License

[MIT License](LICENSE)