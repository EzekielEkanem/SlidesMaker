import React, { useState } from 'react';
import { StyleControls } from './components/StyleControls';
import { SlideStyle, DEFAULT_STYLE } from './types/style';

export default function App() {
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState<SlideStyle>(DEFAULT_STYLE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ presentationUrl: string; slideCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch('/api/generate', {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">SlidesMaker</h1>
          <p className="text-gray-600">Transform your lyrics into beautiful presentations</p>
        </header>

        <main className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste lyrics or text here, each block will become a slide..."
              className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <StyleControls style={style} onChange={setStyle} />

          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={loading || !lyrics.trim()}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors
                ${loading || !lyrics.trim() 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}`}
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
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 mb-2">✨ Presentation created successfully!</p>
              <p className="text-gray-600">Number of slides: {result.slideCount}</p>
              <a
                href={result.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Open presentation →
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
