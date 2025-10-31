import type { Request, Response } from 'express';
import type { FindLyricsRequest, FindLyricsResponse } from '../types/api.js';

// Use Node 18+/20+ native fetch. Ensure GEMINI_API_KEY is set in env.
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent';

function buildPrompt(title: string, artist: string) {
  return `Please find the complete song lyrics for ${title} by ${artist}.
Return plain text only.
Separate each lyrical section with a single blank line.
Do not include headers like [Chorus] or [Verse].`;
}

export async function findLyricsHandler(req: Request, res: Response) {
  try {
    const { title, artist } = req.body as FindLyricsRequest;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Both title and artist are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const prompt = buildPrompt(title.trim(), artist.trim());

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Gemini API error:', response.status, body);
      return res.status(502).json({ error: 'Failed to fetch lyrics from AI provider.' });
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('').trim();

    if (!text) {
      return res.status(502).json({ error: 'AI response did not include lyrics.' });
    }

    const payload: FindLyricsResponse = { lyrics: text };
    res.json(payload);
  } catch (err) {
    console.error('Error in find-lyrics handler:', err);
    res.status(500).json({ error: 'Failed to find lyrics' });
  }
}
