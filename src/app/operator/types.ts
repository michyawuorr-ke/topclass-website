import type { CSSProperties } from 'react';

export interface Org {
  id: string; name: string; owner_id: string; approved: boolean;
  description?: string; website?: string; contact_email?: string; contact_phone?: string;
}
export interface Space { id: string; organization_id: string; name: string; type: string; }
export interface Zone {
  id: string; space_id: string; name: string; description?: string; capacity?: string;
  parent_zone_id?: string | null;
}
export interface Item { id: string; [key: string]: any; }

export const SPACE_TYPES = ['university', 'innovation_hub'];
export const OPPORTUNITY_TYPES = ['Scholarship', 'Job', 'Internship', 'Grant', 'Program', 'Workshop', 'Consultation', 'Other'];

export const emptyOpportunity = {
  title: '', type: OPPORTUNITY_TYPES[0], provider: '', description: '', eligibility: '',
  compensation: '', deadline: '', application_method: '', zone_id: '', location: '', status: 'open', image_url: '',
};
export const emptyResource = { name: '', owner: '', description: '', availability: '', capacity: '', zone_id: '', image_url: '' };
export const emptyActivity = {
  title: '', host: '', description: '', category: '', start_time: '', end_time: '',
  zone_id: '', capacity: '', registration_link: '', image_url: '',
};

export const inputStyle: CSSProperties = { width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: 'none', fontFamily: 'inherit' };
export const labelStyle: CSSProperties = { fontSize: 11, opacity: 0.6, marginBottom: 4, display: 'block' };

// Builds "Faculty > Building > Room" style path labels from a flat zone list
export function zonePath(zoneId: string | null | undefined, list: Zone[]): string {
  if (!zoneId) return '';
  const z = list.find(zz => zz.id === zoneId);
  if (!z) return '';
  const parent = z.parent_zone_id ? zonePath(z.parent_zone_id, list) : '';
  return parent ? `${parent} > ${z.name}` : z.name;
}

export interface Member { id: string; organization_id: string; user_id: string | null; invite_email: string; role: string; created_at: string; }

export interface Application {
  id: string; opportunity_id: string; profile_id: string; note: string | null; status: string; created_at: string;
  opportunities?: { title: string };
  profiles?: { name: string; title: string; domain: string };
}

