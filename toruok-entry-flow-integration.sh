#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~/topclass-website

echo '== Integrating entry flow: new src/app/entry/ module, wired into current modular structure =='
mkdir -p src/app/entry

cat > src/app/entry/types.ts << 'F_ENTRY_TYPES_TS'
// ============================================================
// ENTRY / AUTH CONFIGURATION TYPES
// The operator configures this once. The participant sees
// only what their environment requires. System does more,
// user does less.
// ============================================================

export type EnvironmentType =
  | 'coworking'
  | 'innovation_hub'
  | 'university'
  | 'hotel'
  | 'custom';

export type AuthMethod =
  | 'anonymous'       // No sign-in. Walk-up entry. (Hotel guest, day pass)
  | 'email_magic'     // Email → magic link
  | 'phone_otp'       // Phone → OTP. Mobile-first Kenyan contexts
  | 'institutional'   // Email domain verified e.g. @students.uonbi.ac.ke
  | 'invite_code'     // Operator-sent code. Programs, cohorts, private events
  | 'qr_entry';       // Scan space QR to enter. Walk-up events

export type ProfileFieldKey =
  | 'full_name'
  | 'title'
  | 'domain'
  | 'capabilities'
  | 'standing_need'
  | 'phone'
  | 'linkedin'
  | 'twitter'
  | 'organisation'
  | 'student_id'
  | 'faculty'
  | 'year_of_study'
  | 'program'
  | 'company_stage'
  | 'room_number'
  | 'guest_type'
  | 'membership_tier'
  | 'custom_1'
  | 'custom_2'
  | 'custom_3';

export type PresenceFieldKey =
  | 'need'
  | 'offer'
  | 'station'
  | 'intent'
  | 'availability'
  | 'session_goal';

export interface ProfileFieldConfig {
  key: ProfileFieldKey;
  label: string;
  placeholder?: string;
  required: boolean;
  visible_to_others: boolean;
  input_type: 'text' | 'select' | 'tel' | 'email' | 'date' | 'url';
  options?: string[];
  help_text?: string;
}

export interface PresenceFieldConfig {
  key: PresenceFieldKey;
  label: string;
  placeholder?: string;
  required: boolean;
  help_text?: string;
}

export interface RoleConfig {
  key: string;
  label: string;
  description?: string;
  default_visibility: 'hidden' | 'members_only' | 'semi_public';
  can_post_opportunities: boolean;
  can_see_all_people: boolean;
  is_self_selectable: boolean;
}

export interface EntryConfig {
  // Branding
  org_name: string;
  org_logo_url?: string;
  welcome_headline: string;
  welcome_subtext: string;
  primary_color: string;
  background_color: string;

  // Auth
  auth_methods: AuthMethod[];
  allow_anonymous_browse: boolean;
  require_profile_before_entry: boolean;

  // Profile
  profile_fields: ProfileFieldConfig[];
  profile_step_label: string;

  // Presence
  presence_fields: PresenceFieldConfig[];
  presence_step_label: string;
  presence_enabled: boolean;

  // Roles
  roles: RoleConfig[];

  // Privacy
  default_visibility: 'hidden' | 'members_only' | 'semi_public';
  allow_presence_opt_out: boolean;

  // Space entry
  space_entry: 'url_param' | 'qr_scan' | 'code_input' | 'auto';
  space_entry_label: string;

  // Post-entry
  default_lens: 'foryou' | 'people' | 'opportunities' | 'activities';
}

// ── COWORKING ─────────────────────────────────────────────────────────────────
export const COWORKING_CONFIG: EntryConfig = {
  org_name: '',
  welcome_headline: 'Welcome to the space',
  welcome_subtext: 'Sign in to discover people, opportunities and resources around you.',
  primary_color: '#E26D34',
  background_color: '#1C1C2E',

  auth_methods: ['anonymous', 'phone_otp', 'email_magic'],
  allow_anonymous_browse: false,
  require_profile_before_entry: true,

  profile_fields: [
    { key: 'full_name',       label: 'Your name',               placeholder: 'First and last name',                                 required: true,  visible_to_others: true,  input_type: 'text' },
    { key: 'title',           label: 'What you do',             placeholder: 'e.g. Product Designer, Lawyer, Founder',              required: true,  visible_to_others: true,  input_type: 'text' },
    { key: 'domain',          label: 'Your sector',             placeholder: 'e.g. Fintech, Healthtech, Media',                     required: true,  visible_to_others: true,  input_type: 'text' },
    { key: 'membership_tier', label: 'Membership type',         required: false, visible_to_others: false, input_type: 'select',
      options: ['Hot Desk', 'Dedicated Desk', 'Private Office', 'Day Pass', 'Virtual'],
      help_text: 'Helps us personalise your experience' },
    { key: 'organisation',    label: 'Company / project',       placeholder: 'What are you building?',                              required: false, visible_to_others: true,  input_type: 'text' },
    { key: 'capabilities',    label: 'What you can offer',      placeholder: 'e.g. UX design, legal advice, sales introductions',   required: false, visible_to_others: true,  input_type: 'text' },
    { key: 'standing_need',   label: 'What you are looking for', placeholder: 'e.g. a developer, an investor, a co-founder',        required: false, visible_to_others: true,  input_type: 'text' },
    { key: 'linkedin',        label: 'LinkedIn (optional)',      placeholder: 'linkedin.com/in/...',                                 required: false, visible_to_others: false, input_type: 'url' },
    { key: 'phone',           label: 'Phone (optional)',         placeholder: '+254 ...',                                            required: false, visible_to_others: false, input_type: 'tel',
      help_text: 'Only shared if you choose to' },
  ],
  profile_step_label: 'Tell us about yourself',

  presence_fields: [
    { key: 'need',    label: 'What do you need today?',   placeholder: 'e.g. feedback on my pitch, a tax advisor',          required: true  },
    { key: 'offer',   label: 'What can you offer today?', placeholder: 'e.g. introductions to VCs, design feedback',        required: false },
    { key: 'station', label: 'Where are you sitting?',    placeholder: 'e.g. Hot Desk Row B, Lounge, Private Office 3',     required: true  },
  ],
  presence_step_label: 'What are you working on today?',
  presence_enabled: true,

  roles: [
    { key: 'member',   label: 'Member',    default_visibility: 'members_only', can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: true  },
    { key: 'day_pass', label: 'Day Pass',  default_visibility: 'members_only', can_post_opportunities: false, can_see_all_people: true,  is_self_selectable: true  },
    { key: 'guest',    label: 'Guest',     default_visibility: 'hidden',       can_post_opportunities: false, can_see_all_people: false, is_self_selectable: true  },
    { key: 'staff',    label: 'Staff',     default_visibility: 'members_only', can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: false },
  ],

  default_visibility: 'members_only',
  allow_presence_opt_out: true,
  space_entry: 'qr_scan',
  space_entry_label: 'Scan the QR code at reception to enter the space',
  default_lens: 'foryou',
};

