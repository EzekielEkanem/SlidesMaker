import request from 'supertest';
import express from 'express';
import { generateHandler } from '../routes/generate.js';
import { jest } from '@jest/globals';
import * as GoogleModule from '../utils/googleClient.js';

// Create a simple mock client and replace the static getInstance method
const mockClient: any = {
  createPresentation: async () => ({ presentationId: 'test-id' }),
  batchUpdate: async () => ({}),
  setPermissions: async () => ({})
};

// Replace the real getInstance with our mock before tests run
beforeAll(() => {
  // In ESM environments the import gives a live binding; override the static method
  // cast to any so TypeScript doesn't complain about assignment to a readonly/static
  (GoogleModule as any).GoogleAPIClient.getInstance = () => (mockClient as any);
});

describe('POST /api/generate', () => {
  const app = express();
  app.use(express.json());
  app.post('/api/generate', generateHandler);

  // Set up test environment
  beforeEach(() => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: '123456789',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com'
    });
  });

  it('should create a presentation with valid lyrics', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        lyrics: 'Test lyrics\nSecond line'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('presentationUrl');
    expect(response.body).toHaveProperty('slideCount', 1);
    expect(response.body.presentationUrl).toMatch(/^https:\/\/docs\.google\.com\/presentation\/d\/.+\/edit$/);
  });

  it('should handle missing lyrics', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Lyrics are required and must be a string');
  });

  it('should handle empty lyrics', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ lyrics: '' });

  expect(response.status).toBe(400);
  // The handler rejects empty string as invalid input
  expect(response.body).toHaveProperty('error', 'Lyrics are required and must be a string');
  });

  it('should apply style options when provided', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        lyrics: 'Test lyrics',
        style: {
          fontFamily: 'Arial',
          fontSize: 24,
          backgroundColor: '#ffffff',
          fontColor: '#000000',
          isAutoFit: true
        }
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('presentationUrl');
    expect(response.body).toHaveProperty('slideCount', 1);
  });
});