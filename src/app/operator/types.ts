import type { CSSProperties } from 'react';

export type OperatorRole = 'super_admin' | 'space_admin' | 'zone_operator' | 'none';

export interface Org {
  id: string; name: string; owner_id: string; approved: boolean;
  description?: string; website?: string; contact_email?: string; contact_phone?: string;
  email_domain?: string | null;
  environment_type?: string;
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
  entry_config?: Record<string, unknown> | null;
}
export interface Space {
  id: string; organization_id: string; name: string; type: string;
  entry_config?: Record<string, unknown> | null;
  space_code?: string | null; domain_restriction?: string | null;
}
export interface Zone {
  id: string; space_id: string; name: string; description?: string; capacity?: string;
  parent_zone_id?: string | null; building_tag?: string | null;
}
export interface Team {
  id: string; space_id: string; name: string; type: 'department' | 'crew';
  description?: string | null; primary_zone_id?: string | null; join_code?: string | null; created_at: string;
}
export interface TeamLead { id: string; team_id: string; user_id: string | null; invite_email: string; created_at: string; }
export interface TeamOperator { id: string; team_id: string; user_id: string | null; invite_email: string | null; created_at: string; }
export interface Schedule {
  id: string; team_id: string; course_code?: string | null; course_name: string;
  zone_id?: string | null; day_of_week?: string | null; start_time?: string | null; end_time?: string | null;
}
export interface Announcement { id: string; team_id: string; title: string; body?: string | null; created_at: string; }
export interface Item { id: string; [key: string]: any; }
export interface Member { id: string; organization_id: string; user_id: string | null; invite_email: string; role: string; created_at: string; }
export interface SpaceAdmin { id: string; space_id: string; user_id: string | null; invite_email: string; created_at: string; }
export interface ZonePublisher { id: string; zone_id: string; user_id: string | null; invite_email: string; created_at: string; }
export interface AccessRequest {
  id: string; space_id: string | null; zone_id: string | null;
  requester_user_id: string; requester_email: string; note: string | null;
  status: 'pending' | 'approved' | 'denied'; created_at: string;
}
export interface Application {
  id: string; opportunity_id: string; profile_id: string; note: string | null; status: string; created_at: string;
  opportunities?: { title: string };
  profiles?: { name: string; title: string; domain: string };
}

export const SPACE_TYPES = ['university', 'innovation_hub'];
export const ENVIRONMENT_TYPES = [
  { value: 'university',     label: 'University / Campus' },
  { value: 'innovation_hub', label: 'Innovation Hub' },
];

export const OPPORTUNITY_TYPES = [
  'Scholarship', 'Fellowship', 'Grant',
  'Job', 'Internship',
  'Mentorship', 'Research Collaboration',
  'Accelerator', 'Program', 'Cohort',
  'Workshop', 'Training', 'Competition',
  'Partnership', 'Collaboration',
  'Experience / Activity',
  'Consultation', 'Other',
];

export const emptyOpportunity = {
  title: '', type: OPPORTUNITY_TYPES[0], provider: '', description: '', eligibility: '',
  compensation: '', deadline: '', application_method: '', zone_id: '', location: '', status: 'open', image_url: '',
};
export const emptyResource = { name: '', owner: '', description: '', availability: '', capacity: '', zone_id: '', image_url: '' };
export const emptyActivity = {
  title: '', host: '', description: '', category: '', start_time: '', end_time: '',
  zone_id: '', capacity: '', registration_link: '', image_url: '',
};

export const TEAM_TYPES: Array<{ value: 'department' | 'crew'; label: string }> = [
  { value: 'department', label: 'Department (academic unit)' },
  { value: 'crew', label: 'Crew (functional team)' },
];
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const emptyTeam = { name: '', type: 'department' as 'department' | 'crew', description: '', primary_zone_id: '' };
export const emptySchedule = { course_code: '', course_name: '', zone_id: '', day_of_week: DAYS_OF_WEEK[0], start_time: '', end_time: '' };
export const emptyAnnouncement = { title: '', body: '' };

export function genJoinCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function roomQrPayload(spaceId: string, zoneId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?space=${spaceId}&zone=${zoneId}`;
}
export function qrImageUrl(payload: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}

export const inputStyle: CSSProperties = { width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none', fontFamily: 'inherit' };
export const labelStyle: CSSProperties = { fontSize: 11, opacity: 0.6, marginBottom: 4, display: 'block' };

export function zonePath(zoneId: string | null | undefined, list: Zone[]): string {
  if (!zoneId) return '';
  const z = list.find(zz => zz.id === zoneId);
  if (!z) return '';
  const parent = z.parent_zone_id ? zonePath(z.parent_zone_id, list) : '';
  return parent ? `${parent} > ${z.name}` : z.name;
}