// ── INNOVATION HUB ───────────────────────────────────────────────────────────
export const INNOVATION_HUB_CONFIG: EntryConfig = {
  org_name: '',
  welcome_headline: 'Welcome to the hub',
  welcome_subtext: 'Connect with founders, mentors, investors and the broader ecosystem.',
  primary_color: '#E26D34',
  background_color: '#1C1C2E',

  auth_methods: ['email_magic', 'phone_otp', 'invite_code'],
  allow_anonymous_browse: false,
  require_profile_before_entry: true,

  profile_fields: [
    { key: 'full_name',     label: 'Your name',                required: true,  visible_to_others: true,  input_type: 'text' },
    { key: 'title',         label: 'Your role',                placeholder: 'e.g. Co-founder, Mentor, Investor, Program Manager', required: true, visible_to_others: true, input_type: 'text' },
    { key: 'organisation',  label: 'Company / startup',        placeholder: 'Name of your startup or organisation',               required: true, visible_to_others: true, input_type: 'text' },
    { key: 'domain',        label: 'Sector',                   placeholder: 'e.g. EdTech, HealthTech, AgriTech, FinTech',         required: true, visible_to_others: true, input_type: 'text' },
    { key: 'company_stage', label: 'Stage',                    required: false, visible_to_others: true,  input_type: 'select',
      options: ['Idea', 'MVP / Prototype', 'Early Revenue', 'Growth', 'Scaling', 'N/A — not a founder'] },
    { key: 'program',       label: 'Program / cohort',         placeholder: 'e.g. Spark Accelerator Cohort 2',                    required: false, visible_to_others: true, input_type: 'text',
      help_text: 'Leave blank if you are a general community member' },
    { key: 'capabilities',  label: 'What you can offer',       placeholder: 'e.g. product strategy, investor intros, legal structuring', required: false, visible_to_others: true, input_type: 'text' },
    { key: 'standing_need', label: 'What you are looking for', placeholder: 'e.g. a technical co-founder, seed funding',          required: false, visible_to_others: true, input_type: 'text' },
    { key: 'linkedin',      label: 'LinkedIn',                 required: false, visible_to_others: true,  input_type: 'url' },
    { key: 'twitter',       label: 'X / Twitter',              required: false, visible_to_others: true,  input_type: 'url' },
    { key: 'phone',         label: 'Phone',                    required: false, visible_to_others: false, input_type: 'tel',
      help_text: 'Only shared with your explicit consent per connection' },
  ],
  profile_step_label: 'Your builder profile',

  presence_fields: [
    { key: 'need',         label: 'What do you need today?',    placeholder: 'e.g. a design review, intro to Safaricom team',      required: true  },
    { key: 'offer',        label: 'What can you offer today?',  placeholder: 'e.g. pitch feedback, product advice, investor intros', required: false },
    { key: 'station',      label: 'Where are you?',             placeholder: 'e.g. Main coworking area, Event space, Meeting room 2', required: false },
    { key: 'session_goal', label: 'What is your focus today?',  placeholder: 'e.g. closing our seed round deck',                   required: false },
  ],
  presence_step_label: 'What are you working on today?',
  presence_enabled: true,

  roles: [
    { key: 'founder',    label: 'Startup Founder / Team', default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: true  },
    { key: 'mentor',     label: 'Mentor',                 default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: false },
    { key: 'investor',   label: 'Investor',               default_visibility: 'members_only', can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: false },
    { key: 'community',  label: 'Community Member',       default_visibility: 'members_only', can_post_opportunities: false, can_see_all_people: true,  is_self_selectable: true  },
    { key: 'corporate',  label: 'Corporate Partner',      default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: false },
    { key: 'researcher', label: 'Researcher / Academic',  default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: true  },
    { key: 'staff',      label: 'Hub Staff',              default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: false },
  ],

  default_visibility: 'members_only',
  allow_presence_opt_out: true,
  space_entry: 'url_param',
  space_entry_label: 'Enter the hub',
  default_lens: 'foryou',
};

