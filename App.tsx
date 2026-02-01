
import React, { useState, useEffect } from 'react';
import OwnerDashboard from './components/OwnerDashboard.tsx';
import AgentDashboard from './components/AgentDashboard.tsx';
import { UserRole, Lead, CallOutcome } from './types.ts';
import { 
  getLeads, 
  upsertLead, 
  deleteLeadRecord, 
  getPasswords, 
  savePasswords,
  submitCallResult,
  bulkAddLeads,
  resetToPending
} from './services/crmService.ts';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [passwords, setPasswords] = useState({ admin: '1234', agent: 'agent123' });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const refreshData = async () => {
    try {
      const [leadData, passwordData] = await Promise.all([
        getLeads(),
        getPasswords()
      ]);
      setLeads(leadData || []);
      setPasswords(passwordData);
    } catch (err) {
      console.error("Sync Error:", err);
    }
  };

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, []);

  const handleAddLead = async (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
    try {
      await upsertLead(lead);
    } catch (err) {
      refreshData();
    }
  };

  const handleDeleteLead = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    try {
      await deleteLeadRecord(id);
    } catch (err) {
      alert("Delete failed.");
      refreshData();
    }
  };

  const handleRecycleLead = async (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'pending' as any, duration: undefined, notes: undefined } : l));
    try {
      await resetToPending(id);
      await refreshData();
    } catch (err) {
      refreshData();
    }
  };

  const handleSubmitOutcome = async (outcome: Partial<CallOutcome>) => {
    setLeads(prev => prev.map(l => 
      l.id === outcome.leadId 
        ? { ...l, status: outcome.status as any, notes: outcome.notes, duration: outcome.duration } 
        : l
    ));

    try {
      await submitCallResult(outcome);
      await refreshData();
    } catch (err) {
      refreshData();
      throw err;
    }
  };

  const handleBulkUpload = async (data: any[]) => {
    setIsLoading(true);
    try {
      await bulkAddLeads(data);
      await refreshData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    const correctPassword = selectedRole === UserRole.ADMIN ? passwords.admin : passwords.agent;
    if (passwordInput === correctPassword) {
      setRole(selectedRole);
      setError('');
      setPasswordInput('');
    } else {
      setError('WRONG PIN');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Arman Solutions</span>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-950 bg-mesh overflow-hidden">
        <div className="max-w-sm w-full space-y-12 relative z-10 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              ARMAN<br/><span className="text-indigo-500 not-italic">SOLUTIONS</span>
            </h1>
            <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          {!selectedRole ? (
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setSelectedRole(UserRole.ADMIN)}
                className="group relative p-10 bg-slate-900/50 border border-white/5 rounded-[2.5rem] text-center hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all shadow-2xl"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💼</div>
                <div className="font-black text-white uppercase tracking-widest text-sm">Owner Access</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Full Control</div>
              </button>
              <button 
                onClick={() => setSelectedRole(UserRole.AGENT)}
                className="group relative p-10 bg-slate-900/50 border border-white/5 rounded-[2.5rem] text-center hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all shadow-2xl"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📞</div>
                <div className="font-black text-white uppercase tracking-widest text-sm">Agent Console</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dialer Only</div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center px-2">
                <button type="button" onClick={() => setSelectedRole(null)} className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-all">← Back</button>
                <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest italic">{selectedRole === UserRole.ADMIN ? 'Admin Mode' : 'Agent Mode'}</span>
              </div>
              <input 
                autoFocus 
                type="password" 
                placeholder="PIN"
                className="w-full bg-slate-900 border border-white/10 p-6 rounded-[2rem] text-white text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-indigo-500 shadow-2xl" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
              />
              <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">Enter System</button>
              {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">{error}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 flex flex-col">
      <header className="shrink-0 h-16 flex items-center justify-between px-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           </div>
           <h2 className="text-xs font-black tracking-tighter text-white uppercase italic">ARMAN <span className="text-indigo-500 not-italic">SOLUTIONS</span></h2>
        </div>
        <button onClick={() => {setRole(null); setSelectedRole(null)}} className="px-5 py-2 bg-red-600/10 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-600/20">Exit</button>
      </header>
      
      <main className="flex-1 overflow-hidden relative">
        {role === UserRole.ADMIN ? (
          <OwnerDashboard 
            leads={leads} 
            onAddLead={handleAddLead} 
            onDeleteLead={handleDeleteLead} 
            onRecycleLead={handleRecycleLead}
            onBulkUpload={handleBulkUpload}
            passwords={passwords} 
            onUpdatePasswords={async (p) => { await savePasswords(p); setPasswords(p); refreshData(); }} 
          />
        ) : (
          <AgentDashboard leads={leads} onSubmitResult={handleSubmitOutcome} />
        )}
      </main>
    </div>
  );
};

export default App;
