
import { createClient } from "@supabase/supabase-js";
import { Lead, CallOutcome, LeadStatus } from "../types.ts";

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
    
    if (error) {
      if (error.code === '42P01') {
        throw new Error("Table 'leads' not found.");
      }
      throw error;
    }
    return data || [];
  } catch (err: any) {
    console.error("Fetch Error:", err);
    throw err;
  }
};

export const upsertLead = async (lead: Lead): Promise<Lead> => {
  const phone = String(lead.phone).replace(/\D/g, '');
  
  // 1. Check for valid EXACTLY 10 digits
  const isInvalidLength = phone.length !== 10;

  // 2. Check for Duplicates
  const { data: existing } = await supabase
    .from('leads')
    .select('id, phone')
    .eq('phone', phone)
    .maybeSingle();

  const isDuplicate = !!existing;

  // Strict Trash Rule: If not 10 digits OR duplicate, mark as 'invalid'
  const status: LeadStatus = (isInvalidLength || isDuplicate) ? 'invalid' : 'pending';
  
  const payload = {
    name: lead.name && lead.name.trim() !== '' ? lead.name.trim() : `User-${Math.floor(1000 + Math.random() * 9000)}`,
    phone: phone,
    status: status,
    notes: isDuplicate ? "DUPLICATE ENTRY" : (isInvalidLength ? "WRONG NUMBER (NOT 10 DIGITS)" : null),
    duration: null,
    timestamp: null,
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('leads').insert(payload).select();
  
  if (error) throw new Error(`Insert Failed: ${error.message}`);

  return (data && data[0]) ? data[0] : { ...payload, id: `temp-${Date.now()}` } as Lead;
};

export const bulkAddLeads = async (leads: any[]): Promise<Lead[]> => {
  // Get all existing phones to check duplicates in bulk
  const { data: existingData } = await supabase.from('leads').select('phone');
  const existingPhones = new Set(existingData?.map(d => String(d.phone)) || []);
  
  const batch = [];
  const timestamp = new Date().toISOString();

  for (const l of leads) {
    const cleanPhone = String(l.phone).replace(/\D/g, '');
    const isInvalidLength = cleanPhone.length !== 10;
    const isDuplicate = existingPhones.has(cleanPhone);

    const status: LeadStatus = (isInvalidLength || isDuplicate) ? 'invalid' : 'pending';

    batch.push({
      name: l.name && l.name.trim() !== '' ? l.name.trim() : `User-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: cleanPhone,
      status: status,
      notes: isDuplicate ? "BULK DUPLICATE" : (isInvalidLength ? "WRONG LENGTH" : null),
      timestamp: null,
      created_at: timestamp
    });
    
    // Add to set to avoid duplicates within the SAME bulk upload
    if (!isDuplicate && !isInvalidLength) {
        existingPhones.add(cleanPhone);
    }
  }

  if (batch.length === 0) return [];

  const { data, error } = await supabase.from('leads').insert(batch).select();
  if (error) throw error;
  
  return data || [];
};

export const deleteLeadRecord = async (id: string) => {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
};

export const deleteLeadsByStatus = async (status: LeadStatus) => {
  const { error } = await supabase.from('leads').delete().eq('status', status.toLowerCase());
  if (error) throw error;
};

export const submitCallResult = async (outcome: Partial<CallOutcome>) => {
  if (!outcome.leadId || !outcome.status) return;
  const updateData: any = { 
    status: outcome.status.toLowerCase(),
    duration: outcome.duration || null,
    notes: outcome.notes || null,
    timestamp: new Date().toISOString()
  };
  if (outcome.name && outcome.name.trim() !== '') {
    updateData.name = outcome.name.trim();
  }
  const { error } = await supabase.from('leads').update(updateData).eq('id', outcome.leadId);
  if (error) throw error;
};

export const resetToPending = async (id: string) => {
  const { error } = await supabase.from('leads').update({ 
    status: 'pending', duration: null, notes: null, timestamp: null 
  }).eq('id', id);
  if (error) throw error;
};

export const getPasswords = async () => {
  try {
    const { data, error } = await supabase.from('config').select('value').eq('id', 'passwords').single();
    if (error) throw error;
    return data?.value || { admin: '1234', agent: 'agent123' };
  } catch {
    return { admin: '1234', agent: 'agent123' };
  }
};

export const savePasswords = async (passwords: { admin: string, agent: string }) => {
  await supabase.from('config').upsert({ id: 'passwords', value: passwords });
};
