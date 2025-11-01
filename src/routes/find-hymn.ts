import type { Request, Response } from 'express';
import type { FindHymnRequest, FindHymnResponse } from '../types/api.js';

// Gospel Hymns API (Deeper Life Bible Church hymns)
const GOSPEL_HYMNS_API = 'https://gospel-hymns.onrender.com/api/v1';

export async function findHymnHandler(req: Request, res: Response) {
  try {
    const { number, title } = req.body as FindHymnRequest;

    if (!number && !title) {
      return res.status(400).json({ error: 'Either hymn number or title is required.' });
    }

    let hymn: any = null;

    // Search by number first (most common use case)
    if (number) {
      const response = await fetch(`${GOSPEL_HYMNS_API}/hymn/${encodeURIComponent(number)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          hymn = data.data;
        }
      }
    }

    // Search by title if number didn't work or wasn't provided
    if (!hymn && title) {
      const response = await fetch(`${GOSPEL_HYMNS_API}/search/${encodeURIComponent(title)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          hymn = data.data[0]; // Take first match
        }
      }
    }

    if (!hymn) {
      return res.status(404).json({ 
        error: number 
          ? `Hymn #${number} not found. Try a number between 1-260.`
          : `No hymn found matching "${title}".`
      });
    }

    // Format the hymn text
    const verses = hymn.verses || [];
    const chorus = hymn.chorus;
    
    let hymnText = verses.join('\n\n');
    if (chorus) {
      hymnText += '\n\n[Chorus]\n' + chorus;
    }

    const payload: FindHymnResponse = {
      hymn: hymnText,
      title: hymn.title || 'Unknown',
      number: hymn.number || ''
    };

    res.json(payload);
  } catch (err) {
    console.error('Error in find-hymn handler:', err);
    res.status(500).json({ error: 'Failed to fetch hymn' });
  }
}
