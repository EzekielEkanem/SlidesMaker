import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { generateHandler } from './routes/generate.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware - CORS must come before other middleware
app.use(cors({
  origin: true, // Allow all origins in development/demo
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/generate', generateHandler);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  console.error('Stack trace:', err.stack);
  
  // Check if it's a Google API error
  const googleError = err as any;
  if (googleError.code === 401 || googleError.status === 401) {
    return res.status(500).json({
      error: 'Google API authentication failed. Check your OAuth credentials (CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN/REDIRECT_URI).',
      details: googleError.message
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});