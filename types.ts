
export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent'
}

export type LeadStatus = 'pending' | 'interested' | 'not_interested' | 'not_received';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  notes?: string;
  duration?: string;
  timestamp?: string;
}

export interface CallOutcome {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  status: LeadStatus;
  notes?: string;
  duration?: string;
  timestamp: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export enum StudioTab {
  CHAT = 'chat',
  VISION = 'vision',
  MOTION = 'motion',
  VOICE = 'voice'
}