// ── UNIVERSITY ───────────────────────────────────────────────────────────────
export const UNIVERSITY_CONFIG: EntryConfig = {
  org_name: '',
  welcome_headline: 'Welcome to campus',
  welcome_subtext: 'Discover scholarships, research opportunities, events and people in your community.',
  primary_color: '#1a3a8e',
  background_color: '#0f1923',

  auth_methods: ['institutional', 'email_magic', 'phone_otp'],
  allow_anonymous_browse: true,
  require_profile_before_entry: false,

  profile_fields: [
    { key: 'full_name',     label: 'Your name',               required: true,  visible_to_others: true,  input_type: 'text' },
    { key: 'title',         label: 'Your role',               required: true,  visible_to_others: true,  input_type: 'select',
      options: ['Undergraduate Student', 'Masters Student', 'PhD Researcher', 'Lecturer / Professor', 'Administrative Staff', 'Technical Staff', 'Visiting Researcher', 'Alumni', 'External Visitor'] },
    { key: 'faculty',       label: 'Faculty / College',       required: true,  visible_to_others: true,  input_type: 'select',
      options: ['College of Health Sciences', 'College of Biological & Physical Sciences', 'College of Architecture & Engineering', 'College of Agriculture & Veterinary Sciences', 'College of Education & External Studies', 'College of Humanities & Social Sciences', 'Faculty of Law', 'School of Business', 'School of Computing & Informatics', 'Other'] },
    { key: 'domain',        label: 'Field of study / work',  placeholder: 'e.g. Computer Science, Medicine, Architecture',      required: true,  visible_to_others: true,  input_type: 'text' },
    { key: 'year_of_study', label: 'Year of study',          required: false, visible_to_others: false, input_type: 'select',
      options: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year+', 'Masters Year 1', 'Masters Year 2', 'PhD Year 1', 'PhD Year 2', 'PhD Year 3+', 'N/A'] },
    { key: 'student_id',    label: 'Student / Staff ID',     placeholder: 'Reg. No. or Staff No.',                              required: false, visible_to_others: false, input_type: 'text',
      help_text: 'Used to verify eligibility for certain opportunities. Not shown to others.' },
    { key: 'capabilities',  label: 'Skills you can offer',   placeholder: 'e.g. data analysis, UI design, field research',     required: false, visible_to_others: true,  input_type: 'text' },
    { key: 'standing_need', label: 'What you are looking for', placeholder: 'e.g. a research supervisor, an internship',        required: false, visible_to_others: true,  input_type: 'text' },
    { key: 'linkedin',      label: 'LinkedIn (optional)',     required: false, visible_to_others: true,  input_type: 'url' },
    { key: 'phone',         label: 'Phone (optional)',        required: false, visible_to_others: false, input_type: 'tel' },
  ],
  profile_step_label: 'Your campus profile',

  presence_fields: [
    { key: 'need',    label: 'What are you looking for today?', placeholder: 'e.g. a research collaborator, event recommendations', required: false },
    { key: 'offer',   label: 'What can you help with?',         placeholder: 'e.g. Python tutoring, design feedback',              required: false },
    { key: 'station', label: 'Which campus are you on?',        placeholder: 'e.g. Main Campus, Chiromo, Parklands',               required: false },
  ],
  presence_step_label: 'What brings you to campus today?',
  presence_enabled: true,

  roles: [
    { key: 'undergrad',   label: 'Undergraduate Student', default_visibility: 'members_only', can_post_opportunities: false, can_see_all_people: true,  is_self_selectable: true  },
    { key: 'postgrad',    label: 'Postgraduate Student',  default_visibility: 'members_only', can_post_opportunities: false, can_see_all_people: true,  is_self_selectable: true  },
    { key: 'researcher',  label: 'Researcher / PhD',      default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: true  },
    { key: 'academic',    label: 'Academic Staff',        default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: true  },
    { key: 'admin_staff', label: 'Administrative Staff',  default_visibility: 'members_only', can_post_opportunities: false, can_see_all_people: true,  is_self_selectable: true  },
    { key: 'alumni',      label: 'Alumni',                default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: true  },
    { key: 'visitor',     label: 'External Visitor',      default_visibility: 'hidden',       can_post_opportunities: false, can_see_all_people: false, is_self_selectable: true  },
  ],

  default_visibility: 'members_only',
  allow_presence_opt_out: true,
  space_entry: 'url_param',
  space_entry_label: 'Enter your campus portal',
  default_lens: 'opportunities',
};

// ── HOTEL ────────────────────────────────────────────────────────────────────
export const HOTEL_CONFIG: EntryConfig = {
  org_name: '',
  welcome_headline: 'Welcome',
  welcome_subtext: 'Discover what is available at the property during your stay.',
  primary_color: '#8B6914',
  background_color: '#1a1208',

  auth_methods: ['qr_entry', 'anonymous', 'email_magic'],
  allow_anonymous_browse: true,
  require_profile_before_entry: false,

  profile_fields: [
    { key: 'full_name',    label: 'Your name',           required: true,  visible_to_others: false, input_type: 'text' },
    { key: 'guest_type',   label: 'How are you here?',   required: true,  visible_to_others: false, input_type: 'select',
      options: ['In-house Guest', 'Conference / Event Delegate', 'Restaurant Visitor', 'Day Visitor / Meeting'] },
    { key: 'room_number',  label: 'Room number',         placeholder: 'e.g. 412',       required: false, visible_to_others: false, input_type: 'text',
      help_text: 'Optional — only used to personalise your experience' },
    { key: 'title',        label: 'Professional title',  placeholder: 'e.g. CEO, Investor, Consultant', required: false, visible_to_others: false, input_type: 'text',
      help_text: 'Only visible if you choose to connect professionally' },
    { key: 'organisation', label: 'Organisation',        required: false, visible_to_others: false, input_type: 'text',
      help_text: 'Only visible if you choose to connect professionally' },
    { key: 'domain',       label: 'Sector',              required: false, visible_to_others: false, input_type: 'text',
      help_text: 'Only visible if you choose to connect professionally' },
    { key: 'linkedin',     label: 'LinkedIn (optional)', required: false, visible_to_others: false, input_type: 'url',
      help_text: 'Shared only if you initiate a professional connection' },
  ],
  profile_step_label: 'Tell us a little about yourself',

  presence_fields: [
    { key: 'availability',  label: 'Are you open to professional connections?', required: false },
    { key: 'session_goal',  label: 'What brings you here?', placeholder: 'e.g. attending the summit, leisure, business meetings', required: false },
  ],
  presence_step_label: 'Your stay at the property',
  presence_enabled: true,

  roles: [
    { key: 'inhouse_guest', label: 'In-house Guest',         default_visibility: 'hidden',       can_post_opportunities: false, can_see_all_people: false, is_self_selectable: true  },
    { key: 'delegate',      label: 'Conference Delegate',     default_visibility: 'hidden',       can_post_opportunities: false, can_see_all_people: false, is_self_selectable: true  },
    { key: 'day_visitor',   label: 'Day Visitor',             default_visibility: 'hidden',       can_post_opportunities: false, can_see_all_people: false, is_self_selectable: true  },
    { key: 'staff',         label: 'Hotel Staff',             default_visibility: 'semi_public',  can_post_opportunities: true,  can_see_all_people: true,  is_self_selectable: false },
  ],

  default_visibility: 'hidden',
  allow_presence_opt_out: true,
  space_entry: 'qr_scan',
  space_entry_label: 'Scan the QR code at reception or in your room',
  default_lens: 'activities',
};

export function getDefaultEntryConfig(type: EnvironmentType): EntryConfig {
  switch (type) {
    case 'coworking':      return { ...COWORKING_CONFIG };
    case 'innovation_hub': return { ...INNOVATION_HUB_CONFIG };
    case 'university':     return { ...UNIVERSITY_CONFIG };
    case 'hotel':          return { ...HOTEL_CONFIG };
    default:               return { ...COWORKING_CONFIG };
  }
}

F_ENTRY_TYPES_TS

cat > src/app/entry/EntryFlow.tsx << 'F_ENTRY_ENTRYFLOW_TSX'
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EntryConfig, AuthMethod, ProfileFieldConfig, PresenceFieldConfig } from './types';

