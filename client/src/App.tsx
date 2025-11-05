import React, { useState } from 'react';
import { StyleControls } from './components/StyleControls';
import { SlideStyle, DEFAULT_STYLE } from './types/style';

export default function App() {
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [hymnNumber, setHymnNumber] = useState('');
  const [hymnTitle, setHymnTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'lyrics' | 'hymn'>('lyrics');
  const [style, setStyle] = useState<SlideStyle>(DEFAULT_STYLE);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [hideColdNotice, setHideColdNotice] = useState(false);
  const [finding, setFinding] = useState(false);
  const [result, setResult] = useState<{ presentationUrl: string; slideCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getApiBase = () => import.meta.env.VITE_API_BASE_URL || '';

  // Warm-up/health check logic for Render cold starts
  async function ensureServerAwake(maxMs = 90_000) {
    if (serverReady) return;
    const apiBase = getApiBase();
    const start = Date.now();
    setWaking(true);
    setError(null);
    let attempt = 0;
    while (Date.now() - start < maxMs) {
      try {
        const resp = await fetch(`${apiBase}/api/health`, { method: 'GET' });
        if (resp.ok) {
          setServerReady(true);
          setWaking(false);
          return;
        }
      } catch {
        // ignore and retry
      }
      attempt += 1;
      const delay = Math.min(4000, 500 * attempt); // quick ramp up then cap at 4s
      await new Promise((r) => setTimeout(r, delay));
    }
    setWaking(false);
    throw new Error('Server is taking longer than expected to wake up. Please try again.');
  }

  // Kick off a background health check on initial load
  React.useEffect(() => {
    ensureServerAwake(1_0000).catch(() => {
      // ignore; banner will remain until first success
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFindLyrics() {
    setFinding(true);
    setError(null);
    try {
      if (!title.trim() || !artist.trim()) {
        throw new Error('Please enter both a song title and an artist.');
      }
      await ensureServerAwake();
      const apiBase = getApiBase();
      const resp = await fetch(`${apiBase}/api/find-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to find lyrics');
      setLyrics(data.lyrics || '');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setFinding(false);
    }
  }

  async function handleFindHymn() {
    setFinding(true);
    setError(null);
    try {
      if (!hymnNumber.trim() && !hymnTitle.trim()) {
        throw new Error('Please enter either a hymn number or title.');
      }
      await ensureServerAwake();
      const apiBase = getApiBase();
      const resp = await fetch(`${apiBase}/api/find-hymn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: hymnNumber.trim() || undefined, 
          title: hymnTitle.trim() || undefined 
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to find hymn');
      setLyrics(data.hymn || '');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setFinding(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      await ensureServerAwake();
      // Use VITE_API_BASE_URL in production, fall back to relative path in dev
      const apiBase = getApiBase();
      const resp = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics, style })
      });
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || data.code || 'Unknown')
      setResult(data)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateWithAI() {
    setAiLoading(true);
    setError(null);
    setResult(null);
    try {
      if (!lyrics.trim()) throw new Error('Please provide lyrics or hymn text first.');
      await ensureServerAwake();
      const apiBase = getApiBase();
      // 1) Ask AI for theme suggestion
      const suggestResp = await fetch(`${apiBase}/api/suggest-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics })
      });
      const suggestion = await suggestResp.json();
      if (!suggestResp.ok) throw new Error(suggestion.error || 'Failed to get AI theme suggestion');

      // 2) Merge AI style with current toggles (keep user toggles like bold/italic/center/autoFit/fontSize)
      const aiStyle: SlideStyle = {
        ...style,
        backgroundColor: suggestion.backgroundColor || style.backgroundColor,
        fontColor: suggestion.fontColor || style.fontColor,
        fontFamily: suggestion.fontFamily || style.fontFamily
      };
      setStyle(aiStyle);

      // 3) Generate slides with suggested style and optional title
      const genResp = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics,
          presentationTitle: suggestion.title || undefined,
          style: aiStyle
        })
      });
      const data = await genResp.json();
      if (!genResp.ok) throw new Error(data.error || data.code || 'Unknown');
      setResult(data);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-green-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700 mb-3">
            SlidesMaker
          </h1>
          <p className="text-lg text-gray-700">Transform your lyrics into beautiful presentations</p>
        </header>

        {/* Cold start notice (Render free tier) */}
        {!serverReady && !hideColdNotice && (
          <div className="mb-6 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg shadow-sm flex items-start gap-3">
            <svg className="h-5 w-5 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">Warming up the server (free hosting)</p>
              <p className="text-sm">If the app hasn’t been used recently, it can take 60–90 seconds for the server to wake up. Your first action may take a bit longer.</p>
            </div>
            <button
              onClick={() => setHideColdNotice(true)}
              className="text-amber-700 hover:text-amber-900"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content Area (Left Column) */}
          <div className="md:col-span-2 space-y-6">
            {/* Tabs for Lyrics vs Hymn */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg shadow-lg">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('lyrics')}
                  className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                    activeTab === 'lyrics'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white/40'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                  }`}
                >
                  🎵 Find Song Lyrics
                </button>
                <button
                  onClick={() => setActiveTab('hymn')}
                  className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                    activeTab === 'hymn'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white/40'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                  }`}
                >
                  📖 Find Church Hymn
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'lyrics' ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Song Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Amazing Grace"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                      <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="e.g., John Newton"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button
                        onClick={handleFindLyrics}
                        disabled={finding || !title.trim() || !artist.trim()}
                        className={`w-full p-3 rounded-md font-semibold text-white transition-all duration-200 ${finding || !title.trim() || !artist.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                      >
                        {finding ? 'Finding…' : 'Find Lyrics'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hymn Number</label>
                      <input
                        type="text"
                        value={hymnNumber}
                        onChange={(e) => setHymnNumber(e.target.value)}
                        placeholder="e.g., 127 (1-260)"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Or Hymn Title <span className="text-gray-500 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={hymnTitle}
                        onChange={(e) => setHymnTitle(e.target.value)}
                        placeholder="e.g., Rock of Ages"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <button
                        onClick={handleFindHymn}
                        disabled={finding || (!hymnNumber.trim() && !hymnTitle.trim())}
                        className={`w-full p-3 rounded-md font-semibold text-white transition-all duration-200 ${finding || (!hymnNumber.trim() && !hymnTitle.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-md'}`}
                      >
                        {finding ? 'Finding…' : 'Find Hymn'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg shadow-lg p-4">
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Paste lyrics or text here, each block will become a slide (each block should be a verse or chorus of the song separated by a blank line)..."
                className="w-full h-96 p-6 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white bg-white/50 shadow-inner resize-none text-gray-800 placeholder-gray-500"
              />
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading || waking || !lyrics.trim()}
                className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 transform
                  ${loading || waking || !lyrics.trim() 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-lg hover:scale-105'}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : waking ? 'Waking server…' : 'Generate Slides'}
              </button>

              <button
                onClick={handleGenerateWithAI}
                disabled={aiLoading || waking || !lyrics.trim()}
                className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 transform
                  ${aiLoading || waking || !lyrics.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-lg hover:scale-105'}`}
              >
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI Generating...
                  </span>
                ) : waking ? 'Waking server…' : 'Generate Slides with AI'}
              </button>
            </div>

            {/* Waking overlay */}
            {waking && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
                  <div className="mx-auto mb-3 h-10 w-10 text-blue-600">
                    <svg className="animate-spin h-10 w-10" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Waking the server…</h3>
                  <p className="text-sm text-gray-600">This free hosting plan sleeps when idle. It can take up to 60–90 seconds for the first request.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-5 shadow-md text-red-800 font-medium">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="bg-gradient-to-r from-green-100 to-blue-100 border border-green-300 rounded-lg p-5 shadow-md">
                <p className="text-green-800 font-medium mb-2">✨ Presentation created successfully!</p>
                <p className="text-gray-700">Number of slides: {result.slideCount}</p>
                <a
                  href={result.presentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-blue-700 font-semibold hover:underline"
                >
                  Open presentation →
                </a>
              </div>
            )}
          </div>

          {/* Style Controls (Right Column) */}
          <div className="md:col-span-1">
            <StyleControls style={style} onChange={setStyle} />
          </div>

        </main>
      </div>
    </div>
  );
}
