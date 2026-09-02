import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';

export interface Conversation {
  profileId: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export function useChat(profileId: string, spaceId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  const syncConversations = useCallback(async () => {
    if (!profileId) return;

    const { data: conns } = await supabase
      .from('connections')
      .select('connected_profile_id, profiles!connections_connected_profile_id_fkey(name)')
      .eq('profile_id', profileId)
      .eq('handshake_accepted', true);

    if (!conns) return;

    const convList: Conversation[] = await Promise.all(
      conns.map(async (c: any) => {
        const otherId = c.connected_profile_id;
        const name = c.profiles?.name || otherId.slice(0, 8);

        const { data: msgs } = await supabase
          .from('messages')
          .select('body, created_at, read_at, recipient_profile_id')
          .or(`and(sender_profile_id.eq.${profileId},recipient_profile_id.eq.${otherId}),and(sender_profile_id.eq.${otherId},recipient_profile_id.eq.${profileId})`)
          .order('created_at', { ascending: false })
          .limit(1);

        const last = msgs?.[0];
        const unread = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_profile_id', otherId)
          .eq('recipient_profile_id', profileId)
          .is('read_at', null);

        return {
          profileId: otherId,
          name,
          lastMessage: last?.body || '',
          lastAt: last?.created_at || '',
          unread: unread.count || 0,
        };
      })
    );

    convList.sort((a, b) => (b.lastAt > a.lastAt ? 1 : -1));
    setConversations(convList);
    setTotalUnread(convList.reduce((s, c) => s + c.unread, 0));
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    syncConversations();
    const channel = supabase
      .channel(`chat_overview_${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, syncConversations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId, syncConversations]);

  const openConversation = useCallback(async (otherId: string) => {
    setActiveConvId(otherId);
    setMessages([]);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_profile_id.eq.${profileId},recipient_profile_id.eq.${otherId}),and(sender_profile_id.eq.${otherId},recipient_profile_id.eq.${profileId})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_profile_id', otherId)
      .eq('recipient_profile_id', profileId)
      .is('read_at', null);

    syncConversations();
  }, [profileId, syncConversations]);

  useEffect(() => {
    if (!activeConvId || !profileId) return;
    const channel = supabase
      .channel(`messages_${profileId}_${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message;
        const relevant =
          (m.sender_profile_id === profileId && m.recipient_profile_id === activeConvId) ||
          (m.sender_profile_id === activeConvId && m.recipient_profile_id === profileId);
        if (relevant) {
          setMessages(prev => [...prev, m]);
          if (m.recipient_profile_id === profileId) {
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).then(() => {});
            syncConversations();
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, profileId, syncConversations]);

  const sendMessage = async (recipientId?: string) => {
    const to = recipientId || activeConvId;
    if (!messageInput.trim() || !to) return;
    const body = messageInput.trim();
    setMessageInput('');
    await supabase.from('messages').insert({
      space_id: spaceId,
      sender_profile_id: profileId,
      recipient_profile_id: to,
      body,
    });
  };

  const closeConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setMessageInput('');
  };

  return {
    conversations,
    totalUnread,
    activeConvId,
    messages,
    messageInput,
    setMessageInput,
    openConversation,
    closeConversation,
    sendMessage,
    syncConversations,
  };
}
