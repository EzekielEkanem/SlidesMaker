import type { Request, Response } from 'express';
import type { FindLyricsRequest, FindLyricsResponse } from '../types/api.js';

// Musixmatch API
const MM_BASE = 'https://api.musixmatch.com/ws/1.1';

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.append(k, String(v));
  }
  return sp.toString();
}

function sanitizeLyrics(raw: string) {
  // Normalize newlines and remove common Musixmatch disclaimers/truncation markers
  let text = raw.replace(/\r\n/g, '\n');
  // Remove everything after the first disclaimer or truncation marker
  const cutMarkers = [
    '******* This Lyrics is NOT for Commercial use *******',
    '...\n',
    '...'
  ];
  for (const marker of cutMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      text = text.slice(0, idx);
    }
  }
  // Strip residual disclaimer lines
  text = text
    .split('\n')
    .filter((line) =>
      !/This Lyrics is NOT for Commercial use/i.test(line) &&
      !/Musixmatch/i.test(line)
    )
    .join('\n');

  // Collapse >2 consecutive newlines into exactly 2 (blank line separator)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

export async function findLyricsHandler(req: Request, res: Response) {
  try {
    const { title, artist } = req.body as FindLyricsRequest;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Both title and artist are required.' });
    }

    const apiKey = process.env.MUSIXMATCH_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'MUSIXMATCH_API_KEY is not configured on the server.' });
    }

    const q_track = title.trim();
    const q_artist = artist.trim();

    // 1) Try direct matcher.lyrics.get
    let lyricsText: string | null = null;
    {
      const url = `${MM_BASE}/matcher.lyrics.get?${qs({ format: 'json', q_track, q_artist, apikey: apiKey })}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data: any = await resp.json();
        const status = data?.message?.header?.status_code;
        const body = data?.message?.body;
        const raw = body?.lyrics?.lyrics_body as string | undefined;
        if (status === 200 && raw) {
          lyricsText = sanitizeLyrics(raw);
        }
      }
    }

    // 2) Fallback: track.search -> track.lyrics.get
    if (!lyricsText) {
      const searchUrl = `${MM_BASE}/track.search?${qs({
        format: 'json',
        q_track,
        q_artist,
        f_has_lyrics: 1,
        s_track_rating: 'desc',
        page_size: 1,
        apikey: apiKey
      })}`;
      const sResp = await fetch(searchUrl);
      if (sResp.ok) {
        const sData: any = await sResp.json();
        const list = sData?.message?.body?.track_list as any[] | undefined;
        const first = Array.isArray(list) && list.length > 0 ? list[0]?.track : undefined;
        const track_id = first?.track_id;
        if (track_id) {
          const lyrUrl = `${MM_BASE}/track.lyrics.get?${qs({ format: 'json', track_id, apikey: apiKey })}`;
          const lResp = await fetch(lyrUrl);
          if (lResp.ok) {
            const lData: any = await lResp.json();
            const raw = lData?.message?.body?.lyrics?.lyrics_body as string | undefined;
            if (raw) lyricsText = sanitizeLyrics(raw);
          }
        }
      }
    }

    if (!lyricsText) {
      return res.status(404).json({ error: 'Lyrics not found for the specified title and artist.' });
    }

    const payload: FindLyricsResponse = { lyrics: lyricsText };
    res.json(payload);
  } catch (err) {
    console.error('Error in find-lyrics handler:', err);
    res.status(500).json({ error: 'Failed to find lyrics' });
  }
}
