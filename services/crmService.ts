
import { createClient } from "@supabase/supabase-js";
import { Lead, CallOutcome } from "../types.ts";

const PROJECT_ID = "webhgovxymee fzy fvfml".replace(/\s/g, ''); 
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYmhnb3Z4eW1lZWZ6eWZ2Zm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODkwOTUsImV4cCI6MjA4NTQ2NTA5NX0.rfMfKnGw-4qPq9T1gtgwEvB33N5bYcbjbwVk-CRMl3o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const getLeads = async (): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Fetch Error:", err);
    return [];
  }
};

export const upsertLead = async (lead: Lead) => {
  const payload = {
    id: lead.id,
    name: lead.name,
    phone: String(lead.phone),
    status: lead.status || 'pending',
    notes: lead.notes || null,
    duration: lead.duration || null
  };
  const { error } = await supabase.from('leads').upsert(payload);
  if (error) throw error;
};

export const deleteLeadRecord = async (id: string) => {
  // Fixed Delete logic
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Critical Delete Error:", error.message);
    throw error;
  }
};

export const submitCallResult = async (outcome: Partial<CallOutcome>) => {
  if (!outcome.leadId || !outcome.status) return;
  
  // Explicit mapping and clean status string
  const targetStatus = String(outcome.status).toLowerCase();
  
  const { error } = await supabase
    .from('leads')
    .update({ 
      status: targetStatus, 
      duration: outcome.duration || null,
      notes: outcome.notes || null
    })
    .eq('id', outcome.leadId);
  
  if (error) {
    console.error("Submit Logic Error:", error.message);
    throw error;
  }
};

export const resetToPending = async (id: string) => {
  const { error } = await supabase
    .from('leads')
    .update({ 
      status: 'pending',
      duration: null,
      notes: null
    })
    .eq('id', id);
  if (error) throw error;
};

export const bulkAddLeads = async (leads: any[]) => {
  const payload = leads.map(l => ({
    name: l.name,
    phone: String(l.phone),
    status: 'pending'
  }));
  const { error } = await supabase.from('leads').insert(payload);
  if (error) throw error;
};

export const getPasswords = async () => {
  try {
    const { data } = await supabase.from('config').select('value').eq('id', 'passwords').single();
    return data?.value || { admin: '1234', agent: 'agent123' };
  } catch {
    return { admin: '1234', agent: 'agent123' };
  }
};

export const savePasswords = async (passwords: { admin: string, agent: string }) => {
  await supabase.from('config').upsert({ id: 'passwords', value: passwords });
};

export const clearAllData = async () => {
  const { error } = await supabase.from('leads').delete().neq('name', '___SYSTEM_RESERVED___');
  if (error) throw error;
};
