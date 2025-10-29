# SlidesMaker

A TypeScript-powered service that generates Google Slides presentations from text input. Built with Express and the Google Slides API.

## Features

- Convert text into Google Slides presentations
- Customize fonts, colors, and text sizing
- Auto-fit text to slide dimensions
- Secure Google API integration
- TypeScript throughout

## Setup

1. Clone the repository:
```bash
git clone https://github.com/EzekielEkanem/SlidesMaker.git
cd SlidesMaker
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Cloud credentials:
   - Create a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable the Google Slides API and Google Drive API
   - Create a Service Account and download its JSON key
   - Copy `.env.example` to `.env` and set your credentials:
     ```bash
     cp .env.example .env
     ```
   - Either:
     - Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` with the full JSON content, or
     - Set `GOOGLE_APPLICATION_CREDENTIALS` to point to your JSON key file

4. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000 (or the PORT specified in your .env).

## API Usage

### POST /api/generate

Generate a new presentation from text input.

Request body:
```json
{
  "lyrics": "Your text content\nSplit by lines",
  "style": {
    "fontFamily": "Arial",
    "fontSize": 24,
    "backgroundColor": "#ffffff",
    "fontColor": "#000000",
    "isAutoFit": true
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

- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run type-check` - Check TypeScript types

### Project Structure

- `/src` - Source code
  - `/routes` - Express route handlers
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions and classes
  - `/__tests__` - Test files

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