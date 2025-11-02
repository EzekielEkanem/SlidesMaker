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
  const [finding, setFinding] = useState(false);
  const [result, setResult] = useState<{ presentationUrl: string; slideCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getApiBase = () => import.meta.env.VITE_API_BASE_URL || '';

  async function handleFindLyrics() {
    setFinding(true);
    setError(null);
    try {
      if (!title.trim() || !artist.trim()) {
        throw new Error('Please enter both a song title and an artist.');
      }
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
                disabled={loading || !lyrics.trim()}
                className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 transform
                  ${loading || !lyrics.trim() 
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
                ) : 'Generate Slides'}
              </button>

              <button
                onClick={handleGenerateWithAI}
                disabled={aiLoading || !lyrics.trim()}
                className={`px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 transform
                  ${aiLoading || !lyrics.trim()
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
                ) : 'Generate Slides with AI'}
              </button>
            </div>

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
