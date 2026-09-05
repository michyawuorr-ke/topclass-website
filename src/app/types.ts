export type Lens = 'all' | 'opportunities' | 'activities' | 'notices';
export type NavTab = 'home' | 'campus' | 'learn' | 'network';
export type NetworkSub = 'connections' | 'requests' | 'journey';

export interface Presence {
  id: string; profile_id: string; space_id: string; zone_id: string | null;
  intent: string | null; need: string | null; offer: string | null;
  station: string | null; last_seen: string; visibility: 'department' | 'institution';
  wifi_ssid?: string | null;
  profiles?: { name: string; title: string; domain: string };
}
export interface Opportunity {
  id: string; title: string; type: string; provider: string;
  eligibility: string; location: string; deadline: string; conditions: string; next_steps: string;
  description?: string; compensation?: string; application_method?: string;
  image_url?: string; status?: string; team_id?: string;
}
export interface ResourceItem {
  id: string; name: string; owner: string; availability: string; conditions: string;
  description?: string; capacity?: string; image_url?: string; zones?: { name: string };
  team_id?: string;
}
export interface ActivityItem {
  id: string; title: string; host: string; start_time: string; end_time: string; purpose: string;
  description?: string; category?: string; capacity?: string; registration_link?: string;
  image_url?: string; zones?: { name: string }; team_id?: string;
}
export interface CourseMaterial {
  id: string; title: string; file_url: string; file_type: string;
  unit_code?: string; unit_name?: string; team_id: string; uploaded_at: string;
  uploader_name?: string;
}
export interface ScheduleEntry {
  id: string; course_code: string; course_name: string;
  day_of_week: string; start_time: string; end_time: string;
  zone?: { name: string }; team?: { name: string };
}
export interface Announcement {
  id: string; title: string; body?: string; created_at: string;
  team?: { name: string };
}
export interface Message {
  id: string; sender_profile_id: string; recipient_profile_id: string;
  body: string; created_at: string; read_at: string | null;
}
