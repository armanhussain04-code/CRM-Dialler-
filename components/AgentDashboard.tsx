
import React, { useState, useMemo } from 'react';
import { Lead, CallOutcome } from '../types.ts';

interface Props {
  leads: Lead[];
  onSubmitResult: (outcome: Partial<CallOutcome>) => Promise<void>;
}

const AgentDashboard: React.FC<Props> = ({ leads, onSubmitResult }) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'outcome'>('idle');
  const [startTime, setStartTime] = useState<number>(0);
  const [duration, setDuration] = useState<string>('0s');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [feedback, setFeedback] = useState('');

  const nextLead = useMemo(() => 
    leads.find(l => String(l.status).toLowerCase() === 'pending'), 
    [leads]
  );

  const handleStartCall = () => {
    if (!nextLead) return;
    window.location.href = `tel:${nextLead.phone}`;
    setStartTime(Date.now());
    setCallState('calling');
  };

  const handleEndCall = () => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    setDuration(`${mins}m ${secs}s`);
    setCallState('outcome');
  };

  const handleFinalSubmit = async () => {
    if (!selectedOutcome || !nextLead) return;
    
    setIsLoading(true);
    try {
      await onSubmitResult({
        leadId: nextLead.id,
        status: selectedOutcome as any,
        notes: feedback || '',
        duration: duration,
        timestamp: new Date().toISOString()
      });

      // Reset state for next lead
      setCallState('idle');
      setSelectedOutcome('');
      setFeedback('');
    } catch (err: any) {
      alert("Database Sync Failed. Check Connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (callState === 'calling') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in zoom-in duration-300 bg-slate-950 bg-mesh relative overflow-hidden">
        <div className="relative">
          <div className="w-40 h-40 bg-indigo-600/20 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-40 h-40 bg-indigo-600 rounded-full flex items-center justify-center relative shadow-[0_0_100px_rgba(79,70,229,0.5)]">
            <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          </div>
        </div>
        <div className="text-center space-y-4 max-w-2xl">
          <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none truncate">{nextLead?.name}</h2>
          <div className="inline-block px-6 py-2 bg-slate-900 border border-white/10 rounded-full">
            <p className="text-2xl text-indigo-400 font-mono tracking-[0.5em]">{nextLead?.phone}</p>
          </div>
        </div>
        <button onClick={handleEndCall} className="px-20 py-10 bg-red-600 hover:bg-red-500 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl border-b-8 border-red-950 active:translate-y-2 active:border-b-0 transition-all">Hang Up & Report</button>
      </div>
    );
  }

  if (callState === 'outcome') {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 bg-slate-950 overflow-y-auto">
        <div className="max-w-md w-full glass p-8 md:p-12 rounded-[4rem] border border-white/10 space-y-10 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">CALL <span className="text-indigo-500 not-italic">REPORT</span></h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 border border-indigo-600/20 rounded-full">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Talk Time: {duration}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'interested', label: 'Interested / Warm', cls: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
              { id: 'not_received', label: 'No Answer / Busy', cls: 'border-indigo-400 text-indigo-400 bg-indigo-400/10' },
              { id: 'not_interested', label: 'Rejected / Dead', cls: 'border-red-500 text-red-500 bg-red-500/10' }
            ].map(o => (
              <button 
                key={o.id} 
                type="button"
                onClick={() => setSelectedOutcome(o.id)} 
                className={`flex items-center justify-between px-8 py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] border-2 transition-all shadow-lg active:scale-95 ${selectedOutcome === o.id ? o.cls + ' ring-4 ring-white/5 border-current' : 'bg-slate-950 border-white/5 text-slate-700 hover:border-white/10'}`}
              >
                <span>{o.label}</span>
                {selectedOutcome === o.id && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-4 tracking-[0.3em]">Interaction Summary</label>
            <textarea 
              placeholder="What was discussed? (Optional)" 
              value={feedback} 
              onChange={e => setFeedback(e.target.value)} 
              className="w-full h-32 bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 text-white text-sm outline-none focus:border-indigo-500 resize-none transition-all shadow-inner placeholder:text-slate-800" 
            />
          </div>

          <button 
            onClick={handleFinalSubmit} 
            disabled={isLoading || !selectedOutcome} 
            className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            {isLoading ? 'SAVING DATA...' : 'FINALIZE & NEXT'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-6 bg-slate-950 bg-mesh relative">
      {nextLead ? (
        <div className="max-w-2xl w-full glass p-12 md:p-20 rounded-[5rem] border border-white/5 text-center space-y-16 shadow-2xl animate-in slide-in-from-bottom-12 duration-700 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/10 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/10 blur-[100px] rounded-full"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-block px-6 py-2 bg-indigo-600/10 border border-indigo-600/20 rounded-full">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Ready To Connect</span>
            </div>
            <h2 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-none truncate uppercase italic">
              {nextLead.name}
            </h2>
            <div className="h-1 w-24 bg-indigo-500 mx-auto rounded-full"></div>
            <p className="text-3xl text-slate-700 font-mono tracking-[0.5em]">{nextLead.phone}</p>
          </div>
          
          <button onClick={handleStartCall} className="group w-full py-16 bg-indigo-600 text-white rounded-[4rem] font-black text-4xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] border-b-[20px] border-indigo-950 active:translate-y-4 active:border-b-0 transition-all relative overflow-hidden">
            <span className="relative z-10">PLACE CALL</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          
          <div className="flex justify-between items-center opacity-40 px-8 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span>Pool Size: {leads.filter(l => l.status === 'pending').length}</span>
            </div>
            <div className="italic">Arman Solutions V2</div>
          </div>
        </div>
      ) : (
        <div className="text-center glass p-24 rounded-[5rem] border-2 border-dashed border-white/5 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">🏆</div>
          <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">MISSION <span className="text-indigo-500 not-italic">ACCOMPLISHED</span></h3>
          <p className="text-[11px] text-slate-700 font-bold uppercase tracking-[0.5em] mt-6">All leads have been processed successfully.</p>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
