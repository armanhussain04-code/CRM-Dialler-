
import React from 'react';

interface Props {
  duration: number;
  onMisclick: () => void;
  onForceSubmit: () => void;
}

export const AgentShortCallVerify: React.FC<Props> = ({ duration, onMisclick, onForceSubmit }) => {
  const isGhostCall = duration < 12;

  return (
    <div className="h-full w-full flex items-center justify-center p-6 bg-slate-950">
      <div className={`max-w-md w-full glass p-10 md:p-14 rounded-[4rem] text-center space-y-10 shadow-2xl border-2 animate-in zoom-in duration-300 ${isGhostCall ? 'border-rose-600' : 'border-amber-500/30'}`}>
         <div className="space-y-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 animate-pulse ${isGhostCall ? 'bg-rose-600/10 border-rose-600' : 'bg-amber-600/10 border-amber-600'}`}>
               {isGhostCall ? (
                 <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                 </svg>
               ) : (
                 <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                 </svg>
               )}
            </div>

            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              {isGhostCall ? <span className="text-rose-600">GHOST CALL</span> : 'SHORT CALL'}
            </h2>

            <div className="px-6 py-3 bg-slate-900 rounded-2xl inline-block border border-white/5">
                <span className="text-2xl font-mono text-white font-black">{duration} SECONDS</span>
            </div>

            <div className="space-y-3 px-2">
              <p className="text-sm font-black text-slate-300 uppercase leading-tight tracking-widest">
                {isGhostCall 
                  ? "SYSTEM DETECTED: BAAT NAHI HUI!" 
                  : "SYSTEM CONFIDENCE: LOW"}
              </p>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                {isGhostCall 
                  ? "Aap itni jaldi wapas aa gaye ki baat hona namumkin hai. Is attempt ko 'FAILED' mark kiya ja raha hai." 
                  : "Talk time kam hai. Agar sirf ring gayi thi toh misclick choose karein."}
              </p>
            </div>
         </div>

         <div className="flex flex-col gap-4">
            {!isGhostCall && (
              <button 
                onClick={onForceSubmit}
                className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all active:scale-95"
              >
                Hain, meri baat hui hai
              </button>
            )}
            <button 
               onClick={onMisclick}
               className={`w-full py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 ${isGhostCall ? 'bg-rose-600 text-white shadow-rose-600/20 shadow-xl' : 'bg-white/5 text-slate-500 border border-white/10'}`}
            >
               {isGhostCall ? "BACK TO POOL (FAILED)" : "MISCLICK / NOT CONNECTED"}
            </button>
         </div>
         
         <p className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.2em] italic">
            "Anti-Cheat Authority v3.0 Active. Every second is tracked."
         </p>
      </div>
    </div>
  );
};
