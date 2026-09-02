import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Org, Space, Zone, AccessRequest, inputStyle, labelStyle, zonePath } from '../types';

export function RequestAccessForm({ orgs, userId, userEmail, onSwitchToCreate, onSignOut }: {
  orgs: Org[]; userId: string; userEmail: string; onSwitchToCreate: () => void; onSignOut: () => void;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState(orgs[0]?.id ?? '');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [requestType, setRequestType] = useState<'space_admin' | 'zone_publisher'>('zone_publisher');
  const [spaceId, setSpaceId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [note, setNote] = useState('');
  const [existingRequest, setExistingRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: mine } = await supabase.from('access_requests')
        .select('*').eq('requester_user_id', userId).eq('status', 'pending').limit(1).maybeSingle();
      setExistingRequest(mine || null);

      if (selectedOrgId) {
        const { data: spaceData } = await supabase.from('spaces').select('*').eq('organization_id', selectedOrgId);
        setSpaces(spaceData || []);
        const spaceIds = (spaceData || []).map(s => s.id);
        if (spaceIds.length) {
          const { data: zoneData } = await supabase.from('zones').select('*').in('space_id', spaceIds);
          setZones(zoneData || []);
        }
      }
      setLoading(false);
    };
    load();
  }, [selectedOrgId, userId]);

  const submit = async () => {
    if (!spaceId) { window.alert('Choose a space first.'); return; }
    if (requestType === 'zone_publisher' && !zoneId) { window.alert('Choose a zone.'); return; }
    const { error } = await supabase.from('access_requests').insert({
      space_id: requestType === 'space_admin' ? spaceId : null,
      zone_id: requestType === 'zone_publisher' ? zoneId : null,
      requester_user_id: userId,
      requester_email: userEmail,
      note: note.trim() || null,
    });
    if (error) { window.alert(`Could not submit request: ${error.message}`); return; }
    setExistingRequest({ id: 'pending', space_id: spaceId, zone_id: zoneId, requester_user_id: userId, requester_email: userEmail, note: note.trim() || null, status: 'pending', created_at: new Date().toISOString() });
  };

  const wrap: React.CSSProperties = { minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', padding: 24, fontFamily: 'sans-serif', maxWidth: 420, margin: '0 auto' };

  if (loading) return <div style={wrap}>Loading...</div>;

  if (existingRequest) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Request pending</h1>
        <p style={{ opacity: 0.7, marginBottom: 20 }}>
          Your access request is waiting on a space admin to approve it. You'll land straight in the dashboard the next time you sign in once it's approved — no need to come back to this page and check.
        </p>
        <button onClick={onSignOut} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#F5EFE3', border: 'none' }}>Sign out</button>
      </div>
    );
  }

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const zonesForSpace = zones.filter(z => z.space_id === spaceId);

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Request access</h1>
      <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
        {userEmail} matched {orgs.length > 1 ? 'these organizations' : selectedOrg?.name}. Request a role and a space admin will approve or deny it.
      </p>

      {orgs.length > 1 && (
        <>
          <label style={labelStyle}>Organization</label>
          <select value={selectedOrgId} onChange={e => { setSelectedOrgId(e.target.value); setSpaceId(''); setZoneId(''); }} style={inputStyle}>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </>
      )}

      <label style={labelStyle}>I'm requesting</label>
      <select value={requestType} onChange={e => { setRequestType(e.target.value as 'space_admin' | 'zone_publisher'); setZoneId(''); }} style={inputStyle}>
        <option value="zone_publisher">Zone Publisher — post into one department/zone</option>
        <option value="space_admin">Space Admin — full control of a whole space (dean/HOD)</option>
      </select>

      <label style={labelStyle}>Space *</label>
      <select value={spaceId} onChange={e => { setSpaceId(e.target.value); setZoneId(''); }} style={inputStyle}>
        <option value="">Select a space...</option>
        {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {requestType === 'zone_publisher' && spaceId && (
        <>
          <label style={labelStyle}>Zone *</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
            <option value="">Select a zone...</option>
            {zonesForSpace.map(z => <option key={z.id} value={z.id}>{zonePath(z.id, zones)}</option>)}
          </select>
        </>
      )}

      <label style={labelStyle}>Note (optional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. I'm the HOD for Sociology" style={{ ...inputStyle, minHeight: 60 }} />

      <button onClick={submit} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginTop: 4, marginBottom: 12 }}>
        Submit request
      </button>

      <button onClick={onSwitchToCreate} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'transparent', color: '#F5EFE3', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 8 }}>
        Set up a new organization instead
      </button>
      <button onClick={onSignOut} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'transparent', color: '#F5EFE3', opacity: 0.6, border: 'none' }}>
        Sign out
      </button>
    </div>
  );
}