// ── Styles ────────────────────────────────────────────────────────────────────
const screen = (bg: string): React.CSSProperties => ({
  minHeight: '100vh',
  background: bg,
  color: '#F5EFE3',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'sans-serif',
});

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 380,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const inputSt = (primary: string): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  marginBottom: 10,
  borderRadius: 10,
  border: `1.5px solid rgba(255,255,255,0.12)`,
  background: 'rgba(255,255,255,0.07)',
  color: '#F5EFE3',
  fontFamily: 'inherit',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
});

const selectSt = (primary: string): React.CSSProperties => ({
  ...inputSt(primary),
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
});

const labelSt: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.55,
  marginBottom: 4,
  display: 'block',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const helpSt: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.45,
  marginTop: -6,
  marginBottom: 10,
};

const btn = (primary: string, outline = false): React.CSSProperties => ({
  width: '100%',
  padding: '13px 0',
  borderRadius: 10,
  border: outline ? `1.5px solid ${primary}` : 'none',
  background: outline ? 'transparent' : primary,
  color: outline ? primary : '#fff',
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
});

const stepDots = (total: number, current: number, primary: string) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i === current ? 20 : 7,
        height: 7,
        borderRadius: 4,
        background: i === current ? primary : 'rgba(255,255,255,0.2)',
        transition: 'all 0.3s',
      }} />
    ))}
  </div>
);

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'auth' | 'verify' | 'role' | 'profile' | 'presence' | 'done';

interface EntryFlowProps {
  config: EntryConfig;
  spaceId: string;
  onComplete: (profileId: string, profileData: Record<string, string>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EntryFlow({ config, spaceId, onComplete }: EntryFlowProps) {
  const [step, setStep] = useState<Step>('auth');
  const [authMethod, setAuthMethod] = useState<AuthMethod>(config.auth_methods[0]);
  const [profileId, setProfileId] = useState('');

  // Auth state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role
  const [selectedRole, setSelectedRole] = useState('');

  // Profile fields — keyed by ProfileFieldKey
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});

  // Presence fields
  const [presenceValues, setPresenceValues] = useState<Record<string, string>>({});

  const P = config.primary_color;
  const BG = config.background_color;

