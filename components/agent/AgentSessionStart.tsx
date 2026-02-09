
import React from 'react';

interface Props {
  onStart: (targetTab: 'pool' | 'interested' | 'call_back') => void;
  interestedCount: number;
  callbackCount: number;
}

export const AgentSessionStart: React.FC<Props> = ({ onStart, interestedCount, callbackCount }) => {
  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-6 bg-slate-950 overflow-y-auto">
      <div className="max-w-4xl w-full glass p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-center space-y-8 md:space-y-12 shadow-2xl relative z-10 border border-white/5 animate-in zoom-in duration-500 my-4">
         <div className="space-y-3 md:space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-indigo-500/20">
               <svg className="w-8 h-8 md:w-10 md:h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
               </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-tight">ARMAN<br/><span className="text-indigo-500 not-italic">COMMAND</span></h2>
            <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Select operation to begin</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <button 
               onClick={() => onStart('pool')}
               className="flex flex-col items-center justify-center py-10 md:py-14 bg-indigo-600 text-white rounded-3xl md:rounded-[2.5rem] font-black group active:scale-95 transition-all shadow-2xl neon-indigo border-b-8 border-indigo-900"
            >
               <span className="text-[10px] md:text-sm uppercase tracking-widest mb-1 md:mb-2 opacity-70">Operation</span>
               <span className="text-xl md:text-2xl uppercase tracking-widest">START NEW</span>
            </button>

            <button 
               onClick={() => onStart('interested')}
               className="flex flex-col items-center justify-center py-8 md:py-14 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-3xl md:rounded-[2.5rem] hover:bg-emerald-600 hover:text-white transition-all group active:scale-95 shadow-xl"
            >
               <span className="text-3xl md:text-4xl font-black mb-1">{interestedCount}</span>
               <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">INTERESTED</span>
            </button>

            <button 
               onClick={() => onStart('call_back')}
               className="flex flex-col items-center justify-center py-8 md:py-14 bg-amber-600/10 border border-amber-500/20 text-amber-500 rounded-3xl md:rounded-[2.5rem] hover:bg-amber-600 hover:text-white transition-all group active:scale-95 shadow-xl"
            >
               <span className="text-3xl md:text-4xl font-black mb-1">{callbackCount}</span>
               <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">CALL BACK</span>
            </button>
         </div>
         
         <div className="pt-4 md:pt-6 border-t border-white/5">
            <p className="text-[8px] md:text-[9px] text-slate-700 font-bold uppercase tracking-widest">Arman v3.0 Stable • Cloud Sync Active</p>
         </div>
      </div>
    </div>
  );
};
