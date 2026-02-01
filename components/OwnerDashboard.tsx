
import React, { useState, useRef, useMemo } from 'react';
import { Lead } from '../types.ts';
import { clearAllData } from '../services/crmService.ts';

interface Props {
  leads: Lead[];
  onAddLead: (lead: Lead) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
  onRecycleLead: (id: string) => Promise<void>;
  onBulkUpload: (leads: any[]) => Promise<void>;
  passwords: { admin: string, agent: string };
  onUpdatePasswords: (pw: { admin: string, agent: string }) => Promise<void>;
}

type MainTab = 'pool' | 'manual' | 'settings';
type PoolFilter = 'pending' | 'interested' | 'not_interested' | 'not_received';

const OwnerDashboard: React.FC<Props> = ({ 
  leads,
  onAddLead,
  onDeleteLead,
  onRecycleLead,
  onBulkUpload,
  passwords, 
  onUpdatePasswords
}) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('pool');
  const [activePoolFilter, setActivePoolFilter] = useState<PoolFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempPasswords, setTempPasswords] = useState({ ...passwords });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => String(l.status).toLowerCase() === String(activePoolFilter).toLowerCase())
      .filter(l => {
        const query = searchQuery.toLowerCase();
        return l.name.toLowerCase().includes(query) || l.phone.includes(query);
      });
  }, [leads, activePoolFilter, searchQuery]);

  const handleExportCSV = () => {
    if (leads.length === 0) return alert("Nothing to export.");
    const headers = ['Identity', 'Mobile', 'Current Status', 'Talk Time', 'Agent Notes', 'Last Sync'];
    const rows = leads.map(l => [
      `"${l.name}"`, 
      `"${l.phone}"`, 
      `"${l.status.toUpperCase()}"`, 
      `"${l.duration || '--'}"`, 
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${new Date().toLocaleString()}"`
    ]);
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Arman_Solutions_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim();
    if (!name || !phone) return;

    setIsProcessing(true);
    try {
      await onAddLead({ id: crypto.randomUUID(), name, phone, status: 'pending' });
      form.reset();
      setActivePoolFilter('pending');
      setActiveMainTab('pool');
    } catch {
      alert("Error adding lead.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const data = text.split('\n').slice(1).map(line => {
        const parts = line.split(',');
        return { name: parts[0]?.trim(), phone: parts[1]?.trim() };
      }).filter(l => l.name && l.phone);
      if (data.length > 0) {
        await onBulkUpload(data);
        alert(`Successfully injected ${data.length} records.`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden max-w-[1600px] mx-auto space-y-6">
      {/* Top Controls */}
      <div className="shrink-0 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
          {[
            { id: 'pool', label: 'DATABASE' },
            { id: 'manual', label: 'INJECTION' },
            { id: 'settings', label: 'SECURITY' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveMainTab(tab.id as MainTab)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeMainTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 max-w-2xl w-full flex gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Filter by name or mobile..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-3 text-white text-[11px] font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
          <button onClick={handleExportCSV} className="px-6 py-3 bg-emerald-600/10 text-emerald-500 border border-emerald-600/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all shadow-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {activeMainTab === 'pool' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-500">
          {/* Sub Filters */}
          <div className="shrink-0 flex items-center justify-between">
            <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5 shadow-lg overflow-x-auto custom-scrollbar">
              {[
                { id: 'pending', label: 'New Pool', color: 'text-amber-500' },
                { id: 'interested', label: 'Interested', color: 'text-emerald-500' },
                { id: 'not_interested', label: 'Rejected', color: 'text-red-500' },
                { id: 'not_received', label: 'No Answer', color: 'text-indigo-400' }
              ].map(filter => (
                <button 
                  key={filter.id} 
                  onClick={() => setActivePoolFilter(filter.id as PoolFilter)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activePoolFilter === filter.id ? 'bg-slate-800 text-white border border-white/10' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <span className={activePoolFilter === filter.id ? filter.color : 'text-current'}>{filter.label}</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-[9px] font-mono border border-white/5">{leads.filter(l => l.status === filter.id).length}</span>
                </button>
              ))}
            </div>
            {activePoolFilter === 'pending' && (
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-500 transition-all">
                Bulk Injection
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleBulkCSV} className="hidden" accept=".csv" />
          </div>

          {/* Table Area */}
          <div className="flex-1 glass rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
                    <th className="py-6 px-10 border-b border-white/5">Identity</th>
                    <th className="py-6 px-10 border-b border-white/5">Connection</th>
                    <th className="py-6 px-10 border-b border-white/5">Interaction</th>
                    <th className="py-6 px-10 border-b border-white/5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map(l => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-5 px-10">
                        <div className="font-black text-white text-sm uppercase tracking-tight leading-none">{l.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-2 tracking-widest">{l.phone}</div>
                      </td>
                      <td className="py-5 px-10">
                        <div className="inline-flex px-3 py-1 rounded-lg bg-indigo-600/10 border border-indigo-600/20 text-[9px] text-indigo-400 font-black uppercase tracking-widest">
                          {l.duration || '--'}
                        </div>
                      </td>
                      <td className="py-5 px-10">
                        <div className="text-[11px] text-slate-600 italic max-w-md truncate group-hover:whitespace-normal group-hover:text-slate-400 transition-all">
                          {l.notes || 'No summary available.'}
                        </div>
                      </td>
                      <td className="py-5 px-10 text-right space-x-2">
                        {activePoolFilter !== 'pending' && (
                          <button onClick={() => onRecycleLead(l.id)} className="px-4 py-2 bg-indigo-600/10 text-indigo-500 border border-indigo-600/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Restore</button>
                        )}
                        <button onClick={() => { if(confirm("Permanently remove this lead?")) onDeleteLead(l.id); }} className="px-4 py-2 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="py-40 text-center space-y-4">
                  <div className="text-4xl opacity-20">📂</div>
                  <div className="text-slate-800 text-xs font-black uppercase tracking-[0.5em]">No Data in this vault</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeMainTab === 'manual' && (
        <div className="flex-1 flex items-center justify-center animate-in zoom-in-95 duration-500">
          <form onSubmit={handleManualAdd} className="max-w-md w-full glass p-12 rounded-[4rem] space-y-10 shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">LEAD <span className="text-indigo-500 not-italic">INJECTION</span></h3>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em]">Manual Override Mode</p>
            </div>
            <div className="space-y-4">
              <input name="name" required placeholder="Full Name" className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-white text-sm font-bold shadow-inner placeholder:text-slate-800" />
              <input name="phone" required placeholder="Mobile / WhatsApp" className="w-full bg-slate-950 border border-white/10 rounded-3xl px-8 py-5 text-white text-sm font-mono shadow-inner placeholder:text-slate-800" />
              <button type="submit" disabled={isProcessing} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-500 shadow-2xl transition-all active:scale-95">
                {isProcessing ? 'SYNCHRONIZING...' : 'CONFIRM INJECTION'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeMainTab === 'settings' && (
        <div className="flex-1 flex items-center justify-center animate-in zoom-in-95 duration-500">
          <div className="max-w-md w-full glass p-12 rounded-[4rem] space-y-12 shadow-2xl border border-white/5">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">SECURITY <span className="text-indigo-500 not-italic">PORTAL</span></h3>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em]">Authorization Keys</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-4 tracking-widest">Administrative PIN</label>
                <input type="text" value={tempPasswords.admin} onChange={e => setTempPasswords({...tempPasswords, admin: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-3xl px-8 py-5 text-white text-center font-black tracking-[0.6em] text-2xl shadow-inner" />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase ml-4 tracking-widest">Agent Staff PIN</label>
                <input type="text" value={tempPasswords.agent} onChange={e => setTempPasswords({...tempPasswords, agent: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-3xl px-8 py-5 text-white text-center font-black tracking-[0.6em] text-2xl shadow-inner" />
              </div>
              <button onClick={async () => { await onUpdatePasswords(tempPasswords); alert("System Security Updated."); }} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-500 transition-all active:scale-95">Update Access Keys</button>
              
              <div className="pt-10 border-t border-white/5">
                <button onClick={() => { if(confirm("DANGER: WIPE ALL CRM DATA PERMANENTLY?")) clearAllData().then(() => window.location.reload()); }} className="w-full py-4 bg-red-600/10 text-red-500 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Clear System Database</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
