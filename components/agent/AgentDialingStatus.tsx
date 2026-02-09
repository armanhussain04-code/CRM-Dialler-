
import React from 'react';

interface Props {
  onStartTimer: () => void;
  onCancel: () => void;
}

export const AgentDialingStatus: React.FC<Props> = ({ onStartTimer, onCancel }) => {
  return (
    <div className="h-full w-full bg-[#010101] flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in duration-300">
       <div className="text-center space-y-6">
          <h3 className="text-white text-3xl font-black uppercase italic tracking-tighter">DIALER OPENED</h3>
          <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-2">
             <p className="text-indigo-400 text-[11px] font-black uppercase tracking-widest">Next Step:</p>
             <p className="text-slate-300 text-sm leading-relaxed">
                As soon as the call connects, return to this app and press the button below to track duration.
             </p>
          </div>
       </div>
       <div className="w-full max-w-sm space-y-4">
          <button 
             onClick={onStartTimer}
             className="w-full py-12 bg-indigo-600 text-white rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_20px_50px_rgba(79,70,229,0.3)] border-b-[12px] border-indigo-900 active:translate-y-2 active:border-b-4 transition-all"
          >
             START TIMER NOW
          </button>
          <button 
             onClick={onCancel}
             className="w-full py-4 text-slate-600 font-bold uppercase tracking-widest text-[11px]"
          >
             Wrong Entry? Go Back
          </button>
       </div>
    </div>
  );
};
