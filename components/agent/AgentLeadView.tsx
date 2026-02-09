
import React from 'react';
import { Lead } from '../../types';

interface Props {
  lead: Lead | null;
  onDial: (lead?: Lead) => void;
  onBack: () => void;
  activeTab: 'pool' | 'interested' | 'call_back';
  followupLeads: Lead[];
  allLeadsCount: number;
}

export const AgentLeadView: React.FC<Props> = ({ lead, onDial, onBack, activeTab, followupLeads, allLeadsCount }) => {
  if (activeTab === 'interested' || activeTab === 'call_back') {
    const listTitle = activeTab === 'interested' ? 'INTERESTED' : 'CALLBACK';
    const accentColor = activeTab === 'interested' ? 'text-emerald-500' : 'text-amber-500';

    return (
      <div className="w-full max-w-5xl flex flex-col h-full animate-in slide-in-from-right-32 duration-1000 px-2 md:px-4">
        <div className="mb-4 md:mb-8 flex justify-between items-center px-2">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={onBack}
              className="px-4 py-2 md:px-6 md:py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              BACK
            </button>
            <h2 className="text-xl md:text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
              {listTitle} <span className={`${accentColor} not-italic`}>LIST</span>
            </h2>
          </div>
        </div>
        <div className="flex-1 glass rounded-3xl md:rounded-[5rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {followupLeads.length > 0 ? (
              <table className="w-full text-left border-separate border-spacing-0">
                <tbody className="divide-y divide-white/5">
                  {followupLeads.map(l => (
                    <tr key={l.id} className="hover:bg-indigo-600/[0.05] transition-all group">
                      <td className="py-6 md:py-10 px-6 md:px-10">
                        <div className="font-black text-white text-lg md:text-2xl uppercase tracking-tighter leading-none">{l.name}</div>
                        <div className="text-[10px] md:text-[12px] text-slate-500 font-mono mt-1 md:mt-2">{l.phone}</div>
                      </td>
                      <td className="py-6 md:py-10 px-6 md:px-10 text-right">
                        <button onClick={() => onDial(l)} className="px-6 py-3 md:px-10 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-90 neon-indigo">PUSH</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10">
                <div className="text-4xl md:text-8xl italic font-black text-slate-700 uppercase">EMPTY</div>
                <p className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-500 italic">No remaining tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center flex-col gap-4 md:gap-8 max-w-3xl">
      {lead ? (
        <>
          <div className="w-full glass p-8 md:p-24 rounded-[3rem] md:rounded-[6rem] text-center space-y-8 md:space-y-12 shadow-2xl animate-in slide-in-from-bottom-32 duration-1000 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"></div>
            <div className="space-y-4 md:space-y-6 relative z-10">
              <div className="inline-block px-8 md:px-12 py-2 md:py-3 bg-indigo-600/10 border border-indigo-600/20 rounded-full">
                <span className="text-[9px] md:text-[12px] font-black text-indigo-500 uppercase tracking-widest md:tracking-[0.8em] animate-pulse">OPERATION ACTIVE</span>
              </div>
              <div className="space-y-2 md:space-y-4">
                <h2 className="text-3xl md:text-8xl font-black text-white tracking-tighter leading-tight uppercase italic">
                  FRESH CALL
                </h2>
                <p className="text-xl md:text-5xl text-slate-600 font-mono tracking-widest md:tracking-[0.5em] font-medium">{lead.phone}</p>
              </div>
            </div>
            <button 
              onClick={() => onDial()} 
              className="w-full py-10 md:py-16 bg-indigo-600 text-white rounded-[2rem] md:rounded-[5rem] font-black text-xl md:text-4xl uppercase tracking-widest shadow-2xl border-b-[12px] md:border-b-[24px] border-indigo-950 active:translate-y-2 active:border-b-0 transition-all neon-indigo"
            >
              DIAL NOW
            </button>
          </div>
          <button onClick={onBack} className="px-8 py-3 bg-slate-900/50 border border-white/5 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95">← MAIN MENU</button>
        </>
      ) : (
        <div className="text-center glass p-12 md:p-24 rounded-[3rem] md:rounded-[6rem] border-2 border-dashed border-white/5 animate-in zoom-in-95 duration-700">
          <h3 className="text-2xl md:text-4xl font-black text-slate-500 uppercase tracking-tighter italic mb-6 md:mb-10">POOL <span className="text-indigo-500 not-italic">EMPTY</span></h3>
          <button onClick={onBack} className="px-8 py-3 md:px-12 md:py-4 bg-indigo-600 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">BACK TO HUB</button>
        </div>
      )}
    </div>
  );
};
