
import React, { useState, useRef, useMemo } from 'react';
import { Lead, LeadStatus } from '../types.ts';

interface Props {
  leads: Lead[];
  onAddLead: (lead: Lead) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onDeleteByStatus: (status: LeadStatus) => Promise<void>;
  onRecycleLead: (id: string) => Promise<void>;
  onBulkUpload: (leads: any[]) => Promise<void>;
  passwords: { admin: string, agent: string };
  onUpdatePasswords: (pw: { admin: string, agent: string }) => Promise<void>;
}

type MainTab = 'pool' | 'manual' | 'settings';
type ManualSubTab = 'single' | 'bulk' | 'paste' | 'wrong';
type PoolFilter = 'pending' | 'interested' | 'not_interested' | 'not_received' | 'call_back' | 'complete';

const OwnerDashboard: React.FC<Props> = ({ 
  leads,
  onAddLead,
  onDeleteLead,
  onDeleteByStatus,
  onRecycleLead,
  onBulkUpload,
  passwords, 
  onUpdatePasswords
}) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('pool');
  const [activeManualSubTab, setActiveManualSubTab] = useState<ManualSubTab>('single');
  const [activePoolFilter, setActivePoolFilter] = useState<PoolFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState({ ...passwords });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filter = activePoolFilter.toLowerCase();
    return leads.filter(l => {
      const leadStatus = (l.status || 'pending').toLowerCase();
      const matchesFilter = leadStatus === filter;
      const matchesSearch = query === '' || 
        (l.name || '').toLowerCase().includes(query) || 
        (l.phone || '').includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [leads, activePoolFilter, searchQuery]);

  const wrongLeads = useMemo(() => leads.filter(l => (l.status || '').toLowerCase() === 'invalid'), [leads]);

  const handleExecuteDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      await onDeleteLead(id);
      setConfirmDeleteId(null);
    } catch (err) {
      alert(`Delete Failed.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreLead = async (id: string) => {
    setIsProcessing(true);
    try {
      await onRecycleLead(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreAllNoAnswer = async () => {
    if (!confirm("Restore ALL 'No Answer' leads to 'New' list?")) return;
    setIsProcessing(true);
    try {
      const noAnswerLeads = leads.filter(l => l.status === 'not_received');
      for (const lead of noAnswerLeads) {
        await onRecycleLead(lead.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteData.trim()) return;
    setIsProcessing(true);
    try {
      const lines = pasteData.split(/[\n,]/);
      const batch = lines.map(line => ({ phone: line.trim() })).filter(l => l.phone.length > 0);
      await onBulkUpload(batch);
      setPasteData('');
      setActiveMainTab('pool');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const batch = lines.slice(1).map(line => {
          const parts = line.split(',');
          return { name: parts[0]?.trim(), phone: parts[1]?.trim() };
        }).filter(l => l.phone && l.phone.length > 0);
        await onBulkUpload(batch);
        setActiveMainTab('pool');
      } catch (err: any) {
        alert("File error: " + err.message);
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Name", "Phone", "Status", "Duration", "Notes", "Date"];
    const rows = filteredLeads.map(l => [
      l.name || 'N/A', l.phone, l.status.toUpperCase(), l.duration || '0s',
      (l.notes || '').replace(/,/g, ' ').replace(/\n/g, ' '),
      l.timestamp ? new Date(l.timestamp).toLocaleDateString() : 'New'
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Leads_${activePoolFilter}.csv`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden max-w-[1500px] mx-auto space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="shrink-0 flex flex-col xl:flex-row justify-between items-center gap-4 md:gap-6 glass p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-2xl">
        <div className="flex bg-slate-950/50 p-1 rounded-xl md:rounded-2xl border border-white/5 w-full xl:w-auto">
          {[{ id: 'pool', label: 'DATABASE' }, { id: 'manual', label: 'ADD ENTRY' }, { id: 'settings', label: 'PIN' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveMainTab(tab.id as MainTab)} className={`flex-1 xl:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeMainTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
          ))}
        </div>
        {activeMainTab === 'pool' && (
          <div className="flex-1 w-full flex gap-2">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-white text-[10px] md:text-[11px] font-bold outline-none focus:border-indigo-500 shadow-inner" 
            />
            <button 
              onClick={handleExportCSV}
              className="p-3 md:px-6 md:py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        )}
      </div>

      {activeMainTab === 'pool' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 md:space-y-6">
          <div className="shrink-0 flex items-center justify-between flex-wrap gap-2 md:gap-4">
            <div className="flex bg-slate-900/30 p-1 rounded-xl md:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar w-full xl:w-auto">
              {[
                { id: 'pending', label: 'New' },
                { id: 'interested', label: 'Interested' },
                { id: 'call_back', label: 'Callback' },
                { id: 'complete', label: 'Done' },
                { id: 'not_received', label: 'No Answer' },
                { id: 'not_interested', label: 'Rejected' }
              ].map(filter => (
                <button key={filter.id} onClick={() => setActivePoolFilter(filter.id as PoolFilter)} className={`flex-1 xl:flex-none flex items-center gap-2 px-3 md:px-6 py-2 md:py-3.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap ${activePoolFilter === filter.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>
                  <span>{filter.label}</span>
                  <span className="px-1.5 py-0.5 rounded-md font-mono text-[8px] bg-slate-950">{leads.filter(l => (l.status || 'pending').toLowerCase() === filter.id).length}</span>
                </button>
              ))}
            </div>
            {activePoolFilter === 'not_received' && filteredLeads.length > 0 && (
              <button onClick={handleRestoreAllNoAnswer} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl">Restore All</button>
            )}
          </div>

          <div className="flex-1 glass rounded-2xl md:rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
                <thead className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-md z-20">
                  <tr className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]"><th className="py-4 md:py-7 px-6 md:px-10 border-b border-white/5">Customer Info</th><th className="py-4 md:py-7 px-6 md:px-10 border-b border-white/5">Conversation</th><th className="py-4 md:py-7 px-6 md:px-10 border-b border-white/5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map(l => (
                    <tr key={l.id} className="hover:bg-white/[0.03] transition-all duration-300">
                      <td className="py-4 md:py-6 px-6 md:px-10 align-top">
                        <div className="font-black text-white text-xs md:text-sm uppercase mb-1">{l.name}</div>
                        <div className="text-[9px] md:text-[10px] font-mono text-slate-500">{l.phone}</div>
                      </td>
                      <td className="py-4 md:py-6 px-6 md:px-10 align-top">
                        <div className="text-[8px] md:text-[9px] text-indigo-400 font-black uppercase mb-1">{l.duration || '0s'} • {l.timestamp ? new Date(l.timestamp).toLocaleDateString() : 'New'}</div>
                        <div className="text-[10px] md:text-[11px] text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                          {l.notes || 'No notes.'}
                        </div>
                      </td>
                      <td className="py-4 md:py-6 px-6 md:px-10 text-right align-top space-x-1">
                        {activePoolFilter === 'not_received' && (
                          <button onClick={() => handleRestoreLead(l.id)} className="w-8 h-8 md:w-10 md:h-10 inline-flex items-center justify-center bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                        )}
                        {confirmDeleteId === l.id ? (
                          <button onClick={() => handleExecuteDelete(l.id)} className="px-3 py-1.5 md:px-4 md:py-2 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">DELETE</button>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(l.id)} className="w-8 h-8 md:w-10 md:h-10 inline-flex items-center justify-center bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={3} className="py-20 text-center text-slate-700 italic font-black uppercase tracking-widest opacity-30 text-xs">No Records Found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeMainTab === 'manual' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 md:space-y-8 overflow-y-auto pt-4">
           <div className="bg-slate-950/50 p-1 rounded-xl border border-white/5 flex flex-wrap justify-center max-w-full">
              {[{id:'single',label:'MANUAL'},{id:'paste',label:'PASTE'},{id:'bulk',label:'CSV FILE'},{id:'wrong',label:`TRASH`}].map(sub => (
                <button key={sub.id} onClick={() => setActiveManualSubTab(sub.id as ManualSubTab)} className={`px-4 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeManualSubTab === sub.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{sub.label}</button>
              ))}
           </div>
           
           <div className="w-full max-w-xl px-2 mb-8">
             {activeManualSubTab === 'single' && (
                <form onSubmit={async (e) => { e.preventDefault(); const f = e.target as any; await onAddLead({id:Date.now().toString(), name: f.name.value, phone: f.phone.value.replace(/\D/g,''), status:'pending'}); f.reset(); setActiveMainTab('pool'); }} className="glass p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] space-y-6 md:space-y-10 border border-white/5 animate-in slide-in-from-bottom-4">
                  <h3 className="text-xl md:text-3xl font-black text-white uppercase text-center italic tracking-tighter">ADD <span className="text-indigo-500 not-italic">ENTRY</span></h3>
                  <div className="space-y-4 md:space-y-6">
                    <input name="name" placeholder="Name (Optional)" className="w-full bg-slate-950/80 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 md:py-5 text-white text-sm font-bold outline-none focus:border-indigo-500" />
                    <input name="phone" required placeholder="Phone Number" className="w-full bg-slate-950/80 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 md:py-5 text-white font-mono tracking-[0.2em] outline-none focus:border-indigo-500" />
                    <button type="submit" disabled={isProcessing} className="w-full py-5 md:py-7 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">SAVE LEAD</button>
                  </div>
                </form>
             )}

             {activeManualSubTab === 'paste' && (
                <div className="glass p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] space-y-6 md:space-y-10 border border-white/5 animate-in slide-in-from-bottom-4">
                  <h3 className="text-xl md:text-3xl font-black text-white uppercase text-center italic tracking-tighter">PASTE <span className="text-indigo-500 not-italic">NUMBERS</span></h3>
                  <div className="space-y-4 md:space-y-6">
                    <textarea 
                      placeholder="Paste numbers here (one per line or comma separated)..." 
                      value={pasteData}
                      onChange={e => setPasteData(e.target.value)}
                      className="w-full h-48 bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all"
                    />
                    <button onClick={handlePasteSubmit} disabled={isProcessing || !pasteData.trim()} className="w-full py-5 md:py-7 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">PROCESS BATCH</button>
                  </div>
                </div>
             )}

             {activeManualSubTab === 'bulk' && (
                <div className="glass p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] space-y-8 md:space-y-10 border border-white/5 text-center animate-in slide-in-from-bottom-4">
                  <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter">UPLOAD <span className="text-indigo-500 not-italic">CSV</span></h3>
                  <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl bg-slate-950/50">
                    <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer space-y-4 block">
                      <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Drop your CSV file here</p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Format: Name, Phone</p>
                      </div>
                    </label>
                  </div>
                </div>
             )}

             {activeManualSubTab === 'wrong' && (
                <div className="glass rounded-[2rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 max-h-[500px] w-full">
                  <div className="p-6 border-b border-white/5 bg-slate-900/50">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest text-rose-500">TRASH / INVALID ({wrongLeads.length})</h3>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    {wrongLeads.length > 0 ? (
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-white/5">
                          {wrongLeads.map(l => (
                            <tr key={l.id} className="hover:bg-white/[0.02]">
                              <td className="p-4 px-6">
                                <div className="text-white font-bold text-xs">{l.phone}</div>
                                <div className="text-[9px] text-rose-500/70 uppercase font-bold">{l.notes || 'Invalid Lead'}</div>
                              </td>
                              <td className="p-4 px-6 text-right space-x-2">
                                <button onClick={() => handleRestoreLead(l.id)} className="p-2 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all" title="Retry / Restore"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                                <button onClick={() => handleExecuteDelete(l.id)} className="p-2 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all" title="Delete Forever"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-20 text-center text-slate-700 italic font-black uppercase tracking-widest opacity-30 text-xs">Trash is Empty</div>
                    )}
                  </div>
                </div>
             )}
           </div>
        </div>
      )}

      {activeMainTab === 'settings' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
           <div className="max-w-md w-full glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] space-y-8 md:space-y-10 border border-white/5 text-center">
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">PIN <span className="text-indigo-500 not-italic">CONFIGURATION</span></h3>
              <div className="space-y-4 md:space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Owner PIN</label>
                  <input type="text" value={tempPasswords.admin} onChange={e => setTempPasswords({...tempPasswords, admin: e.target.value})} className="w-full bg-slate-950/80 border border-white/10 rounded-xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 text-white font-black tracking-[0.3em] md:tracking-[0.5em] text-xl md:text-2xl outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Agent PIN</label>
                  <input type="text" value={tempPasswords.agent} onChange={e => setTempPasswords({...tempPasswords, agent: e.target.value})} className="w-full bg-slate-950/80 border border-white/10 rounded-xl md:rounded-[1.5rem] px-6 md:px-8 py-4 md:py-5 text-white font-black tracking-[0.3em] md:tracking-[0.5em] text-xl md:text-2xl outline-none focus:border-indigo-500" />
                </div>
              </div>
              <button onClick={async () => { setIsProcessing(true); await onUpdatePasswords(tempPasswords); setIsProcessing(false); alert("PINs Updated!"); }} disabled={isProcessing} className="w-full py-5 md:py-7 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">UPDATE SYSTEM PIN</button>
           </div>
        </div>
      )}
    </div>
  );
};

// Fixed: Added default export
export default OwnerDashboard;
