import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import path from 'path';

// Load OAuth2 credentials (from your downloaded credentials.json)
const CREDENTIALS_PATH = path.resolve('./credentials.json');
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).installed;

const { client_id, client_secret, redirect_uris } = credentials;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Scopes for Slides + Drive
const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive'
];

// Generate auth URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline', // important to get refresh_token
  scope: SCOPES,
});

console.log('Authorize this app by visiting this URL:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nEnter the code from that page here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    console.log('\nHere are your tokens:');
    console.log(tokens);

    // Optional: save to file for later
    fs.writeFileSync('token.json', JSON.stringify(tokens, null, 2));
    console.log('\nTokens saved to token.json');
  } catch (err) {
    console.error('Error retrieving access token', err);
  }
});