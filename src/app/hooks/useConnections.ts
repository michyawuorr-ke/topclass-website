import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Presence, NavTab } from '../types';

export function useConnections(profileId: string, spaceId: string, setActiveNav: (tab: NavTab) => void, alert: (msg: string) => void) {
  const [connections, setConnections] = useState<any[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<any[]>([]);
  const [incomingTier2Requests, setIncomingTier2Requests] = useState<any[]>([]);
  const [throttled, setThrottled] = useState<Record<string, boolean>>({});
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const [reqPhoneCheckbox, setReqPhoneCheckbox] = useState(false);
  const [reqLinkedinCheckbox, setReqLinkedinCheckbox] = useState(false);
  const [stickyNoteText, setStickyNoteText] = useState('');
  const [showTier2Options, setShowTier2Options] = useState(false);
  const [nameCache, setNameCache] = useState<Record<string, string>>({});

  const syncConnections = async () => {
    if (!profileId) return;

    const { data: myConnections } = await supabase
      .from('connections')
      .select('*, profiles!connections_connected_profile_id_fkey(name)')
      .eq('profile_id', profileId);

    if (myConnections) {
      const live = myConnections.filter((item: any) => {
        if (item.handshake_accepted) return true;
        const age = (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 1000;
        if (age >= 180) {
          supabase.from('connections').delete().eq('id', item.id).then(() => {});
          return false;
        }
        return true;
      });
      setConnections(live);

      const cache: Record<string, string> = {};
      live.forEach((c: any) => {
        if (c.profiles?.name) cache[c.connected_profile_id] = c.profiles.name;
      });
      setNameCache(prev => ({ ...prev, ...cache }));
    }

    const { data: incoming } = await supabase
      .from('connections')
      .select('*')
      .eq('profile_id', profileId)
      .eq('handshake_accepted', false);
    if (incoming) {
      setIncomingHandshakes(incoming.filter((r: any) => {
        const age = (Date.now() - new Date(r.created_at || Date.now()).getTime()) / 1000;
        return age < 5;
      }));
    }

    const { data: t2 } = await supabase
      .from('connections')
      .select('*')
      .eq('connected_profile_id', profileId)
      .eq('tier2_request_pending', true);
    if (t2) setIncomingTier2Requests(t2);
  };

  useEffect(() => {
    if (!profileId) return;
    syncConnections();
    const channel = supabase
      .channel('realtime_connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, syncConnections)
      .subscribe();
    const clock = setInterval(syncConnections, 5000);
    return () => { supabase.removeChannel(channel); clearInterval(clock); };
  }, [profileId]);

  useEffect(() => {
    if (selectedConnection) setStickyNoteText(selectedConnection.sticky_note || '');
  }, [selectedConnection]);

  const getNameFor = (id: string) => nameCache[id] || id.slice(0, 8);

  const triggerHandshake = async (target: Presence) => {
    if (target.profile_id === profileId || throttled[target.profile_id]) return;
    setThrottled(prev => ({ ...prev, [target.profile_id]: true }));
    await supabase.from('connections').insert({
      profile_id: target.profile_id,
      connected_profile_id: profileId,
      space_id: spaceId,
      handshake_accepted: false,
    });
    alert(`Handshake sent to ${target.profiles?.name?.split(' ')[0] || 'them'}`);
    setTimeout(() => setThrottled(prev => ({ ...prev, [target.profile_id]: false })), 4000);
  };

  const acceptHandshake = async (request: any) => {
    setIncomingHandshakes(prev => prev.filter(h => h.id !== request.id));
    await supabase.from('connections').update({ handshake_accepted: true }).eq('id', request.id);
    await supabase.from('connections').insert({
      profile_id: profileId,
      connected_profile_id: request.connected_profile_id,
      space_id: spaceId,
      handshake_accepted: true,
    });
    alert('Connection made.');
    setSelectedConnection(null);
    setActiveNav('connections');
  };

  const declineHandshake = async (id: string) => {
    setIncomingHandshakes(prev => prev.filter(h => h.id !== id));
    await supabase.from('connections').delete().eq('id', id);
    setSelectedConnection(null);
  };

  const saveStickyNote = async () => {
    if (!selectedConnection) return;
    await supabase.from('connections').update({ sticky_note: stickyNoteText }).eq('id', selectedConnection.id);
    setSelectedConnection((prev: any) => prev ? { ...prev, sticky_note: stickyNoteText } : null);
    alert('Note saved.');
  };

  const submitTier2Request = async () => {
    if (!selectedConnection) return;
    await supabase.from('connections').update({
      tier2_request_pending: true,
      requested_phone: reqPhoneCheckbox,
      requested_linkedin: reqLinkedinCheckbox,
    }).eq('profile_id', profileId).eq('connected_profile_id', selectedConnection.connected_profile_id);
    alert('Access requested.');
    setShowTier2Options(false);
    setSelectedConnection(null);
  };

  const resolveTier2Request = async (request: any, approvePhone: boolean, approveLinkedin: boolean) => {
    setIncomingTier2Requests(prev => prev.filter(r => r.id !== request.id));
    await supabase.from('connections').update({
      tier2_request_pending: false,
      shared_phone: approvePhone,
      shared_linkedin: approveLinkedin,
    }).eq('profile_id', request.profile_id).eq('connected_profile_id', profileId);
    alert('Permissions saved.');
  };

  return {
    connections, incomingHandshakes, incomingTier2Requests, throttled,
    selectedConnection, setSelectedConnection,
    reqPhoneCheckbox, setReqPhoneCheckbox, reqLinkedinCheckbox, setReqLinkedinCheckbox,
    stickyNoteText, setStickyNoteText, showTier2Options, setShowTier2Options,
    triggerHandshake, acceptHandshake, declineHandshake, saveStickyNote,
    submitTier2Request, resolveTier2Request,
    getNameFor,
  };
}
