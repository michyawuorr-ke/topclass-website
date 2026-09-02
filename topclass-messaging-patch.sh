#!/bin/sh
# topclass-messaging-patch.sh
# Run from ~/topclass-website:
#   bash topclass-messaging-patch.sh
#
# Writes 9 changed files + 1 new migration in place.
# QR scanner removed. Instagram-style message requests.
# LinkedIn-style messaging panel (top-right header icon).

set -e
REPO="$(pwd)"

echo "== Patching topclass-website at $REPO =="

# ── 1. src/app/types.ts ───────────────────────────────────────────────────────
cat > "$REPO/src/app/types.ts" << 'ENDOFFILE'
export type Lens = 'foryou' | 'people' | 'opportunities' | 'resources' | 'activities';
export type NavTab = 'discover' | 'connections' | 'journey';

export interface Presence {
  id: string;
  profile_id: string;
  space_id: string;
  zone_id: string | null;
  intent: string | null;
  need: string | null;
  offer: string | null;
  station: string | null;
  last_seen: string;
  profiles?: { name: string; title: string; domain: string };
}

export interface Opportunity {
  id: string; title: string; type: string; provider: string;
  eligibility: string; location: string; deadline: string; conditions: string; next_steps: string;
  description?: string; compensation?: string; application_method?: string; image_url?: string; status?: string;
}
export interface ResourceItem {
  id: string; name: string; owner: string; availability: string; conditions: string;
  description?: string; capacity?: string; image_url?: string; zones?: { name: string };
}
export interface ActivityItem {
  id: string; title: string; host: string; start_time: string; end_time: string; purpose: string;
  description?: string; category?: string; capacity?: string; registration_link?: string;
  image_url?: string; zones?: { name: string };
}
export interface Message {
  id: string; sender_profile_id: string; recipient_profile_id: string; body: string; created_at: string; read_at: string | null;
}
ENDOFFILE
echo "  wrote src/app/types.ts"

# ── 2. src/app/hooks/useChat.ts ───────────────────────────────────────────────
cat > "$REPO/src/app/hooks/useChat.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "  wrote src/app/hooks/useChat.ts"

# ── 3. src/app/hooks/useMessageRequests.ts (NEW) ──────────────────────────────
cat > "$REPO/src/app/hooks/useMessageRequests.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "  wrote src/app/hooks/useMessageRequests.ts"

# ── 4. src/app/hooks/useConnections.ts ───────────────────────────────────────
cat > "$REPO/src/app/hooks/useConnections.ts" << 'ENDOFFILE'
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
ENDOFFILE
echo "  wrote src/app/hooks/useConnections.ts"

# ── 5. src/app/components/Header.tsx ─────────────────────────────────────────
cat > "$REPO/src/app/components/Header.tsx" << 'ENDOFFILE'
import React from 'react';

