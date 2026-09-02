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
