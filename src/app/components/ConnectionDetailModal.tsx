import React from 'react';
import { Message } from '../types';

export function ConnectionDetailModal({
  selectedConnection, onClose, profileId,
  messages, messageInput, setMessageInput, sendMessage, peerStation,
  stickyNoteText, setStickyNoteText, saveStickyNote,
  showTier2Options, setShowTier2Options,
  reqPhoneCheckbox, setReqPhoneCheckbox, reqLinkedinCheckbox, setReqLinkedinCheckbox,
  submitTier2Request,
}: {
  selectedConnection: any; onClose: () => void; profileId: string;
  messages: Message[]; messageInput: string; setMessageInput: (v: string) => void; sendMessage: () => void; peerStation: string;
  stickyNoteText: string; setStickyNoteText: (v: string) => void; saveStickyNote: () => void;
  showTier2Options: boolean; setShowTier2Options: (v: boolean) => void;
  reqPhoneCheckbox: boolean; setReqPhoneCheckbox: (v: boolean) => void;
  reqLinkedinCheckbox: boolean; setReqLinkedinCheckbox: (v: boolean) => void;
  submitTier2Request: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}
      onClick={onClose}>
      <div style={{ background: '#1C1C2E', width: '100%', maxHeight: '85vh', overflowY: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }} onClick={e => e.stopPropagation()}>

        {/* Chat unlocks only after a QR scan confirms an in-person meetup.
            Before that, show live coordination (where they are) instead. */}
        {selectedConnection.qr_scanned ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, marginBottom: 8 }}>CHAT</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {messages.length === 0 && <p style={{ opacity: 0.5, fontSize: 13 }}>You met — say hello.</p>}
              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.sender_profile_id === profileId ? 'flex-end' : 'flex-start',
                  background: m.sender_profile_id === profileId ? '#E26D34' : 'rgba(255,255,255,0.08)',
                  color: m.sender_profile_id === profileId ? '#fff' : '#F5EFE3',
                  padding: '8px 12px', borderRadius: 12, maxWidth: '80%', fontSize: 13,
                }}>
                  {m.body}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={messageInput} onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Message..." style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none' }} />
              <button onClick={sendMessage} style={{ padding: '10px 16px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Send</button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 16, fontSize: 13, opacity: 0.75, background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 10 }}>
            Chat opens once you scan to confirm you've met in person.
            {peerStation ? ` They're currently at: ${peerStation}.` : ''}
          </div>
        )}

        <textarea placeholder="Sticky note..." value={stickyNoteText} onChange={e => setStickyNoteText(e.target.value)}
          style={{ width: '100%', minHeight: 80, padding: 10, marginBottom: 8, borderRadius: 8, border: 'none' }} />
        <button onClick={saveStickyNote} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 8 }}>Save note</button>
        {!showTier2Options ? (
          <button onClick={() => setShowTier2Options(true)} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none' }}>Request contact info</button>
        ) : (
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={reqPhoneCheckbox} onChange={e => setReqPhoneCheckbox(e.target.checked)} /> Phone</label>
            <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={reqLinkedinCheckbox} onChange={e => setReqLinkedinCheckbox(e.target.checked)} /> LinkedIn</label>
            <button onClick={submitTier2Request} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Send request</button>
          </div>
        )}
      </div>
    </div>
  );
}

