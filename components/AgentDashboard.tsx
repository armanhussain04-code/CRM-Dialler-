
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lead, CallOutcome } from '../types.ts';
import { AgentSessionStart } from './agent/AgentSessionStart.tsx';
import { AgentLeadView } from './agent/AgentLeadView.tsx';
import { AgentActiveCall } from './agent/AgentActiveCall.tsx';
import { AgentOutcomeForm } from './agent/AgentOutcomeForm.tsx';

interface Props {
  leads: Lead[];
  onSubmitResult: (outcome: Partial<CallOutcome>) => Promise<void>;
}

const SILENT_AUTO_FILTER_SECONDS = 10; 

const AgentDashboard: React.FC<Props> = ({ leads, onSubmitResult }) => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pool' | 'interested' | 'call_back'>('pool');
  const [callState, setCallState] = useState<'idle' | 'calling' | 'outcome'>('idle');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalDuration, setFinalDuration] = useState<string>('0s');
  const [rawDurationSeconds, setRawDurationSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const callStateRef = useRef(callState);
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    callStateRef.current = callState;
    startTimeRef.current = startTime;
  }, [callState, startTime]);

  useEffect(() => {
    const savedState = sessionStorage.getItem('activeCall');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setStartTime(parsed.startTime);
      setCallState(parsed.state);
      setActiveLeadId(parsed.leadId);
      setSessionStarted(true);
    }
  }, []);

  useEffect(() => {
    if (callState === 'calling') {
      sessionStorage.setItem('activeCall', JSON.stringify({ startTime, state: callState, leadId: activeLeadId }));
    } else {
      sessionStorage.removeItem('activeCall');
    }
  }, [callState, startTime, activeLeadId]);

  useEffect(() => {
    const handleReturnToApp = () => {
      if (callStateRef.current === 'calling') {
        handleEndCall();
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleReturnToApp();
    });
    window.addEventListener('focus', handleReturnToApp);

    return () => {
      window.removeEventListener('visibilitychange', handleReturnToApp);
      window.removeEventListener('focus', handleReturnToApp);
    };
  }, []);

  const poolLeads = useMemo(() => leads.filter(l => l.status === 'pending'), [leads]);
  const interestedLeads = useMemo(() => leads.filter(l => l.status === 'interested'), [leads]);
  const callbackLeads = useMemo(() => leads.filter(l => l.status === 'call_back'), [leads]);

  const currentLead = useMemo(() => {
    if (activeLeadId) return leads.find(l => l.id === activeLeadId);
    if (activeTab === 'pool') return poolLeads[0];
    return null;
  }, [activeLeadId, activeTab, poolLeads, leads]);

  const handleDial = (lead?: Lead) => {
    const target = lead || currentLead;
    if (!target) return;
    if (window.navigator.vibrate) window.navigator.vibrate(100);
    
    const now = Date.now();
    setActiveLeadId(target.id);
    setStartTime(now);
    setCallState('calling');
    
    const cleanNumber = target.phone.replace(/\D/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  const handleEndCall = async () => {
    if (callStateRef.current !== 'calling') return;
    
    const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setRawDurationSeconds(diff);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    const durationStr = `${mins}m ${secs}s`;
    setFinalDuration(durationStr);
    
    if (diff < SILENT_AUTO_FILTER_SECONDS) {
      if (activeLeadId) {
        setIsLoading(true);
        await onSubmitResult({
          leadId: activeLeadId,
          status: 'not_received',
          notes: 'Auto-Rejected (Under 10s)',
          duration: durationStr,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
      }
      setCallState('idle');
      setActiveLeadId(null);
      sessionStorage.removeItem('activeCall');
    } else {
      setCallState('outcome');
    }
  };

  const handleFinalSubmit = async (status: string, notes: string, name: string) => {
    if (!currentLead) return;
    setIsLoading(true);
    try {
      await onSubmitResult({
        leadId: currentLead.id,
        name: name,
        status: status as any,
        notes: notes || '',
        duration: finalDuration,
        timestamp: new Date().toISOString()
      });
      setCallState('idle');
      setActiveLeadId(null);
      sessionStorage.removeItem('activeCall');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = (target: 'pool' | 'interested' | 'call_back') => {
    setActiveTab(target);
    setSessionStarted(true);
  };

  const handleBackToStart = () => {
    setSessionStarted(false);
    setActiveLeadId(null);
    setCallState('idle');
  };

  if (!sessionStarted) {
    return (
      <AgentSessionStart 
        onStart={handleStartSession} 
        interestedCount={interestedLeads.length} 
        callbackCount={callbackLeads.length} 
      />
    );
  }

  if (callState === 'calling') return <AgentActiveCall lead={currentLead || null} startTime={startTime} onEndCall={handleEndCall} />;

  if (callState === 'outcome') return (
    <AgentOutcomeForm 
      initialName={currentLead?.name} 
      duration={finalDuration} 
      durationSeconds={rawDurationSeconds}
      onSubmit={handleFinalSubmit} 
      onBack={() => setCallState('idle')}
      isLoading={isLoading} 
    />
  );

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-20"></div>
      
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
           <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="shrink-0 flex items-center justify-center p-4 md:p-8 relative z-20 w-full">
         <div className="flex bg-slate-900/80 backdrop-blur-md p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] border border-white/10 shadow-2xl flex-wrap justify-center items-center gap-1 md:gap-2 w-full max-w-4xl">
            <button 
               onClick={handleBackToStart}
               className="p-3 md:p-4 bg-slate-950/50 text-slate-500 rounded-full hover:bg-slate-800 hover:text-white transition-all mr-1 md:mr-2"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <button 
               onClick={() => setActiveTab('pool')}
               className={`flex-1 min-w-[80px] px-2 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pool' ? 'bg-indigo-600 text-white shadow-xl neon-indigo' : 'text-slate-500 hover:text-slate-300'}`}
            >
               FRESH ({poolLeads.length})
            </button>
            <button 
               onClick={() => setActiveTab('interested')}
               className={`flex-1 min-w-[80px] px-2 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'interested' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
               INTEREST ({interestedLeads.length})
            </button>
            <button 
               onClick={() => setActiveTab('call_back')}
               className={`flex-1 min-w-[80px] px-2 md:px-12 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'call_back' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
               CB ({callbackLeads.length})
            </button>
         </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-6 relative z-10 overflow-hidden">
        <AgentLeadView 
          lead={currentLead || null} 
          onDial={handleDial} 
          activeTab={activeTab} 
          onBack={handleBackToStart}
          followupLeads={activeTab === 'interested' ? interestedLeads : (activeTab === 'call_back' ? callbackLeads : [])} 
          allLeadsCount={leads.length}
        />
      </div>
    </div>
  );
};

export default AgentDashboard;
