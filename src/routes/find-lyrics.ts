import type { Request, Response } from 'express';
import type { FindLyricsRequest, FindLyricsResponse } from '../types/api.js';

// lyrics.ovh API - free, no key required, full lyrics
const LYRICS_OVH_BASE = 'https://api.lyrics.ovh/v1';

export async function findLyricsHandler(req: Request, res: Response) {
  try {
    const { title, artist } = req.body as FindLyricsRequest;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Both title and artist are required.' });
    }

    const artistEncoded = encodeURIComponent(artist.trim());
    const titleEncoded = encodeURIComponent(title.trim());
    const url = `${LYRICS_OVH_BASE}/${artistEncoded}/${titleEncoded}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ 
          error: `Lyrics not found for "${title}" by ${artist}. Please check spelling or try a different song.` 
        });
      }
      return res.status(502).json({ error: 'Failed to fetch lyrics from lyrics.ovh' });
    }

    const data: any = await response.json();
    const lyricsText = data?.lyrics;

    if (!lyricsText || typeof lyricsText !== 'string') {
      return res.status(404).json({ error: 'Lyrics not found in response.' });
    }

    // Normalize and clean up the lyrics
    let cleaned = lyricsText.trim();
    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');
    // Collapse excessive blank lines (>2 newlines) into exactly 2 (one blank line)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    const payload: FindLyricsResponse = { lyrics: cleaned };
    res.json(payload);
  } catch (err) {
    console.error('Error in find-lyrics handler:', err);
    res.status(500).json({ error: 'Failed to find lyrics' });
  }
}
