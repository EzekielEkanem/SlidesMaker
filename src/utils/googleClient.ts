import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive'
];

export class GoogleAPIClient {
  private static instance: GoogleAPIClient;
  private auth: InstanceType<typeof google.auth.OAuth2>;
  private slides = google.slides('v1');
  private drive = google.drive('v3');

  private constructor() {
    this.auth = new google.auth.OAuth2(
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
      auth: this.auth as any,
      requestBody: { title }
    });
    return response.data;
  }

  public async batchUpdate(presentationId: string, requests: any[]) {
    const response: any = await this.slides.presentations.batchUpdate({
      auth: this.auth as any,
      presentationId,
      requestBody: { requests }
    });
    return response.data;
  }

  public async setPermissions(fileId: string) {
    // Make the file editable by anyone with the link (Phase 1 demo behavior)
    const response: any = await this.drive.permissions.create({
      auth: this.auth as any,
      fileId,
      requestBody: {
        type: 'anyone',
        role: 'writer',
        allowFileDiscovery: false
      }
    });
    return response.data;
  }
}