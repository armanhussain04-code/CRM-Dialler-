
import React, { useState, useMemo } from 'react';
import { verifyNoteQuality } from '../../services/geminiService';

interface Props {
  duration: string;
  durationSeconds: number;
  initialName?: string;
  onSubmit: (status: string, notes: string, name: string) => Promise<void>;
  onBack?: () => void;
  isLoading: boolean;
}

export const AgentOutcomeForm: React.FC<Props> = ({ duration, durationSeconds, initialName = '', onSubmit, onBack, isLoading: externalLoading }) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [customerName, setCustomerName] = useState(initialName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Label changed back to 'CALL BACK' from 'CB'
  const outcomes = [
    { id: 'interested', label: 'INTERESTED', icon: '💎', activeBg: 'bg-emerald-600', border: 'border-emerald-500' },
    { id: 'call_back', label: 'CALL BACK', icon: '⏳', activeBg: 'bg-amber-600', border: 'border-amber-500' },
    { id: 'complete', label: 'SUCCESS', icon: '✅', activeBg: 'bg-indigo-600', border: 'border-indigo-500' },
    { id: 'not_received', label: 'NOT ANSWERED', icon: '📵', activeBg: 'bg-slate-700', border: 'border-slate-500' },
    { id: 'not_interested', label: 'NOT INTERESTED', icon: '❌', activeBg: 'bg-rose-600', border: 'border-rose-500' }
  ];

  const minNoteLength = useMemo(() => {
    if (durationSeconds > 180) return 20; 
    if (durationSeconds > 60) return 5;  
    return 0;
  }, [durationSeconds]);

  const isNoteTooShort = feedback.trim().length < minNoteLength;
  const isLoading = externalLoading || isProcessing;
  const canSubmit = selectedOutcome && !isNoteTooShort && !isLoading;

  const handleFormSubmit = async () => {
    setErrorMsg(null);
    if (durationSeconds > 60 && feedback.trim()) {
      setIsProcessing(true);
      try {
        const audit = await verifyNoteQuality(feedback, duration);
        if (!audit.isValid) {
          setErrorMsg(audit.reason || "Please provide professional notes.");
          setIsProcessing(false);
          return;
        }
      } catch (err) { }
      setIsProcessing(false);
    }
    await onSubmit(selectedOutcome, feedback, customerName);
  };

  return (
    <div className="h-full w-full flex flex-col items-center bg-slate-950 p-4 md:p-10 overflow-y-auto">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header - Very Simple */}
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Call Report</h2>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Talk Time: {duration}</p>
             {onBack && (
               <button onClick={onBack} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase mt-1">Cancel</button>
             )}
          </div>
        </div>

        {/* Customer Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Customer Name</label>
          <input 
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-5 text-white text-lg font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
            placeholder="Update Name..."
          />
        </div>

        {/* Outcome Selection - Simple Highlight Buttons */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Select Result</label>
          <div className="grid grid-cols-1 gap-2">
            {outcomes.map(o => (
              <button 
                key={o.id}
                onClick={() => { setSelectedOutcome(o.id); if (window.navigator.vibrate) window.navigator.vibrate(50); }}
                className={`flex items-center justify-between px-8 py-6 rounded-2xl border-2 transition-all duration-150 active:scale-95 ${
                  selectedOutcome === o.id 
                    ? `${o.activeBg} border-white/20 text-white shadow-2xl` 
                    : `bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800`
                }`}
              >
                <div className="flex items-center gap-5">
                  <span className="text-2xl">{o.icon}</span>
                  <span className="font-black text-sm tracking-[0.1em] uppercase">{o.label}</span>
                </div>
                {selectedOutcome === o.id && (
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Summary / Notes */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Conversation Summary</label>
            {minNoteLength > 0 && (
              <span className={`text-[9px] font-bold ${isNoteTooShort ? 'text-rose-500' : 'text-emerald-500'}`}>
                {feedback.length} / {minNoteLength} min
              </span>
            )}
          </div>
          <textarea 
            value={feedback}
            onChange={e => { setFeedback(e.target.value); setErrorMsg(null); }}
            placeholder="Important points about the customer..."
            className={`w-full h-36 bg-slate-900 border rounded-3xl p-6 text-white text-sm font-medium outline-none transition-all resize-none ${
              errorMsg ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-white/5 focus:border-indigo-500'
            }`}
          />
          {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">{errorMsg}</p>}
        </div>

        {/* Final Button */}
        <button 
          onClick={handleFormSubmit}
          disabled={!canSubmit}
          className={`w-full py-8 rounded-[2rem] font-black text-sm uppercase tracking-[0.5em] transition-all shadow-2xl mb-12 ${
            canSubmit 
              ? 'bg-white text-black hover:bg-slate-200 active:translate-y-1' 
              : 'bg-slate-900 text-slate-700 opacity-50 cursor-not-allowed'
          }`}
        >
          {isProcessing ? 'PROCESSING...' : 'SAVE & CONTINUE'}
        </button>

      </div>
    </div>
  );
};
