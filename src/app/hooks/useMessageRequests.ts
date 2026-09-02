import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface MessageRequest {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  intro_body: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_name?: string;
}

export function useMessageRequests(profileId: string, spaceId: string) {
  const [incomingRequests, setIncomingRequests] = useState<MessageRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<MessageRequest[]>([]);

  const sync = useCallback(async () => {
    if (!profileId) return;
    const { data: inc } = await supabase
      .from('message_requests')
      .select('*, profiles!message_requests_sender_profile_id_fkey(name)')
      .eq('recipient_profile_id', profileId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (inc) {
      setIncomingRequests(inc.map((r: any) => ({ ...r, sender_name: r.profiles?.name })));
    }

    const { data: sent } = await supabase
      .from('message_requests')
      .select('*')
      .eq('sender_profile_id', profileId)
      .order('created_at', { ascending: false });
    if (sent) setSentRequests(sent);
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    sync();
    const channel = supabase
      .channel(`msg_requests_${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_requests' }, sync)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId, sync]);

  const sendRequest = async (recipientId: string, introBody: string) => {
    const existing = sentRequests.find(r => r.recipient_profile_id === recipientId);
    if (existing) return;
    await supabase.from('message_requests').insert({
      sender_profile_id: profileId,
      recipient_profile_id: recipientId,
      space_id: spaceId,
      intro_body: introBody,
      status: 'pending',
    });
    sync();
  };

  const acceptRequest = async (request: MessageRequest, onAccepted: (senderId: string) => void) => {
    await supabase.from('message_requests').update({ status: 'accepted' }).eq('id', request.id);
    await supabase.from('connections').upsert({
      profile_id: profileId,
      connected_profile_id: request.sender_profile_id,
      space_id: spaceId,
      handshake_accepted: true,
    });
    await supabase.from('connections').upsert({
      profile_id: request.sender_profile_id,
      connected_profile_id: profileId,
      space_id: spaceId,
      handshake_accepted: true,
    });
    await supabase.from('messages').insert({
      space_id: spaceId,
      sender_profile_id: request.sender_profile_id,
      recipient_profile_id: profileId,
      body: request.intro_body,
    });
    sync();
    onAccepted(request.sender_profile_id);
  };

  const declineRequest = async (id: string) => {
    await supabase.from('message_requests').update({ status: 'declined' }).eq('id', id);
    sync();
  };

  const requestStatusFor = (recipientId: string) =>
    sentRequests.find(r => r.recipient_profile_id === recipientId)?.status ?? null;

  return {
    incomingRequests,
    sentRequests,
    incomingCount: incomingRequests.length,
    sendRequest,
    acceptRequest,
    declineRequest,
    requestStatusFor,
  };
}