  // ── Restore existing session on mount ────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const uid = session.user.id;
        setProfileId(uid);
        // Check if they already have a profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();
        if (prof?.name) {
          // Returning user — hydrate and skip straight to done
          const vals: Record<string, string> = {
            full_name: prof.name || '',
            title: prof.title || '',
            domain: prof.domain || '',
            capabilities: prof.capabilities || '',
            standing_need: prof.standing_need || '',
            phone: prof.phone || '',
            linkedin: prof.linkedin || '',
          };
          setProfileValues(vals);
          onComplete(uid, vals);
        } else {
          // Session exists but no profile yet
          goToFirstStep(uid);
        }
      }
    };
    restore();
  }, []);

  const goToFirstStep = (uid: string) => {
    setProfileId(uid);
    const selfSelectableRoles = config.roles.filter(r => r.is_self_selectable);
    if (selfSelectableRoles.length > 1) {
      setStep('role');
    } else {
      if (selfSelectableRoles.length === 1) setSelectedRole(selfSelectableRoles[0].key);
      setStep('profile');
    }
  };

  // ── AUTH HANDLERS ─────────────────────────────────────────────────────────

  const handleAnonymous = async () => {
    setLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (error || !data.user) { setAuthError('Could not start a session. Check your connection.'); return; }
    goToFirstStep(data.user.id);
  };

  const handleMagicLink = async () => {
    if (!email.trim()) { setAuthError('Enter your email address.'); return; }
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setMagicSent(true);
  };

  const handlePhoneOtp = async () => {
    if (!phone.trim()) { setAuthError('Enter your phone number.'); return; }
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setOtpSent(true);
    setStep('verify');
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setAuthError('Enter the code from your SMS.'); return; }
    setLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: 'sms',
    });
    setLoading(false);
    if (error || !data.user) { setAuthError('Invalid code. Try again.'); return; }
    goToFirstStep(data.user.id);
  };

  const handleInstitutional = async () => {
    if (!email.trim()) { setAuthError('Enter your institutional email.'); return; }
    // Validate domain if org has one set
    // For now send magic link — institutional domain validation
    // can be added when operator configures allowed_domains
    setLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setMagicSent(true);
  };

  const handleInviteCode = async () => {
    if (!inviteCode.trim()) { setAuthError('Enter your invite code.'); return; }
    setLoading(true);
    setAuthError('');
    // Look up the invite code in spaces or a future invite_codes table
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.trim().toUpperCase())
      .eq('space_id', spaceId)
      .single();
    setLoading(false);
    if (error || !data) { setAuthError('Code not recognised. Check and try again.'); return; }
    // Valid code — sign in anonymously then mark them as invite-verified
    const { data: anonData } = await supabase.auth.signInAnonymously();
    if (anonData.user) goToFirstStep(anonData.user.id);
  };

  const handleQrEntry = async () => {
    // QR entry: the space URL already contained the spaceId
    // Just create an anonymous session
    await handleAnonymous();
  };

  // ── PROFILE SAVE ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    // Validate required fields
    const missing = config.profile_fields
      .filter(f => f.required && !profileValues[f.key]?.trim())
      .map(f => f.label);
    if (missing.length > 0) {
      setAuthError(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    setLoading(true);
    setAuthError('');

    await supabase.from('profiles').upsert({
      id: profileId,
      name: profileValues['full_name'] || '',
      title: profileValues['title'] || '',
      domain: profileValues['domain'] || '',
      capabilities: profileValues['capabilities'] || '',
      standing_need: profileValues['standing_need'] || '',
      phone: profileValues['phone'] || '',
      linkedin: profileValues['linkedin'] || '',
      // Store remaining custom fields as JSON in a metadata column
      metadata: JSON.stringify(
        Object.fromEntries(
          Object.entries(profileValues).filter(([k]) =>
            !['full_name','title','domain','capabilities','standing_need','phone','linkedin'].includes(k)
          )
        )
      ),
      role_type: selectedRole || config.roles[0]?.key || 'member',
    });

    setLoading(false);

    if (config.presence_enabled && config.presence_fields.length > 0) {
      setStep('presence');
    } else {
      onComplete(profileId, profileValues);
    }
  };

  // ── PRESENCE SAVE ─────────────────────────────────────────────────────────
  const savePresence = async () => {
    const requiredMissing = config.presence_fields
      .filter(f => f.required && !presenceValues[f.key]?.trim())
      .map(f => f.label);
    if (requiredMissing.length > 0) {
      setAuthError(`Please fill in: ${requiredMissing.join(', ')}`);
      return;
    }
    setLoading(true);
    await supabase.from('presence').upsert({
      id: profileId,
      profile_id: profileId,
      space_id: spaceId,
      need: presenceValues['need'] || '',
      offer: presenceValues['offer'] || '',
      station: presenceValues['station'] || presenceValues['session_goal'] || '',
      intent: presenceValues['intent'] || presenceValues['availability'] || '',
      last_seen: new Date().toISOString(),
    });
    setLoading(false);
    onComplete(profileId, { ...profileValues, ...presenceValues });
  };

  const skipPresence = () => {
    onComplete(profileId, profileValues);
  };

  // ── RENDER FIELD ─────────────────────────────────────────────────────────
  const renderField = (
    field: ProfileFieldConfig | PresenceFieldConfig,
    values: Record<string, string>,
    setter: (v: Record<string, string>) => void
  ) => {
    const pf = field as ProfileFieldConfig;
    const val = values[field.key] || '';
    const onChange = (v: string) => setter({ ...values, [field.key]: v });

    return (
      <div key={field.key}>
        <label style={labelSt}>{field.label}{(pf.required) ? ' *' : ''}</label>
        {pf.input_type === 'select' && pf.options ? (
          <select
            value={val}
            onChange={e => onChange(e.target.value)}
            style={selectSt(P)}
          >
            <option value="">Select…</option>
            {pf.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={pf.input_type || 'text'}
            value={val}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            style={inputSt(P)}
          />
        )}
        {field.help_text && <div style={helpSt}>{field.help_text}</div>}
      </div>
    );
  };

  // ── METHOD LABEL MAP ─────────────────────────────────────────────────────
  const methodLabel: Record<AuthMethod, string> = {
    anonymous:     'Continue without signing in',
    email_magic:   'Sign in with email',
    phone_otp:     'Sign in with phone',
    institutional: 'Sign in with institutional email',
    invite_code:   'Enter invite code',
    qr_entry:      'Continue',
  };

  // ── TOTAL STEPS (for dots) ────────────────────────────────────────────────
  const totalSteps = (() => {
    let n = 1; // auth
    if (config.roles.filter(r => r.is_self_selectable).length > 1) n++;
    n++; // profile
    if (config.presence_enabled && config.presence_fields.length > 0) n++;
    return n;
  })();

  const stepIndex: Record<Step, number> = {
    auth: 0,
    verify: 0,
    role: 1,
    profile: config.roles.filter(r => r.is_self_selectable).length > 1 ? 2 : 1,
    presence: totalSteps - 1,
    done: totalSteps,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: AUTH
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'auth') {
    const selfMethods = config.auth_methods;

    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, 0, P)}

          {config.org_logo_url && (
            <img src={config.org_logo_url} alt={config.org_name}
              style={{ width: 56, height: 56, borderRadius: 12, marginBottom: 16, alignSelf: 'center', objectFit: 'contain' }} />
          )}

          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
            {config.welcome_headline || 'Welcome'}
          </h1>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
            {config.welcome_subtext}
          </p>

          {/* Primary method */}
          {selfMethods[0] === 'anonymous' || selfMethods[0] === 'qr_entry' ? (
            <button onClick={selfMethods[0] === 'qr_entry' ? handleQrEntry : handleAnonymous}
              disabled={loading} style={btn(P)}>
              {loading ? 'Starting…' : methodLabel[selfMethods[0]]}
            </button>
          ) : selfMethods[0] === 'phone_otp' ? (
            <>
              <label style={labelSt}>Phone number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254 700 000 000" style={inputSt(P)}
                onKeyDown={e => e.key === 'Enter' && handlePhoneOtp()} />
              <button onClick={handlePhoneOtp} disabled={loading} style={btn(P)}>
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </>
          ) : selfMethods[0] === 'email_magic' || selfMethods[0] === 'institutional' ? (
            magicSent ? (
              <div style={{ textAlign: 'center', lineHeight: 1.6, opacity: 0.8 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
                <p>Check your email for a sign-in link. You can close this tab and open the link from your email.</p>
              </div>
            ) : (
              <>
                <label style={labelSt}>
                  {selfMethods[0] === 'institutional' ? 'Institutional email' : 'Email address'}
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={selfMethods[0] === 'institutional' ? 'you@students.uonbi.ac.ke' : 'you@example.com'}
                  style={inputSt(P)}
                  onKeyDown={e => e.key === 'Enter' && (selfMethods[0] === 'institutional' ? handleInstitutional() : handleMagicLink())} />
                <button
                  onClick={selfMethods[0] === 'institutional' ? handleInstitutional : handleMagicLink}
                  disabled={loading} style={btn(P)}>
                  {loading ? 'Sending…' : 'Send sign-in link'}
                </button>
              </>
            )
          ) : selfMethods[0] === 'invite_code' ? (
            <>
              <label style={labelSt}>Invite code</label>
              <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                placeholder="e.g. SPARK24" style={inputSt(P)}
                onKeyDown={e => e.key === 'Enter' && handleInviteCode()} />
              <button onClick={handleInviteCode} disabled={loading} style={btn(P)}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </>
          ) : null}

          {/* Secondary methods */}
          {selfMethods.slice(1).map(method => (
            <button key={method}
              onClick={() => {
                setAuthMethod(method);
                if (method === 'anonymous') handleAnonymous();
              }}
              style={{ ...btn(P, true), marginTop: 10, fontSize: 13 }}>
              {methodLabel[method]}
            </button>
          ))}

          {authError && (
            <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>
              {authError}
            </div>
          )}

          {config.allow_anonymous_browse && (
            <button onClick={skipPresence}
              style={{ background: 'none', border: 'none', color: P, cursor: 'pointer', marginTop: 16, fontSize: 13, textDecoration: 'underline', alignSelf: 'center' }}>
              Browse without signing in
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: VERIFY OTP
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'verify') {
    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, 0, P)}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Check your messages</h2>
          <p style={{ fontSize: 14, opacity: 0.6, textAlign: 'center', marginBottom: 28 }}>
            We sent a 6-digit code to <strong>{phone}</strong>
          </p>
          <label style={labelSt}>Verification code</label>
          <input type="number" value={otp} onChange={e => setOtp(e.target.value)}
            placeholder="000000" style={{ ...inputSt(P), letterSpacing: '0.3em', fontSize: 22, textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} />
          <button onClick={handleVerifyOtp} disabled={loading} style={btn(P)}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button onClick={() => { setStep('auth'); setOtpSent(false); setOtp(''); }}
            style={{ ...btn(P, true), marginTop: 10, fontSize: 13 }}>
            Change number
          </button>
          {authError && <div style={{ marginTop: 12, color: '#FF6B6B', fontSize: 13, textAlign: 'center' }}>{authError}</div>}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: ROLE SELECTION
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'role') {
    const selfSelectableRoles = config.roles.filter(r => r.is_self_selectable);
    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, stepIndex.role, P)}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Who are you here as?</h2>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24 }}>
            This helps us show you the most relevant people and opportunities.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selfSelectableRoles.map(role => (
              <button key={role.key}
                onClick={() => { setSelectedRole(role.key); setStep('profile'); }}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  border: `1.5px solid ${selectedRole === role.key ? P : 'rgba(255,255,255,0.15)'}`,
                  background: selectedRole === role.key ? `${P}22` : 'rgba(255,255,255,0.05)',
                  color: '#F5EFE3',
                  fontFamily: 'inherit',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                <span>{role.label}</span>
                {role.description && <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.55 }}>{role.description}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: PROFILE
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'profile') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#F5EFE3', fontFamily: 'sans-serif', padding: '24px 24px 80px' }}>
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          {stepDots(totalSteps, stepIndex.profile, P)}

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {config.profile_step_label}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
            Fields marked * are required.
          </p>

          {config.profile_fields.map(field =>
            renderField(field, profileValues, setProfileValues)
          )}

          {authError && <div style={{ marginBottom: 12, color: '#FF6B6B', fontSize: 13 }}>{authError}</div>}

          <button onClick={saveProfile} disabled={loading} style={btn(P)}>
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP: PRESENCE / INTENT
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'presence') {
    return (
      <div style={screen(BG)}>
        <div style={card}>
          {stepDots(totalSteps, stepIndex.presence, P)}

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {config.presence_step_label}
          </h2>
          <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>
            This is visible to others in the space while you are here.{' '}
            {config.allow_presence_opt_out && 'You can skip this to stay invisible.'}
          </p>

          {config.presence_fields.map(field =>
            renderField(
              field as any,
              presenceValues,
              setPresenceValues
            )
          )}

          {authError && <div style={{ marginBottom: 12, color: '#FF6B6B', fontSize: 13 }}>{authError}</div>}

          <button onClick={savePresence} disabled={loading} style={btn(P)}>
            {loading ? 'Entering…' : 'Enter the space'}
          </button>

          {config.allow_presence_opt_out && (
            <button onClick={skipPresence}
              style={{ background: 'none', border: 'none', color: P, cursor: 'pointer', marginTop: 14, fontSize: 13, textDecoration: 'underline', alignSelf: 'center', display: 'block', width: '100%', textAlign: 'center' }}>
              Enter without being visible
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

F_ENTRY_ENTRYFLOW_TSX

cat > src/app/entry/useEntryConfig.ts << 'F_ENTRY_USEENTRYCONFIG_TS'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getDefaultEntryConfig, type EntryConfig, type EnvironmentType } from './types';

interface UseEntryConfigResult {
  config: EntryConfig | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the entry configuration for a space.
 *
 * Priority:
 * 1. If the space has a custom entry_config JSON column → use that.
 * 2. Otherwise look up the organisation's environment_type and return
 *    the matching default config, merged with the org's branding.
 * 3. Fall back to COWORKING_CONFIG if nothing is found.
 *
 * This means operators get a sensible default immediately on setup,
 * and can progressively override fields via the operator dashboard.
 */
export function useEntryConfig(spaceId: string): UseEntryConfigResult {
  const [config, setConfig] = useState<EntryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Fetch the space + its parent organisation
      const { data: space, error: spaceErr } = await supabase
        .from('spaces')
        .select(`
          id,
          name,
          type,
          entry_config,
          organization_id,
          organizations (
            id,
            name,
            description,
            website,
            logo_url,
            environment_type,
            primary_color,
            background_color,
            entry_config
          )
        `)
        .eq('id', spaceId)
        .single();

      if (spaceErr || !space) {
        setError('Space not found.');
        setLoading(false);
        return;
      }

      const org = (space as any).organizations;

      // 2. Determine environment type
      const envType: EnvironmentType =
        (org?.environment_type as EnvironmentType) ||
        (space.type as EnvironmentType) ||
        'coworking';

      // 3. Start from the default config for this environment type
      const base = getDefaultEntryConfig(envType);

      // 4. Merge org-level branding
      const withBranding: EntryConfig = {
        ...base,
        org_name: org?.name || space.name || '',
        org_logo_url: org?.logo_url || undefined,
        welcome_headline: base.welcome_headline.replace('the space', org?.name || 'the space'),
        primary_color: org?.primary_color || base.primary_color,
        background_color: org?.background_color || base.background_color,
      };

      // 5. If the org has a custom entry_config JSON, deep-merge it on top
      //    This lets operators override specific fields without losing defaults.
      const orgCustom = org?.entry_config
        ? (typeof org.entry_config === 'string' ? JSON.parse(org.entry_config) : org.entry_config)
        : null;

      // 6. If the space itself has entry_config, that wins over org-level
      const spaceCustom = (space as any).entry_config
        ? (typeof (space as any).entry_config === 'string'
            ? JSON.parse((space as any).entry_config)
            : (space as any).entry_config)
        : null;

      const final: EntryConfig = {
        ...withBranding,
        ...(orgCustom || {}),
        ...(spaceCustom || {}),
      };

      setConfig(final);
      setLoading(false);
    };

    load();
  }, [spaceId]);

  return { config, loading, error };
}

F_ENTRY_USEENTRYCONFIG_TS

cat > src/app/hooks/useIdentity.ts << 'F_USEIDENTITY_TS'
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Space context + the persistent profile fields that travel with a
// participant's identity. Auth itself (anonymous / magic link / phone /
// institutional / invite code) is now owned entirely by EntryFlow
// (src/app/entry/) — this hook no longer signs anyone in on its own.
// EntryFlow calls hydrateFromEntry() once it completes, using the data
// it already wrote to `profiles`, rather than this hook re-fetching.
export function useIdentity(alert: (msg: string) => void) {
  const [spaceId, setSpaceId] = useState<string>('');
  const [spaceInput, setSpaceInput] = useState('');
  const [spaceName, setSpaceName] = useState('');

  const [profileId, setProfileId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [standingNeed, setStandingNeed] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userLinkedin, setUserLinkedin] = useState('');
  const [showContactSharing, setShowContactSharing] = useState(false);

  // Bootstrap: space from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('space');
    if (s) {
      setSpaceId(s);
      localStorage.setItem('toruok_space_id', s);
    } else {
      const saved = localStorage.getItem('toruok_space_id');
      if (saved) setSpaceId(saved);
    }
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    supabase.from('spaces').select('name').eq('id', spaceId).single()
      .then(({ data }) => { if (data) setSpaceName(data.name); });
  }, [spaceId]);

  const confirmSpaceCode = () => {
    if (!spaceInput.trim()) return;
    setSpaceId(spaceInput.trim());
    localStorage.setItem('toruok_space_id', spaceInput.trim());
  };

  // Called once EntryFlow completes (new entry or a returning, already-
  // hydrated session) — populates local state from what EntryFlow
  // already persisted, instead of a second redundant DB fetch.
  const hydrateFromEntry = (uid: string, data: Record<string, string>) => {
    setProfileId(uid);
    setFullName(data.full_name || '');
    setRole(data.title || '');
    setDomain(data.domain || '');
    setCapabilities(data.capabilities || '');
    setStandingNeed(data.standing_need || '');
    setUserPhone(data.phone || '');
    setUserLinkedin(data.linkedin || '');
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      alert('Add your name first.');
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: profileId, name: fullName, title: role, domain, phone: userPhone, linkedin: userLinkedin,
      capabilities, standing_need: standingNeed,
    });
    if (error) {
      alert('Save failed — try again.');
      return;
    }
    alert('Profile saved.');
    return true;
  };

  return {
    spaceId, spaceInput, setSpaceInput, spaceName, confirmSpaceCode,
    profileId, hydrateFromEntry,
    fullName, setFullName, role, setRole, domain, setDomain,
    capabilities, setCapabilities, standingNeed, setStandingNeed,
    userPhone, setUserPhone, userLinkedin, setUserLinkedin,
    showContactSharing, setShowContactSharing,
    saveProfile,
  };
}

