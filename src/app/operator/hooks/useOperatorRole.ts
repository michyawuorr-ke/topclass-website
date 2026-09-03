import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Team } from '../types';

export type OperatorRole = 'super_admin' | 'space_admin' | 'zone_operator' | 'team_lead' | 'none';

export interface Org {
  id: string; name: string; owner_id: string; approved: boolean;
  description?: string; website?: string; contact_email?: string;
  contact_phone?: string; email_domain?: string | null;
  environment_type?: string; logo_url?: string;
}
export interface Space { id: string; organization_id: string; name: string; type: string; }
export interface Zone  { id: string; space_id: string; name: string; description?: string; capacity?: string; parent_zone_id?: string | null; }

export interface RoleContext {
  role: OperatorRole;
  org: Org | null;
  managedSpace: Space | null;
  managedZones: Zone[];
  managedTeams: Team[];
  loading: boolean;
}

export function useOperatorRole(userId: string | null): RoleContext {
  const [role, setRole]               = useState<OperatorRole>('none');
  const [org, setOrg]                 = useState<Org | null>(null);
  const [managedSpace, setManagedSpace] = useState<Space | null>(null);
  const [managedZones, setManagedZones] = useState<Zone[]>([]);
  const [managedTeams, setManagedTeams] = useState<Team[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    resolve(userId);
  }, [userId]);

  const resolve = async (uid: string) => {
    setLoading(true);

    // 1. Super admin — owns the org
    const { data: owned } = await supabase
      .from('organizations').select('*').eq('owner_id', uid).maybeSingle();
    if (owned) {
      setOrg(owned); setRole('super_admin'); setLoading(false); return;
    }

    // 2. Super admin — org member with owner/admin role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', uid).maybeSingle();
    if (membership && ['owner', 'admin'].includes(membership.role)) {
      const { data: memberOrg } = await supabase
        .from('organizations').select('*').eq('id', membership.organization_id).maybeSingle();
      if (memberOrg) {
        setOrg(memberOrg); setRole('super_admin'); setLoading(false); return;
      }
    }

    // 3. Space admin — staff org member (space-level only)
    if (membership && membership.role === 'staff') {
      const { data: memberOrg } = await supabase
        .from('organizations').select('*').eq('id', membership.organization_id).maybeSingle();
      // Find first space in that org as their managed space
      const { data: firstSpace } = await supabase
        .from('spaces').select('*').eq('organization_id', membership.organization_id).limit(1).maybeSingle();
      if (memberOrg) {
        setOrg(memberOrg);
        setManagedSpace(firstSpace || null);
        setRole('space_admin');
        setLoading(false); return;
      }
    }

    // 4. Space admin — has a space_admins row
    const { data: saRow } = await supabase
      .from('space_admins').select('space_id').eq('user_id', uid).maybeSingle();
    if (saRow) {
      const { data: space } = await supabase
        .from('spaces').select('*').eq('id', saRow.space_id).maybeSingle();
      if (space) {
        const { data: spaceOrg } = await supabase
          .from('organizations').select('*').eq('id', space.organization_id).maybeSingle();
        setOrg(spaceOrg || null);
        setManagedSpace(space);
        setRole('space_admin');
        setLoading(false); return;
      }
    }

    // 5. Zone operator — has zone_publishers rows
    const { data: zpRows } = await supabase
      .from('zone_publishers').select('zone_id').eq('user_id', uid);
    if (zpRows && zpRows.length > 0) {
      const zoneIds = zpRows.map((r: any) => r.zone_id);
      const { data: zones } = await supabase.from('zones').select('*').in('id', zoneIds);
      if (zones && zones.length > 0) {
        const { data: zoneSpace } = await supabase
          .from('spaces').select('*').eq('id', zones[0].space_id).maybeSingle();
        const { data: zoneOrg } = zoneSpace
          ? await supabase.from('organizations').select('*').eq('id', zoneSpace.organization_id).maybeSingle()
          : { data: null };
        setOrg(zoneOrg || null);
        setManagedSpace(zoneSpace || null);
        setManagedZones(zones);
        setRole('zone_operator');
        setLoading(false); return;
      }
    }

    // 6. Team lead — has team_leads rows (HOD/department lead)
    const { data: tlRows } = await supabase
      .from('team_leads').select('team_id').eq('user_id', uid);
    if (tlRows && tlRows.length > 0) {
      const teamIds = tlRows.map((r: any) => r.team_id);
      const { data: teams } = await supabase.from('teams').select('*').in('id', teamIds);
      if (teams && teams.length > 0) {
        const { data: teamSpace } = await supabase
          .from('spaces').select('*').eq('id', teams[0].space_id).maybeSingle();
        const { data: teamOrg } = teamSpace
          ? await supabase.from('organizations').select('*').eq('id', teamSpace.organization_id).maybeSingle()
          : { data: null };
        setOrg(teamOrg || null);
        setManagedSpace(teamSpace || null);
        setManagedTeams(teams);
        setRole('team_lead');
        setLoading(false); return;
      }
    }

    setRole('none');
    setLoading(false);
  };

  return { role, org, managedSpace, managedZones, managedTeams, loading };
}

