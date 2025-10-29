import request from 'supertest';
import express from 'express';
import { generateHandler } from '../routes/generate.js';

describe('End-to-end tests', () => {
  const app = express();
  app.use(express.json());
  app.post('/api/generate', generateHandler);

  // Skip this test if no service account is configured
  const hasServiceAccount = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  (hasServiceAccount ? it : it.skip)('should create a real presentation', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        lyrics: 'Test verse 1\n\nTest verse 2',
        style: {
          fontFamily: 'Arial',
          backgroundColor: '#ffffff',
          fontColor: '#000000'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('presentationUrl');
    expect(response.body.presentationUrl).toMatch(/https:\/\/docs\.google\.com\/presentation/);
  }, 10000); // Increased timeout for API calls
});