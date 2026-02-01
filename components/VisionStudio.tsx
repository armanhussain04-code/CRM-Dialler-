
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

const VisionStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<{url: string, prompt: string}[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const url = await generateImage(prompt, aspectRatio);
      if (url) {
        setImages(prev => [{ url, prompt }, ...prev]);
        setPrompt('');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold gradient-text">Vision Studio</h2>
        <p className="text-slate-400 text-sm">Generate high-quality imagery with Gemini 2.5 Flash Image</p>
      </div>

      <div className="glass p-6 rounded-2xl border border-slate-700 mb-8 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic shot of a neon cyberpunk city in the rain, ultra-detailed, 8k..."
            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Aspect Ratio</label>
            <div className="flex gap-2">
              {(["1:1", "16:9", "9:16"] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    aspectRatio === ratio ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-10 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, i) => (
          <div key={i} className="group relative glass rounded-2xl overflow-hidden border border-slate-700 transition-transform hover:scale-[1.02]">
            <img src={img.url} alt={img.prompt} className="w-full h-auto aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <p className="text-xs text-slate-200 line-clamp-2">{img.prompt}</p>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="aspect-square glass rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-slate-400 font-medium">Painting your vision...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionStudio;
