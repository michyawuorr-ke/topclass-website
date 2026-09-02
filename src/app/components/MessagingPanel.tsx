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
