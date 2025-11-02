import type { Request, Response } from 'express';
import type { SuggestThemeRequest, SuggestThemeResponse } from '../types/api.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent';

function buildPrompt(lyrics: string) {
  const clipped = lyrics.length > 4000 ? lyrics.slice(0, 4000) + '\n…' : lyrics;
  return `Analyze the mood and content of the following lyrics and suggest a slide theme.
Return STRICT JSON only with the shape: {"backgroundColor":"#RRGGBB","fontColor":"#RRGGBB","fontFamily":"<font>","title":"<short title>"}.
Rules:
- Ensure strong contrast (WCAG AA or better) between backgroundColor and fontColor.
- Use a common, safe font family from this list: Arial, Helvetica, Georgia, "Times New Roman", Verdana, Tahoma, "Trebuchet MS", "Courier New", Montserrat, Roboto.
- Colors must be hex format like #RRGGBB.
- Title should be short (<= 60 chars), descriptive, and based on the lyrics mood/theme.
- Respond with JSON ONLY, no prose, no code fences.

Lyrics:
---
${clipped}
---`;
}

export async function suggestThemeHandler(req: Request, res: Response) {
  try {
    const { lyrics } = req.body as SuggestThemeRequest;
    if (!lyrics || typeof lyrics !== 'string' || !lyrics.trim()) {
      return res.status(400).json({ error: 'lyrics is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const prompt = buildPrompt(lyrics);

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
      console.error('Gemini API error (theme):', response.status, body);
      return res.status(502).json({ error: 'Failed to get theme suggestion from AI.' });
    }

    const data: any = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('').trim();

    if (!raw) {
      return res.status(502).json({ error: 'AI response did not include a suggestion.' });
    }

    // Try to extract JSON from the response safely
    const jsonText = extractJson(raw);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse AI JSON:', raw);
      return res.status(502).json({ error: 'AI returned an invalid JSON suggestion.' });
    }

    const result: SuggestThemeResponse = {
      backgroundColor: parsed.backgroundColor,
      fontColor: parsed.fontColor,
      fontFamily: parsed.fontFamily,
      title: parsed.title
    };

    // Basic validation of colors
    const hex = /^#([0-9a-fA-F]{6})$/;
    if (!hex.test(result.backgroundColor) || !hex.test(result.fontColor)) {
      return res.status(502).json({ error: 'AI suggestion did not include valid hex colors.' });
    }

    if (!result.fontFamily || typeof result.fontFamily !== 'string') {
      return res.status(502).json({ error: 'AI suggestion did not include a valid font family.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error in suggest-theme handler:', err);
    res.status(500).json({ error: 'Failed to suggest theme' });
  }
}

function extractJson(text: string): string {
  // If the model returns extra prose, extract the first JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}