F_USEIDENTITY_TS

cat > src/app/page.tsx << 'F_PAGE_TSX'
'use client';

import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Lens, NavTab } from './types';
import { useAlert } from './hooks/useAlert';
import { useIdentity } from './hooks/useIdentity';
import { useDiscover } from './hooks/useDiscover';
import { usePresence } from './hooks/usePresence';
import { useConnections } from './hooks/useConnections';
import { useChat } from './hooks/useChat';
import { useApplications } from './hooks/useApplications';
import { SystemAlert } from './components/SystemAlert';
import { SpaceGate } from './components/SpaceGate';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DiscoverTab } from './components/DiscoverTab';
import { ConnectionsTab } from './components/ConnectionsTab';
import { JourneyTab } from './components/JourneyTab';
import { IntentModal } from './components/IntentModal';
import { ProfilePanel } from './components/ProfilePanel';
import { ConnectionDetailModal } from './components/ConnectionDetailModal';
import EntryFlow from './entry/EntryFlow';
import { useEntryConfig } from './entry/useEntryConfig';

// Thin wrapper: loads the entry config for a space, then renders
// EntryFlow with it. Keeps config-loading out of the main orchestrator.
function EntryFlowGate({ spaceId, onComplete }: {
  spaceId: string; onComplete: (profileId: string, profileData: Record<string, string>) => void;
}) {
  const { config, loading, error } = useEntryConfig(spaceId);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ opacity: 0.5 }}>Loading space…</div>
      </div>
    );
  }
  if (error || !config) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{ opacity: 0.7, marginBottom: 16 }}>Space not found or unavailable.</div>
        <div style={{ opacity: 0.4, fontSize: 13 }}>{error}</div>
      </div>
    );
  }
  return <EntryFlow config={config} spaceId={spaceId} onComplete={onComplete} />;
}

