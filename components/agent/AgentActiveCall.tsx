
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';

interface Props {
  lead: Lead | null;
  startTime: number;
  onEndCall: () => void;
}

const CallTimer: React.FC<{ startTime: number }> = ({ startTime }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((now - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <span className="font-mono text-7xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </span>
        <div className="absolute -top-4 -right-4 w-6 h-6 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,1)]"></div>
      </div>
      <div className="mt-8 flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">In-Call Operation</span>
      </div>
    </div>
  );
};

export const AgentActiveCall: React.FC<Props> = ({ lead, startTime, onEndCall }) => {
  return (
    <div className="h-full w-full bg-[#010101] flex flex-col items-center justify-between py-16 md:py-24 px-6 relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-transparent"></div>
      
      <div className="z-10 text-center space-y-4 md:space-y-6">
        <div className="flex justify-center mb-2 md:mb-4">
           <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-600/10 rounded-full border border-indigo-500/30 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
           </div>
        </div>
        <h2 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl">
          {lead?.name || 'ONGOING CALL'}
        </h2>
        <p className="text-xl md:text-2xl text-slate-600 font-mono tracking-[0.4em] font-medium opacity-50">{lead?.phone}</p>
      </div>

      <div className="z-10">
        <CallTimer startTime={startTime} />
      </div>

      <div className="z-10 w-full max-w-sm px-4 flex flex-col items-center gap-6">
         <button 
            onClick={onEndCall} 
            className="w-full py-8 md:py-10 bg-indigo-600 text-white rounded-[2rem] font-black text-sm md:text-lg uppercase tracking-widest shadow-[0_20px_60px_rgba(79,70,229,0.3)] border-b-8 border-indigo-900 active:translate-y-2 active:border-b-0 transition-all neon-indigo"
         >
            STOP & OPEN FORM
         </button>
         
         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center opacity-40">
           Form will auto-open when you disconnect. <br/> Press above if it doesn't.
         </p>
      </div>
    </div>
  );
};
