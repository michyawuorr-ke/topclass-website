import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { OperatorRole, Org, Space, Zone } from '../types';

export interface RoleContext {
  role: OperatorRole;
  org: Org | null;
  // Space Admin: the single space they manage
  managedSpace: Space | null;
  // Zone Operator: the zones they can publish into
  managedZones: Zone[];
  loading: boolean;
}

export function useOperatorRole(userId: string | null, userEmail: string | null): RoleContext {
  const [role, setRole] = useState<OperatorRole>('none');
  const [org, setOrg] = useState<Org | null>(null);
  const [managedSpace, setManagedSpace] = useState<Space | null>(null);
  const [managedZones, setManagedZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const resolve = async () => {
      setLoading(true);

      // 1. Super admin: owns an org, or is org member with owner/admin role
      const { data: owned } = await supabase
        .from('organizations').select('*').eq('owner_id', userId).maybeSingle();
      if (owned) {
        setOrg(owned); setRole('super_admin'); setLoading(false); return;
      }

      const { data: membership } = await supabase
        .from('organization_members').select('organization_id, role')
        .eq('user_id', userId).limit(1).maybeSingle();
      if (membership && ['owner', 'admin', 'staff'].includes(membership.role)) {
        const { data: memberOrg } = await supabase
          .from('organizations').select('*').eq('id', membership.organization_id).maybeSingle();
        if (memberOrg) {
          setOrg(memberOrg);
          setRole(membership.role === 'staff' ? 'space_admin' : 'super_admin');
          setLoading(false); return;
        }
      }

      // 2. Space admin: has a space_admins row
      const { data: saRow } = await supabase
        .from('space_admins').select('space_id').eq('user_id', userId).limit(1).maybeSingle();
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

      // 3. Zone operator: has zone_publishers rows
      const { data: zpRows } = await supabase
        .from('zone_publishers').select('zone_id').eq('user_id', userId);
      if (zpRows && zpRows.length > 0) {
        const zoneIds = zpRows.map((r: any) => r.zone_id);
        const { data: zones } = await supabase
          .from('zones').select('*').in('id', zoneIds);
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

      setRole('none');
      setLoading(false);
    };

    resolve();
  }, [userId, userEmail]);

  return { role, org, managedSpace, managedZones, loading };
}
