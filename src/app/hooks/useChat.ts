import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';

// Pre-scan: no chat, just live coordination (the other person's station).
// Post-scan (qr_scanned): real chat, keyed by profile pair with realtime.
export function useChat(selectedConnection: any | null, profileId: string, spaceId: string) {
  const [peerStation, setPeerStation] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const fetchMessages = async (otherId: string) => {
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_profile_id.eq.${profileId},recipient_profile_id.eq.${otherId}),and(sender_profile_id.eq.${otherId},recipient_profile_id.eq.${profileId})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as any);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConnection) return;
    const body = messageInput.trim();
    setMessageInput('');
    await supabase.from('messages').insert({
      space_id: spaceId, sender_profile_id: profileId,
      recipient_profile_id: selectedConnection.connected_profile_id, body,
    });
  };

  useEffect(() => {
    if (!selectedConnection) { setMessages([]); setPeerStation(''); return; }
    const otherId = selectedConnection.connected_profile_id;

    if (selectedConnection.qr_scanned) {
      fetchMessages(otherId);
      const channel = supabase
        .channel(`messages_${profileId}_${otherId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const m = payload.new as Message;
          const relevant =
            (m.sender_profile_id === profileId && m.recipient_profile_id === otherId) ||
            (m.sender_profile_id === otherId && m.recipient_profile_id === profileId);
          if (relevant) setMessages(prev => [...prev, m]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      supabase.from('presence').select('station').eq('profile_id', otherId).eq('space_id', spaceId).single()
        .then(({ data }) => setPeerStation(data?.station || ''));
    }
  }, [selectedConnection]);

  return { peerStation, messages, messageInput, setMessageInput, sendMessage };
}

