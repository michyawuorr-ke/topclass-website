import React from 'react';

// Same stroke-based style as the participant app's BottomNav icons:
// fill=accent when active, otherwise stroke=currentColor, 1.8 stroke
// width, rounded caps/joins. Each is a function of (active) so the
// caller controls the accent color the same way BottomNav does.
const accent = '#E26D34';

function icon(paths: React.ReactNode) {
  return (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? accent : 'none'} stroke={active ? accent : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}

export const OperatorIcons: Record<string, (active: boolean) => React.ReactNode> = {
  home: icon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),

  spaces: icon(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),

  team: icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),

  sso: icon(<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />),

  departments: icon(<><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /><path d="M22 10v6" /></>),

  buildings: icon(<><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-5a3 3 0 0 1 6 0v5" /><line x1="4" y1="21" x2="20" y2="21" /></>),

  publish: icon(<><path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M15 8a3 3 0 0 1 0 8" /><path d="M18 5a7 7 0 0 1 0 14" /></>),

  applications: icon(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="13" y2="18" /></>),

  rooms: icon(<><rect x="5" y="2" width="14" height="20" rx="1" /><circle cx="15" cy="12" r="1" /></>),

  schedules: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="10" x2="21" y2="10" /></>),

  notices: icon(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>),

  opportunities: icon(<polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />),

  resources: icon(<><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5" /><line x1="12" y1="13" x2="12" y2="21" /></>),

  activities: icon(<><line x1="4" y1="22" x2="4" y2="4" /><path d="M4 4h14l-3 4 3 4H4" /></>),

  classes: icon(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>),

  attendance: icon(<><circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" /></>),

  materials: icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>),
};

