import type { CSSProperties } from 'react';

export interface Org {
  id: string; name: string; owner_id: string; approved: boolean;
  description?: string; website?: string; contact_email?: string; contact_phone?: string;
  // Entry-flow configuration (see src/app/entry/) — optional override layer
  environment_type?: string;
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
  entry_config?: Record<string, unknown> | null;
}
export interface Space {
  id: string; organization_id: string; name: string; type: string;
  entry_config?: Record<string, unknown> | null;
}
export interface Zone {
  id: string; space_id: string; name: string; description?: string; capacity?: string;
  parent_zone_id?: string | null;
}
export interface Item { id: string; [key: string]: any; }
export interface Member { id: string; organization_id: string; user_id: string | null; invite_email: string; role: string; created_at: string; }
export interface Application {
  id: string; opportunity_id: string; profile_id: string; note: string | null; status: string; created_at: string;
  opportunities?: { title: string };
  profiles?: { name: string; title: string; domain: string };
}

// Kept deliberately narrow — University and Innovation Hub are the two
// verticals actually being piloted. The fuller EntryConfig system
// (src/app/entry/types.ts) already supports Hotel/Coworking/Custom in
// code — enabling them here later is a one-line change, not new work.
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

