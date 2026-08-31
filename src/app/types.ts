export type Lens = 'foryou' | 'people' | 'opportunities' | 'resources' | 'activities';
export type NavTab = 'discover' | 'connections' | 'journey';

export interface Presence {
  id: string;
  profile_id: string;
  space_id: string;
  zone_id: string | null;
  intent: string | null;
  need: string | null;
  offer: string | null;
  station: string | null;
  last_seen: string;
  profiles?: { name: string; title: string; domain: string };
}

export interface Opportunity {
  id: string; title: string; type: string; provider: string;
  eligibility: string; location: string; deadline: string; conditions: string; next_steps: string;
  description?: string; compensation?: string; application_method?: string; image_url?: string; status?: string;
}
export interface ResourceItem {
  id: string; name: string; owner: string; availability: string; conditions: string;
}
export interface ActivityItem {
  id: string; title: string; host: string; start_time: string; end_time: string; purpose: string;
}
export interface Message {
  id: string; sender_profile_id: string; recipient_profile_id: string; body: string; created_at: string;
}

