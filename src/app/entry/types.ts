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
