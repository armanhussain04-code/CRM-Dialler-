
import React, { useState, useEffect } from 'react';
import OwnerDashboard from './components/OwnerDashboard.tsx';
import AgentDashboard from './components/AgentDashboard.tsx';
import { UserRole, Lead, CallOutcome, LeadStatus } from './types.ts';
import { 
  getLeads, 
  upsertLead, 
  deleteLeadRecord, 
  deleteLeadsByStatus,
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const refreshData = async () => {
    try {
      const [leadData, passwordData] = await Promise.all([
        getLeads(),
        getPasswords()
      ]);
      setLeads(leadData || []);
      setPasswords(passwordData);
    } catch (err: any) {
      console.error("Sync Error:", err);
      if (err.message.includes('leads')) {
        alert("DB SETUP MISSING: Leads table Supabase mein nahi mili. SQL Script run karein.");
      }
    }
  };

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, []);

  const handleAddLead = async (lead: Lead) => {
    try {
      const newLead = await upsertLead(lead);
      setLeads(prev => [newLead, ...prev]);
    } catch (err: any) {
      alert(err.message || "Failed to add lead.");
    }
  };

  const handleBulkUpload = async (data: any[]) => {
    setIsLoading(true);
    try {
      const newLeads = await bulkAddLeads(data);
      setLeads(prev => [...newLeads, ...prev]);
      alert(`Success! ${newLeads.length} leads added.`);
    } catch (err: any) {
      alert(err.message || "Bulk Upload Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    const backup = [...leads];
    setLeads(prev => prev.filter(l => l.id !== id));
    try {
      await deleteLeadRecord(id);
    } catch (err) {
      alert("Delete failed.");
      setLeads(backup);
    }
  };

  const handleDeleteByStatus = async (status: LeadStatus) => {
    setIsLoading(true);
    try {
      await deleteLeadsByStatus(status);
      await refreshData();
    } catch (err) {
      alert("Batch delete failed.");
      refreshData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecycleLead = async (id: string) => {
    try {
      await resetToPending(id);
      await refreshData();
    } catch (err) {
      refreshData();
    }
  };

  const handleSubmitOutcome = async (outcome: Partial<CallOutcome>) => {
    try {
      await submitCallResult(outcome);
      await refreshData();
    } catch (err) {
      refreshData();
      throw err;
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
      setShowPassword(false);
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
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic text-center">
              ARMAN<br/><span className="text-indigo-500 not-italic">SOLUTIONS</span>
            </h1>
            <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          
          {!selectedRole ? (
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setSelectedRole(UserRole.ADMIN)} className="group relative p-10 bg-slate-900/50 border border-white/5 rounded-[2.5rem] text-center hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all shadow-2xl">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💼</div>
                <div className="font-black text-white uppercase tracking-widest text-sm">Owner Access</div>
              </button>
              <button onClick={() => setSelectedRole(UserRole.AGENT)} className="group relative p-10 bg-slate-900/50 border border-white/5 rounded-[2.5rem] text-center hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all shadow-2xl">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📞</div>
                <div className="font-black text-white uppercase tracking-widest text-sm">Agent Console</div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center px-2">
                <button type="button" onClick={() => { setSelectedRole(null); setPasswordInput(''); setShowPassword(false); }} className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white">← Back</button>
                <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest italic">{selectedRole === UserRole.ADMIN ? 'Admin Mode' : 'Agent Mode'}</span>
              </div>
              <div className="relative group">
                <input 
                  autoFocus 
                  type={showPassword ? "text" : "password"} 
                  placeholder="PIN" 
                  className="w-full bg-slate-900 border border-white/10 p-6 rounded-[2rem] text-white text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-indigo-500 transition-all" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl neon-indigo">Enter System</button>
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
            onDeleteByStatus={handleDeleteByStatus}
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
