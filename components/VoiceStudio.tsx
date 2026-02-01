
import React, { useState, useRef } from 'react';
import { generateSpeech, decode, decodeAudioData } from '../services/geminiService';

const VoiceStudio: React.FC = () => {
  const [text, setText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const audioContextRef = useRef<AudioContext | null>(null);

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  const handleSynthesize = async () => {
    if (!text.trim() || isSynthesizing) return;

    setIsSynthesizing(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioData = await generateSpeech(text, voice);
      if (audioData) {
        const decodedBytes = decode(audioData);
        const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (err) {
      console.error(err);
      alert("Speech synthesis failed.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold gradient-text">Voice Studio</h2>
        <p className="text-slate-400 text-sm">Natural text-to-speech with Gemini 2.5 Flash TTS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-700">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Input Script</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to bring to life..."
              className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none mb-4"
            />
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3"
            >
              {isSynthesizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Synthesizing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Speak Text
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-700">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Select Voice
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {voices.map(v => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    voice === v 
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-medium">{v}</span>
                  {voice === v && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-700">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Voice Preview</h4>
            <p className="text-sm text-slate-400 italic">"The future of creativity is collaborative. Let's build something extraordinary together."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceStudio;
