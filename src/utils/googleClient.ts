import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive'
];

export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private auth: OAuth2Client;
  private slides = google.slides('v1');
  private drive = google.drive('v3');

  private constructor() {
    this.auth = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    this.auth.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN ?? null
    });
  }

  public static getInstance(): GoogleAPIClient {
    if (!GoogleAPIClient.instance) {
      GoogleAPIClient.instance = new GoogleAPIClient();
    }
    return GoogleAPIClient.instance;
  }

  public async createPresentation(title: string) {
    const response: any = await this.slides.presentations.create({
      auth: this.auth,
      requestBody: { title }
    });
    return response.data;
  }

  public async batchUpdate(presentationId: string, requests: any[]) {
    const response: any = await this.slides.presentations.batchUpdate({
      auth: this.auth,
      presentationId,
      requestBody: { requests }
    });
    return response.data;
  }

  public async setPermissions(fileId: string) {
    const response: any = await this.drive.permissions.create({
      auth: this.auth,
      fileId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: 'ezekiel.een111@gmail.com'
      }
    });
    return response.data;
  }
}