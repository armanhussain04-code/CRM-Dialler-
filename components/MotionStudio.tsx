
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const MotionStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      // Fallback for non-framed environment
      setHasApiKey(true);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setVideoUrl(null);
    setStatusMessage('Initiating video sequence...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setStatusMessage('Directing scenes... (This may take a minute)');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      setStatusMessage('Finalizing render...');
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("API Key error. Please re-select your key.");
      } else {
        alert("Video generation failed. Please try again later.");
      }
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/50">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2">Video Generation Requires a Key</h2>
          <p className="text-slate-400 mb-6">Veo generation requires a paid Google AI Studio API key. Please select a valid key from your project.</p>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-sm block mb-4 underline"
          >
            Learn about billing and keys
          </a>
          <button
            onClick={handleOpenKeySelector}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold gradient-text">Motion Studio</h2>
        <p className="text-slate-400 text-sm">Cinematic video generation with Veo 3.1 Fast</p>
      </div>

      <div className="glass p-6 rounded-2xl border border-slate-700 mb-8 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Director's Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A sweeping drone shot of a lush tropical island at sunset, cinematic lighting, 4k..."
            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? 'Rendering...' : 'Action! (Generate)'}
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
        {videoUrl ? (
          <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
        ) : isGenerating ? (
          <div className="text-center space-y-4 z-10">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-slate-200">{statusMessage}</p>
            <p className="text-sm text-slate-500">Video generation typically takes 1-2 minutes.</p>
          </div>
        ) : (
          <div className="text-center text-slate-500">
            <svg className="w-20 h-20 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>Your cinematic masterpiece will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotionStudio;