export function Header({ fullName, spaceName, onAvatarClick, onMessagingClick, unreadCount }: {
  fullName: string; spaceName: string; onAvatarClick: () => void;
  onMessagingClick: () => void; unreadCount: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={onAvatarClick}
        style={{ width: 38, height: 38, borderRadius: 19, background: '#D4AF37', color: '#1C1C2E', border: 'none', fontWeight: 700, fontSize: 16, flexShrink: 0, cursor: 'pointer' }}>
        {fullName ? fullName[0].toUpperCase() : '?'}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 0.5 }}>YOU ARE IN</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#F5EFE3' }}>{spaceName || 'this space'}</div>
      </div>

      <button onClick={onMessagingClick} style={{
        position: 'relative', background: 'none', border: 'none',
        color: '#F5EFE3', cursor: 'pointer', padding: 6, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#E26D34', color: '#fff',
            borderRadius: 10, minWidth: 16, height: 16,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
ENDOFFILE
echo "  wrote src/app/components/Header.tsx"

# ── 6. src/app/components/MessagingPanel.tsx (NEW) ────────────────────────────
cat > "$REPO/src/app/components/MessagingPanel.tsx" << 'ENDOFFILE'
'use client';
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Conversation } from '../hooks/useChat';
import { MessageRequest } from '../hooks/useMessageRequests';

type View = 'list' | 'thread' | 'requests';

interface Props {
  onClose: () => void;
  profileId: string;
  conversations: Conversation[];
  activeConvId: string | null;
  messages: Message[];
  messageInput: string;
  setMessageInput: (v: string) => void;
  openConversation: (id: string) => void;
  closeConversation: () => void;
  sendMessage: () => void;
  incomingRequests: MessageRequest[];
  incomingCount: number;
  acceptRequest: (r: MessageRequest, cb: (id: string) => void) => void;
  declineRequest: (id: string) => void;
  getNameFor: (id: string) => string;
}

function timeLabel(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function MessagingPanel({
  onClose, profileId,
  conversations, activeConvId, messages, messageInput, setMessageInput,
  openConversation, closeConversation, sendMessage,
  incomingRequests, incomingCount, acceptRequest, declineRequest,
  getNameFor,
}: Props) {
  const [view, setView] = React.useState<View>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeName = activeConvId ? getNameFor(activeConvId) : '';

  const panel: React.CSSProperties = {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: '100%', maxWidth: 420,
    background: '#1C1C2E', display: 'flex', flexDirection: 'column',
    zIndex: 50, boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
    fontFamily: 'sans-serif',
  };
  const headerBar: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  };
  const backBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: '#F5EFE3',
    fontSize: 20, cursor: 'pointer', padding: '0 6px', lineHeight: 1,
  };
  const titleStyle: React.CSSProperties = {
    flex: 1, fontWeight: 700, fontSize: 16, color: '#F5EFE3',
  };
  const closeBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: '#888',
    fontSize: 20, cursor: 'pointer', padding: '0 4px',
  };

  const renderList = () => (
    <>
      <div style={headerBar}>
        <span style={titleStyle}>Messaging</span>
        {incomingCount > 0 && (
          <button onClick={() => setView('requests')} style={{
            background: 'rgba(226,109,52,0.15)', border: '1px solid rgba(226,109,52,0.4)',
            color: '#E26D34', borderRadius: 20, padding: '4px 12px', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ background: '#E26D34', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{incomingCount}</span>
            Requests
          </button>
        )}
        <button style={closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', opacity: 0.4, fontSize: 14 }}>
            No messages yet.<br />Connect with someone to start chatting.
          </div>
        )}
        {conversations.map(conv => (
          <button key={conv.profileId} onClick={() => { openConversation(conv.profileId); setView('thread'); }}
            style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22, flexShrink: 0,
              background: '#D4AF37', color: '#1C1C2E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 18,
            }}>
              {conv.name[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: conv.unread > 0 ? 700 : 500, color: '#F5EFE3', fontSize: 15 }}>
                  {conv.name}
                </span>
                <span style={{ fontSize: 11, color: '#888', flexShrink: 0, marginLeft: 8 }}>
                  {timeLabel(conv.lastAt)}
                </span>
              </div>
              <div style={{
                fontSize: 13, color: conv.unread > 0 ? '#F5EFE3' : '#888',
                fontWeight: conv.unread > 0 ? 600 : 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {conv.lastMessage || 'No messages yet'}
              </div>
            </div>
            {conv.unread > 0 && (
              <div style={{
                background: '#E26D34', color: '#fff', borderRadius: 10,
                minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, padding: '0 5px', flexShrink: 0,
              }}>
                {conv.unread}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );

  const renderThread = () => (
    <>
      <div style={headerBar}>
        <button style={backBtn} onClick={() => { closeConversation(); setView('list'); }}>‹</button>
        <div style={{
          width: 32, height: 32, borderRadius: 16, background: '#D4AF37', color: '#1C1C2E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>
          {activeName[0]?.toUpperCase() || '?'}
        </div>
        <span style={titleStyle}>{activeName}</span>
        <button style={closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.4, fontSize: 13, marginTop: 40 }}>
            Say hello to {activeName} 👋
          </div>
        )}
        {messages.map(m => {
          const mine = m.sender_profile_id === profileId;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              {!mine && (
                <div style={{
                  width: 28, height: 28, borderRadius: 14, background: '#D4AF37', color: '#1C1C2E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end',
                }}>
                  {activeName[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{
                maxWidth: '72%', padding: '10px 14px',
                borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: mine ? '#E26D34' : 'rgba(255,255,255,0.09)',
                color: mine ? '#fff' : '#F5EFE3', fontSize: 14, lineHeight: 1.45,
              }}>
                {m.body}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                  {timeLabel(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Write a message…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 22,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#F5EFE3', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={() => sendMessage()} style={{
          background: '#E26D34', border: 'none', borderRadius: 22,
          color: '#fff', padding: '10px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
        }}>
          Send
        </button>
      </div>
    </>
  );

  const renderRequests = () => (
    <>
      <div style={headerBar}>
        <button style={backBtn} onClick={() => setView('list')}>‹</button>
        <span style={titleStyle}>Message Requests</span>
        <button style={closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {incomingRequests.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', opacity: 0.4, fontSize: 14 }}>
            No pending requests.
          </div>
        )}
        {incomingRequests.map(req => (
          <div key={req.id} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20, background: '#D4AF37', color: '#1C1C2E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {(req.sender_name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#F5EFE3', fontSize: 15 }}>{req.sender_name || req.sender_profile_id.slice(0, 8)}</div>
                <div style={{ fontSize: 11, color: '#888' }}>wants to connect</div>
              </div>
            </div>
            {req.intro_body && (
              <div style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px',
                fontSize: 14, color: '#F5EFE3', marginBottom: 12, lineHeight: 1.45,
              }}>
                "{req.intro_body}"
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => acceptRequest(req, (id) => { openConversation(id); setView('thread'); })}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8, border: 'none',
                  background: '#E26D34', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                }}>
                Accept
              </button>
              <button onClick={() => declineRequest(req.id)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)', background: 'none',
                  color: '#888', cursor: 'pointer', fontSize: 14,
                }}>
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 49 }} onClick={onClose} />
      <div style={panel}>
        {view === 'list' && renderList()}
        {view === 'thread' && renderThread()}
        {view === 'requests' && renderRequests()}
      </div>
    </>
  );
}
ENDOFFILE
echo "  wrote src/app/components/MessagingPanel.tsx"

# ── 7. src/app/components/ConnectionsTab.tsx ─────────────────────────────────
cat > "$REPO/src/app/components/ConnectionsTab.tsx" << 'ENDOFFILE'
import React from 'react';

export function ConnectionsTab({
  connections, incomingHandshakes, incomingTier2Requests,
  acceptHandshake, declineHandshake, resolveTier2Request,
  setSelectedConnection, onMessageRequest, getNameFor,
}: {
  connections: any[]; incomingHandshakes: any[]; incomingTier2Requests: any[];
  acceptHandshake: (r: any) => void; declineHandshake: (id: string) => void;
  resolveTier2Request: (r: any, phone: boolean, linkedin: boolean) => void;
  setSelectedConnection: (c: any) => void;
  onMessageRequest: (recipientId: string, name: string) => void;
  getNameFor: (id: string) => string;
}) {
  const accepted = connections.filter(c => c.handshake_accepted);

  return (
    <div style={{ padding: '0 16px' }}>
      {incomingHandshakes.map(req => (
        <div key={req.id} style={{ background: '#D4AF37', color: '#1C1C2E', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>New handshake request</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => acceptHandshake(req)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Accept</button>
            <button onClick={() => declineHandshake(req.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#1C1C2E', cursor: 'pointer' }}>Decline</button>
          </div>
        </div>
      ))}

      {incomingTier2Requests.map(req => (
        <div key={req.id} style={{ background: 'rgba(212,175,55,0.2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ color: '#F5EFE3', fontWeight: 500 }}>Contact info requested by {getNameFor(req.profile_id)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => resolveTier2Request(req, true, true)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Share all</button>
            <button onClick={() => resolveTier2Request(req, false, false)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#F5EFE3', cursor: 'pointer' }}>Decline</button>
          </div>
        </div>
      ))}

      {accepted.length === 0 && (
        <p style={{ opacity: 0.45, fontSize: 14, marginTop: 24, textAlign: 'center' }}>
          No connections yet.<br />Tap someone on Discover to send a handshake.
        </p>
      )}

      {accepted.map(c => (
        <div key={c.id} style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px',
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: '#D4AF37', color: '#1C1C2E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            {getNameFor(c.connected_profile_id)[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelectedConnection(c)}>
            <div style={{ fontWeight: 600, color: '#F5EFE3' }}>{getNameFor(c.connected_profile_id)}</div>
            {c.sticky_note && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sticky_note}</div>}
          </div>
          <button onClick={() => onMessageRequest(c.connected_profile_id, getNameFor(c.connected_profile_id))}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8, color: '#F5EFE3', padding: '6px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, flexShrink: 0,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Message
          </button>
        </div>
      ))}
    </div>
  );
}
ENDOFFILE
echo "  wrote src/app/components/ConnectionsTab.tsx"

# ── 8. src/app/components/ConnectionDetailModal.tsx ──────────────────────────
cat > "$REPO/src/app/components/ConnectionDetailModal.tsx" << 'ENDOFFILE'
import React from 'react';

export function ConnectionDetailModal({
  selectedConnection, onClose, profileId,
  stickyNoteText, setStickyNoteText, saveStickyNote,
  showTier2Options, setShowTier2Options,
  reqPhoneCheckbox, setReqPhoneCheckbox, reqLinkedinCheckbox, setReqLinkedinCheckbox,
  submitTier2Request, onOpenChat, getNameFor,
}: {
  selectedConnection: any; onClose: () => void; profileId: string;
  stickyNoteText: string; setStickyNoteText: (v: string) => void; saveStickyNote: () => void;
  showTier2Options: boolean; setShowTier2Options: (v: boolean) => void;
  reqPhoneCheckbox: boolean; setReqPhoneCheckbox: (v: boolean) => void;
  reqLinkedinCheckbox: boolean; setReqLinkedinCheckbox: (v: boolean) => void;
  submitTier2Request: () => void;
  onOpenChat: (recipientId: string) => void;
  getNameFor: (id: string) => string;
}) {
  const otherId = selectedConnection.connected_profile_id;
  const otherName = getNameFor(otherId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}
      onClick={onClose}>
      <div style={{
        background: '#1C1C2E', width: '100%', maxHeight: '80vh', overflowY: 'auto',
        borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '20px 20px 32px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22, background: '#D4AF37', color: '#1C1C2E',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18,
          }}>
            {otherName[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#F5EFE3' }}>{otherName}</div>
        </div>

        <button onClick={() => { onClose(); onOpenChat(otherId); }}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, marginBottom: 12,
            background: '#E26D34', color: '#fff', border: 'none', fontWeight: 600,
            fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Message {otherName.split(' ')[0]}
        </button>

        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1, marginBottom: 6 }}>STICKY NOTE</div>
        <textarea
          placeholder="Add a private note about this connection…"
          value={stickyNoteText}
          onChange={e => setStickyNoteText(e.target.value)}
          style={{
            width: '100%', minHeight: 80, padding: 12, marginBottom: 8, borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#F5EFE3', fontSize: 14, resize: 'none', boxSizing: 'border-box',
          }}
        />
        <button onClick={saveStickyNote} style={{
          width: '100%', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
          color: '#F5EFE3', border: 'none', marginBottom: 12, cursor: 'pointer', fontSize: 14,
        }}>
          Save note
        </button>

        {!showTier2Options ? (
          <button onClick={() => setShowTier2Options(true)} style={{
            width: '100%', padding: 10, borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', color: '#F5EFE3', border: 'none', cursor: 'pointer', fontSize: 14,
          }}>
            Request contact info
          </button>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, marginBottom: 10, opacity: 0.7 }}>What would you like to request?</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#F5EFE3', fontSize: 14 }}>
              <input type="checkbox" checked={reqPhoneCheckbox} onChange={e => setReqPhoneCheckbox(e.target.checked)} />
              Phone number
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#F5EFE3', fontSize: 14 }}>
              <input type="checkbox" checked={reqLinkedinCheckbox} onChange={e => setReqLinkedinCheckbox(e.target.checked)} />
              LinkedIn
            </label>
            <button onClick={submitTier2Request} style={{
              width: '100%', padding: 10, borderRadius: 10, background: '#E26D34', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>
              Send request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
ENDOFFILE
echo "  wrote src/app/components/ConnectionDetailModal.tsx"

# ── 9. src/app/page.tsx ───────────────────────────────────────────────────────
cat > "$REPO/src/app/page.tsx" << 'ENDOFFILE'
'use client';

import React, { useState, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Lens, NavTab } from './types';
import { useAlert } from './hooks/useAlert';
import { useIdentity } from './hooks/useIdentity';
import { useDiscover } from './hooks/useDiscover';
import { usePresence } from './hooks/usePresence';
import { useConnections } from './hooks/useConnections';
import { useChat } from './hooks/useChat';
import { useMessageRequests } from './hooks/useMessageRequests';
import { useApplications } from './hooks/useApplications';
import { SystemAlert } from './components/SystemAlert';
import { SpaceGate } from './components/SpaceGate';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DiscoverTab } from './components/DiscoverTab';
import { ConnectionsTab } from './components/ConnectionsTab';
import { JourneyTab } from './components/JourneyTab';
import { IntentModal } from './components/IntentModal';
import { ProfilePanel } from './components/ProfilePanel';
import { ConnectionDetailModal } from './components/ConnectionDetailModal';
import { MessagingPanel } from './components/MessagingPanel';
import EntryFlow from './entry/EntryFlow';
import { useEntryConfig } from './entry/useEntryConfig';

function EntryFlowGate({ spaceId, onComplete }: {
  spaceId: string; onComplete: (profileId: string, profileData: Record<string, string>) => void;
}) {
  const { config, loading, error } = useEntryConfig(spaceId);
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ opacity: 0.5 }}>Loading space…</div>
    </div>
  );
  if (error || !config) return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ opacity: 0.7, marginBottom: 16 }}>Space not found or unavailable.</div>
      <div style={{ opacity: 0.4, fontSize: 13 }}>{error}</div>
    </div>
  );
  return <EntryFlow config={config} spaceId={spaceId} onComplete={onComplete} />;
}

export default function ToruokSpaceApp() {
  const { systemAlert, alert } = useAlert();
  const identity = useIdentity(alert);
  const discover = useDiscover(identity.spaceId);

  const [activeNav, setActiveNav] = useState<NavTab>('discover');
  const [activeLens, setActiveLens] = useState<Lens>('foryou');
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const [pendingMessageRequest, setPendingMessageRequest] = useState<{ recipientId: string; name: string } | null>(null);
  const [introText, setIntroText] = useState('');

  const presence = usePresence(
    identity.profileId, identity.spaceId,
    { fullName: identity.fullName, role: identity.role, domain: identity.domain, userPhone: identity.userPhone, userLinkedin: identity.userLinkedin, capabilities: identity.capabilities, standingNeed: identity.standingNeed },
    discover.fetchPresentPeople, alert
  );

  const connections = useConnections(identity.profileId, identity.spaceId, setActiveNav, alert);
  const chat = useChat(identity.profileId, identity.spaceId);
  const msgRequests = useMessageRequests(identity.profileId, identity.spaceId);
  const applications = useApplications(identity.profileId, alert);

  const totalUnread = chat.totalUnread + msgRequests.incomingCount;

  const openChatWith = useCallback((recipientId: string) => {
    chat.openConversation(recipientId);
    setShowMessaging(true);
  }, [chat]);

  const handleMessageAction = useCallback((recipientId: string, name: string) => {
    const isConnected = connections.connections.some(
      c => c.connected_profile_id === recipientId && c.handshake_accepted
    );
    if (isConnected) {
      openChatWith(recipientId);
    } else {
      setPendingMessageRequest({ recipientId, name });
      setIntroText('');
    }
  }, [connections.connections, openChatWith]);

  const sendMessageRequest = async () => {
    if (!pendingMessageRequest || !introText.trim()) return;
    await msgRequests.sendRequest(pendingMessageRequest.recipientId, introText.trim());
    alert(`Message request sent to ${pendingMessageRequest.name.split(' ')[0]}.`);
    setPendingMessageRequest(null);
    setIntroText('');
  };

  const handleEntryComplete = (uid: string, profileData: Record<string, string>) => {
    identity.hydrateFromEntry(uid, profileData);
    setEntryComplete(true);
  };

  if (!identity.spaceId) return <SpaceGate spaceInput={identity.spaceInput} setSpaceInput={identity.setSpaceInput} confirmSpaceCode={identity.confirmSpaceCode} />;
  if (!entryComplete) return <EntryFlowGate spaceId={identity.spaceId} onComplete={handleEntryComplete} />;

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif', paddingBottom: 70 }}>
      <SystemAlert message={systemAlert} />

      <Header
        fullName={identity.fullName} spaceName={identity.spaceName}
        onAvatarClick={() => setShowProfilePanel(true)}
        onMessagingClick={() => setShowMessaging(true)}
        unreadCount={totalUnread}
      />

      {activeNav === 'discover' && (
        <DiscoverTab
          isVisible={presence.isVisible} onBecomeVisible={() => presence.setShowIntentModal(true)}
          activeLens={activeLens} setActiveLens={setActiveLens}
          presentPeople={discover.presentPeople} profileId={identity.profileId}
          throttled={connections.throttled} triggerHandshake={connections.triggerHandshake}
          opportunities={discover.opportunities} resources={discover.resources} activities={discover.activities}
          appliedOpportunityIds={applications.appliedOpportunityIds} applyToOpportunity={applications.applyToOpportunity}
        />
      )}

      {activeNav === 'connections' && (
        <ConnectionsTab
          connections={connections.connections} incomingHandshakes={connections.incomingHandshakes}
          incomingTier2Requests={connections.incomingTier2Requests}
          acceptHandshake={connections.acceptHandshake} declineHandshake={connections.declineHandshake}
          resolveTier2Request={connections.resolveTier2Request}
          setSelectedConnection={connections.setSelectedConnection}
          onMessageRequest={handleMessageAction}
          getNameFor={connections.getNameFor}
        />
      )}

      {activeNav === 'journey' && <JourneyTab connections={connections.connections} />}

      <BottomNav activeNav={activeNav} setActiveNav={setActiveNav} />

      {showMessaging && (
        <MessagingPanel
          onClose={() => { setShowMessaging(false); chat.closeConversation(); }}
          profileId={identity.profileId}
          conversations={chat.conversations}
          activeConvId={chat.activeConvId}
          messages={chat.messages}
          messageInput={chat.messageInput}
          setMessageInput={chat.setMessageInput}
          openConversation={(id) => chat.openConversation(id)}
          closeConversation={chat.closeConversation}
          sendMessage={chat.sendMessage}
          incomingRequests={msgRequests.incomingRequests}
          incomingCount={msgRequests.incomingCount}
          acceptRequest={(req, cb) => msgRequests.acceptRequest(req, cb)}
          declineRequest={msgRequests.declineRequest}
          getNameFor={connections.getNameFor}
        />
      )}

      {pendingMessageRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}
          onClick={() => setPendingMessageRequest(null)}>
          <div style={{ background: '#1C1C2E', width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '20px 20px 36px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              Message {pendingMessageRequest.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 16 }}>
              They'll see a request before your message is delivered.
            </div>
            <textarea
              autoFocus
              placeholder={`Introduce yourself to ${pendingMessageRequest.name.split(' ')[0]}…`}
              value={introText}
              onChange={e => setIntroText(e.target.value)}
              style={{
                width: '100%', minHeight: 100, padding: 14, borderRadius: 12,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#F5EFE3', fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 12,
              }}
            />
            <button onClick={sendMessageRequest} disabled={!introText.trim()} style={{
              width: '100%', padding: 13, borderRadius: 12,
              background: introText.trim() ? '#E26D34' : 'rgba(255,255,255,0.1)',
              color: introText.trim() ? '#fff' : '#888',
              border: 'none', fontWeight: 700, fontSize: 15, cursor: introText.trim() ? 'pointer' : 'default',
            }}>
              Send Request
            </button>
          </div>
        </div>
      )}

      {presence.showIntentModal && (
        <IntentModal
          fullName={identity.fullName} setFullName={identity.setFullName}
          role={identity.role} setRole={identity.setRole}
          domain={identity.domain} setDomain={identity.setDomain}
          need={presence.need} setNeed={presence.setNeed}
          offer={presence.offer} setOffer={presence.setOffer}
          selectedStation={presence.selectedStation} setSelectedStation={presence.setSelectedStation}
          confirmVisibility={presence.confirmVisibility}
        />
      )}

      {showProfilePanel && (
        <ProfilePanel
          fullName={identity.fullName} setFullName={identity.setFullName}
          role={identity.role} setRole={identity.setRole}
          domain={identity.domain} setDomain={identity.setDomain}
          capabilities={identity.capabilities} setCapabilities={identity.setCapabilities}
          standingNeed={identity.standingNeed} setStandingNeed={identity.setStandingNeed}
          userPhone={identity.userPhone} setUserPhone={identity.setUserPhone}
          userLinkedin={identity.userLinkedin} setUserLinkedin={identity.setUserLinkedin}
          showContactSharing={identity.showContactSharing} setShowContactSharing={identity.setShowContactSharing}
          onSave={async () => { const ok = await identity.saveProfile(); if (ok) setShowProfilePanel(false); }}
          onClose={() => setShowProfilePanel(false)}
        />
      )}

      {connections.selectedConnection && (
        <ConnectionDetailModal
          selectedConnection={connections.selectedConnection}
          onClose={() => connections.setSelectedConnection(null)}
          profileId={identity.profileId}
          stickyNoteText={connections.stickyNoteText} setStickyNoteText={connections.setStickyNoteText}
          saveStickyNote={connections.saveStickyNote}
          showTier2Options={connections.showTier2Options} setShowTier2Options={connections.setShowTier2Options}
          reqPhoneCheckbox={connections.reqPhoneCheckbox} setReqPhoneCheckbox={connections.setReqPhoneCheckbox}
          reqLinkedinCheckbox={connections.reqLinkedinCheckbox} setReqLinkedinCheckbox={connections.setReqLinkedinCheckbox}
          submitTier2Request={connections.submitTier2Request}
          onOpenChat={openChatWith}
          getNameFor={connections.getNameFor}
        />
      )}

      <Analytics />
    </div>
  );
}
ENDOFFILE
echo "  wrote src/app/page.tsx"

# ── 10. Migration ─────────────────────────────────────────────────────────────
cat > "$REPO/supabase/migrations/20260902000000_message_requests_and_read_receipts.sql" << 'ENDOFFILE'
-- message_requests: Instagram-style gate
create table if not exists message_requests (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id),
  sender_profile_id uuid references profiles(id),
  recipient_profile_id uuid references profiles(id),
  intro_body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique (sender_profile_id, recipient_profile_id)
);

alter table message_requests enable row level security;
create policy "owner read"       on message_requests for select using (auth.uid() = sender_profile_id or auth.uid() = recipient_profile_id);
create policy "sender insert"    on message_requests for insert with check (auth.uid() = sender_profile_id);
create policy "recipient update" on message_requests for update using (auth.uid() = recipient_profile_id);

-- read receipts
alter table messages add column if not exists read_at timestamptz default null;

-- tighten messages insert (drop permissive MVP policy first)
drop policy if exists "MVP public insert" on messages;
drop policy if exists "MVP public read"   on messages;

create policy "insert if connected" on messages for insert with check (
  auth.uid() = sender_profile_id
  and (
    exists (
      select 1 from connections
      where profile_id = auth.uid()
        and connected_profile_id = recipient_profile_id
        and handshake_accepted = true
    )
    or
    exists (
      select 1 from message_requests
      where sender_profile_id = auth.uid()
        and recipient_profile_id = messages.recipient_profile_id
        and status = 'accepted'
    )
  )
);

create policy "participants read"  on messages for select using (auth.uid() = sender_profile_id or auth.uid() = recipient_profile_id);
create policy "recipient mark read" on messages for update using (auth.uid() = recipient_profile_id) with check (auth.uid() = recipient_profile_id);
ENDOFFILE
echo "  wrote supabase/migrations/20260902000000_message_requests_and_read_receipts.sql"

echo ""
echo "== All files written. Now run: =="
echo "   git add -A"
echo "   git commit -m 'feat: Instagram-style message requests, LinkedIn-style messaging panel, remove QR scanner'"
echo "   git push"
echo ""
echo "== Then apply the migration in Supabase SQL Editor =="
echo "   cat supabase/migrations/20260902000000_message_requests_and_read_receipts.sql"
