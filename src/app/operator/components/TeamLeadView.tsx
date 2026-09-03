'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Org, Space, Zone, Team, TeamLead, TeamOperator, Schedule, Announcement, Item,
  emptyOpportunity, emptySchedule, emptyAnnouncement,
} from '../types';
import { OperatorShell } from './OperatorShell';
import { TeamWorkspace } from './TeamWorkspace';

export function TeamLeadView({ org, space, teams, signOut }: { org: Org | null; space: Space | null; teams: Team[]; signOut: () => void }) {
  const [activeTeamId, setActiveTeamId] = useState<string>(teams[0]?.id || '');
  const [zones, setZones] = useState<Zone[]>([]);
  const [leads, setLeads] = useState<TeamLead[]>([]);
  const [operators, setOperators] = useState<TeamOperator[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [opportunities, setOpportunities] = useState<Item[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [operatorInviteEmail, setOperatorInviteEmail] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ ...emptySchedule });
  const [oppForm, setOppForm] = useState({ ...emptyOpportunity });
  const [annForm, setAnnForm] = useState({ ...emptyAnnouncement });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (space) supabase.from('zones').select('*').eq('space_id', space.id).then(({ data }) => setZones(data || []));
  }, [space?.id]);

  useEffect(() => {
    if (activeTeamId) loadTeam(activeTeamId);
  }, [activeTeamId]);

  const loadTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const [{ data: ld }, { data: ops }, { data: sched }, { data: opps }, { data: anns }] = await Promise.all([
      supabase.from('team_leads').select('*').eq('team_id', teamId),
      supabase.from('team_operators').select('*').eq('team_id', teamId),
      supabase.from('schedules').select('*').eq('team_id', teamId),
      supabase.from('opportunities').select('*').eq('team_id', teamId),
      supabase.from('announcements').select('*').eq('team_id', teamId).order('created_at', { ascending: false }),
    ]);
    setLeads(ld || []);
    setOperators(ops || []);
    setSchedules(sched || []);
    setOpportunities(opps || []);
    setAnnouncements(anns || []);
    if (team?.primary_zone_id) {
      const { data: r } = await supabase.from('presence').select('*, profiles(name, title, domain)').eq('zone_id', team.primary_zone_id);
      setRoster(r || []);
    } else {
      setRoster([]);
    }
  };

  const inviteOperator = async () => {
    if (!activeTeamId || !operatorInviteEmail.trim()) return;
    const { error } = await supabase.from('team_operators').insert({ team_id: activeTeamId, invite_email: operatorInviteEmail.trim() });
    if (error) { window.alert(error.message); return; }
    setOperatorInviteEmail(''); loadTeam(activeTeamId);
  };
  const addSchedule = async () => {
    if (!activeTeamId || !scheduleForm.course_name.trim()) return;
    const { error } = await supabase.from('schedules').insert({
      team_id: activeTeamId, course_code: scheduleForm.course_code || null, course_name: scheduleForm.course_name,
      zone_id: scheduleForm.zone_id || null, day_of_week: scheduleForm.day_of_week || null,
      start_time: scheduleForm.start_time || null, end_time: scheduleForm.end_time || null,
    });
    if (error) { window.alert(error.message); return; }
    setScheduleForm({ ...emptySchedule }); loadTeam(activeTeamId);
  };
  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('toruok-media').upload(path, file);
    if (error) { window.alert(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from('toruok-media').getPublicUrl(path);
    return data.publicUrl;
  };
  const handleOppImg = async (f: File) => { setUploadingImage(true); const u = await uploadImage(f); if (u) setOppForm(p => ({ ...p, image_url: u })); setUploadingImage(false); };
  const addOpportunity = async () => {
    if (!activeTeamId || !space || !oppForm.title.trim()) return;
    const { error } = await supabase.from('opportunities').insert({
      space_id: space.id, team_id: activeTeamId, title: oppForm.title, type: oppForm.type,
      provider: oppForm.provider || null, description: oppForm.description || null,
      eligibility: oppForm.eligibility || null, compensation: oppForm.compensation || null,
      deadline: oppForm.deadline ? new Date(oppForm.deadline).toISOString() : null,
      application_method: oppForm.application_method || null, zone_id: oppForm.zone_id || null,
      location: oppForm.location || null, status: oppForm.status, image_url: oppForm.image_url || null,
    });
    if (error) { window.alert(error.message); return; }
    setOppForm({ ...emptyOpportunity }); loadTeam(activeTeamId);
  };
  const addAnnouncement = async () => {
    if (!activeTeamId || !annForm.title.trim()) return;
    const { error } = await supabase.from('announcements').insert({ team_id: activeTeamId, title: annForm.title, body: annForm.body || null });
    if (error) { window.alert(error.message); return; }
    setAnnForm({ ...emptyAnnouncement }); loadTeam(activeTeamId);
  };

  const activeTeam = teams.find(t => t.id === activeTeamId) || null;
  const nav = [{ id: 'workspace', label: 'Department', icon: '🎓' }];

  return (
    <OperatorShell
      orgName={org?.name || 'Operator'}
      spaceName={activeTeam ? activeTeam.name : 'Team lead'}
      roleBadge="Head of Department"
      roleColor="#8A6DE2"
      nav={nav}
      activeTab="workspace"
      onTab={() => {}}
      onSignOut={signOut}
    >
      {teams.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {teams.map(t => (
            <button key={t.id} onClick={() => setActiveTeamId(t.id)} style={{
              padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13,
              background: activeTeamId === t.id ? '#E26D34' : 'rgba(255,255,255,0.08)',
              color: activeTeamId === t.id ? '#fff' : '#F5EFE3',
              fontWeight: activeTeamId === t.id ? 600 : 400,
            }}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {activeTeam && (
        <TeamWorkspace
          team={activeTeam} zones={zones} canManage
          leads={leads}
          operators={operators} operatorInviteEmail={operatorInviteEmail} setOperatorInviteEmail={setOperatorInviteEmail} inviteOperator={inviteOperator}
          schedules={schedules} scheduleForm={scheduleForm} setScheduleForm={setScheduleForm} addSchedule={addSchedule}
          opportunities={opportunities} oppForm={oppForm} setOppForm={setOppForm} addOpportunity={addOpportunity}
          uploadingImage={uploadingImage} onImageSelected={handleOppImg}
          roster={roster}
          announcements={announcements} annForm={annForm} setAnnForm={setAnnForm} addAnnouncement={addAnnouncement}
        />
      )}

      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.4, lineHeight: 1.7 }}>
        You lead {teams.length} team{teams.length === 1 ? '' : 's'}. Assigning a new HOD or creating departments happens at the Space Admin level.
      </div>
    </OperatorShell>
  );
}