export default function ToruokSpaceApp() {
  const { systemAlert, alert } = useAlert();
  const identity = useIdentity(alert);
  const discover = useDiscover(identity.spaceId);

  const [activeNav, setActiveNav] = useState<NavTab>('discover');
  const [activeLens, setActiveLens] = useState<Lens>('foryou');
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);

  const presence = usePresence(
    identity.profileId, identity.spaceId,
    {
      fullName: identity.fullName, role: identity.role, domain: identity.domain,
      userPhone: identity.userPhone, userLinkedin: identity.userLinkedin,
      capabilities: identity.capabilities, standingNeed: identity.standingNeed,
    },
    discover.fetchPresentPeople, alert
  );

  const connections = useConnections(identity.profileId, identity.spaceId, setActiveNav, alert);
  const chat = useChat(connections.selectedConnection, identity.profileId, identity.spaceId);
  const applications = useApplications(identity.profileId, alert);

  const handleEntryComplete = (uid: string, profileData: Record<string, string>) => {
    identity.hydrateFromEntry(uid, profileData);
    setEntryComplete(true);
  };

  if (!identity.spaceId) {
    return <SpaceGate spaceInput={identity.spaceInput} setSpaceInput={identity.setSpaceInput} confirmSpaceCode={identity.confirmSpaceCode} />;
  }

  if (!entryComplete) {
    return <EntryFlowGate spaceId={identity.spaceId} onComplete={handleEntryComplete} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif', paddingBottom: 70 }}>
      <SystemAlert message={systemAlert} />
      <Header fullName={identity.fullName} spaceName={identity.spaceName} onAvatarClick={() => setShowProfilePanel(true)} />

      {activeNav === 'discover' && (
        <DiscoverTab
          isVisible={presence.isVisible} onBecomeVisible={() => presence.setShowIntentModal(true)}
          activeLens={activeLens} setActiveLens={setActiveLens}
          presentPeople={discover.presentPeople} profileId={identity.profileId}
          throttled={connections.throttled} triggerHandshake={connections.triggerHandshake}
          opportunities={discover.opportunities} resources={discover.resources} activities={discover.activities}
          appliedOpportunityIds={applications.appliedOpportunityIds} applyToOpportunity={applications.applyToOpportunity}
        />
      )}

      {activeNav === 'connections' && (
        <ConnectionsTab
          connections={connections.connections} incomingHandshakes={connections.incomingHandshakes}
          incomingTier2Requests={connections.incomingTier2Requests}
          acceptHandshake={connections.acceptHandshake} declineHandshake={connections.declineHandshake}
          resolveTier2Request={connections.resolveTier2Request}
          setSelectedConnection={connections.setSelectedConnection}
          isScanning={connections.isScanning} startQrScanner={connections.startQrScanner} stopQrScanner={connections.stopQrScanner}
        />
      )}

      {activeNav === 'journey' && <JourneyTab connections={connections.connections} />}

      <BottomNav activeNav={activeNav} setActiveNav={setActiveNav} />

      {presence.showIntentModal && (
        <IntentModal
          fullName={identity.fullName} setFullName={identity.setFullName}
          role={identity.role} setRole={identity.setRole}
          domain={identity.domain} setDomain={identity.setDomain}
          need={presence.need} setNeed={presence.setNeed}
          offer={presence.offer} setOffer={presence.setOffer}
          selectedStation={presence.selectedStation} setSelectedStation={presence.setSelectedStation}
          confirmVisibility={presence.confirmVisibility}
        />
      )}

      {showProfilePanel && (
        <ProfilePanel
          fullName={identity.fullName} setFullName={identity.setFullName}
          role={identity.role} setRole={identity.setRole}
          domain={identity.domain} setDomain={identity.setDomain}
          capabilities={identity.capabilities} setCapabilities={identity.setCapabilities}
          standingNeed={identity.standingNeed} setStandingNeed={identity.setStandingNeed}
          userPhone={identity.userPhone} setUserPhone={identity.setUserPhone}
          userLinkedin={identity.userLinkedin} setUserLinkedin={identity.setUserLinkedin}
          showContactSharing={identity.showContactSharing} setShowContactSharing={identity.setShowContactSharing}
          onSave={async () => { const ok = await identity.saveProfile(); if (ok) setShowProfilePanel(false); }}
          onClose={() => setShowProfilePanel(false)}
        />
      )}

      {connections.selectedConnection && (
        <ConnectionDetailModal
          selectedConnection={connections.selectedConnection}
          onClose={() => connections.setSelectedConnection(null)}
          profileId={identity.profileId}
          messages={chat.messages} messageInput={chat.messageInput} setMessageInput={chat.setMessageInput}
          sendMessage={chat.sendMessage} peerStation={chat.peerStation}
          stickyNoteText={connections.stickyNoteText} setStickyNoteText={connections.setStickyNoteText}
          saveStickyNote={connections.saveStickyNote}
          showTier2Options={connections.showTier2Options} setShowTier2Options={connections.setShowTier2Options}
          reqPhoneCheckbox={connections.reqPhoneCheckbox} setReqPhoneCheckbox={connections.setReqPhoneCheckbox}
          reqLinkedinCheckbox={connections.reqLinkedinCheckbox} setReqLinkedinCheckbox={connections.setReqLinkedinCheckbox}
          submitTier2Request={connections.submitTier2Request}
        />
      )}

      <Analytics />
    </div>
  );
}

F_PAGE_TSX

cat > src/app/operator/types.ts << 'F_OP_TYPES_TS'
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

F_OP_TYPES_TS

echo '== Verify =='
npx tsc --noEmit

echo ''
echo 'Run schema_v2_section26_entryflow.sql in Supabase FIRST — this code'
echo 'depends on profiles.metadata/role_type and organizations/spaces.entry_config.'
echo ''
echo 'Commit precisely:'
echo '  git add src/app/entry/ src/app/hooks/useIdentity.ts src/app/page.tsx src/app/operator/types.ts'
echo '  git status'
echo "  git commit -m 'Integrate configurable entry flow, merged into current modular structure'"
echo '  git push'