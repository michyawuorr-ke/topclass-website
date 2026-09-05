'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { NavTab } from './types';
import { useAlert } from './hooks/useAlert';
import { useIdentity } from './hooks/useIdentity';
import { useDiscover } from './hooks/useDiscover';
import { usePresence } from './hooks/usePresence';
import { useConnections } from './hooks/useConnections';
import { useChat } from './hooks/useChat';
import { useMessageRequests } from './hooks/useMessageRequests';
import { useApplications } from './hooks/useApplications';
import { supabase } from './lib/supabase';
import { SystemAlert } from './components/SystemAlert';
import { SpaceGate } from './components/SpaceGate';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { CampusTab } from './components/CampusTab';
import { LearnTab } from './components/LearnTab';
import { NetworkTab } from './components/NetworkTab';
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
    <div style={{ minHeight: '100dvh', background: '#0A0A14', color: '#F0EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",system-ui,sans-serif' }}>
      <div style={{ opacity: 0.4 }}>Loading…</div>
    </div>
  );
  if (error || !config) return (
    <div style={{ minHeight: '100dvh', background: '#0A0A14', color: '#F0EBE1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '"Inter",system-ui,sans-serif' }}>
      <div style={{ opacity: 0.6, marginBottom: 12 }}>Space not found.</div>
      <div style={{ opacity: 0.3, fontSize: 13 }}>{error}</div>
    </div>
  );
  return <EntryFlow config={config} spaceId={spaceId} onComplete={onComplete} />;
}

export default function ToruokSpaceApp() {
  const { systemAlert, alert } = useAlert();
  const identity = useIdentity(alert);
  const discover = useDiscover(identity.spaceId);

  const [activeNav, setActiveNav] = useState<NavTab>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const [pendingMessageRequest, setPendingMessageRequest] = useState<{ recipientId: string; name: string } | null>(null);
  const [introText, setIntroText] = useState('');

  // Visibility mode for campus presence
  const [visibilityMode, setVisibilityMode] = useState<'off' | 'department' | 'institution'>('department');

  // Home tab data
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

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

  // Load home tab data once entry is complete
  useEffect(() => {
    if (!entryComplete || !identity.spaceId) return;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Today's schedule
    supabase.from('schedules').select('*, zones(name), teams(name)')
      .eq('day_of_week', today)
      .then(({ data }) => setTodaySchedule(data || []));

    // Announcements for this space
    supabase.from('announcements').select('*, teams(name)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setAnnouncements(data || []));

    // Course materials
    supabase.from('course_materials').select('*')
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => setMaterials(data || []));
  }, [entryComplete, identity.spaceId]);

  // WiFi presence — detect SSID change (web only gets partial info via Network API)
  useEffect(() => {
    if (!entryComplete || !identity.profileId || visibilityMode === 'off') return;
    // Update presence visibility in DB when mode changes
    supabase.from('presence').update({ visibility: visibilityMode }).eq('profile_id', identity.profileId);
  }, [visibilityMode, entryComplete, identity.profileId]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.reload();
  };

  if (!identity.spaceId) return <SpaceGate spaceInput={identity.spaceInput} setSpaceInput={identity.setSpaceInput} confirmSpaceCode={identity.confirmSpaceCode} />;
  if (!entryComplete) return <EntryFlowGate spaceId={identity.spaceId} onComplete={handleEntryComplete} />;

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A14', color: '#F0EBE1', fontFamily: '"Inter",system-ui,sans-serif', paddingBottom: 70 }}>
      <SystemAlert message={systemAlert} />

      <Header
        fullName={identity.fullName} spaceName={identity.spaceName}
        onAvatarClick={() => setShowProfile(true)}
        onMessagingClick={() => setShowMessaging(true)}
        unreadCount={totalUnread}
      />

      {activeNav === 'home' && (
        <HomeTab
          fullName={identity.fullName}
          todaySchedule={todaySchedule}
          opportunities={discover.opportunities}
          activities={discover.activities}
          announcements={announcements}
          appliedOpportunityIds={applications.appliedOpportunityIds}
          applyToOpportunity={applications.applyToOpportunity}
        />
      )}

      {activeNav === 'campus' && (
        <CampusTab
          presentPeople={discover.presentPeople}
          profileId={identity.profileId}
          throttled={connections.throttled}
          triggerHandshake={connections.triggerHandshake}
          visibilityMode={visibilityMode}
          onChangeVisibility={setVisibilityMode}
        />
      )}

      {activeNav === 'learn' && (
        <LearnTab
          materials={materials}
          resources={discover.resources}
        />
      )}

      {activeNav === 'network' && (
        <NetworkTab
          connections={connections.connections}
          incomingHandshakes={connections.incomingHandshakes}
          incomingTier2Requests={connections.incomingTier2Requests}
          acceptHandshake={connections.acceptHandshake}
          declineHandshake={connections.declineHandshake}
          resolveTier2Request={connections.resolveTier2Request}
          setSelectedConnection={connections.setSelectedConnection}
          onMessageRequest={handleMessageAction}
          getNameFor={connections.getNameFor}
        />
      )}

      <BottomNav activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Profile slide-in */}
      {showProfile && (
        <ProfilePanel
          fullName={identity.fullName} setFullName={identity.setFullName}
          role={identity.role} setRole={identity.setRole}
          domain={identity.domain} setDomain={identity.setDomain}
          capabilities={identity.capabilities} setCapabilities={identity.setCapabilities}
          standingNeed={identity.standingNeed} setStandingNeed={identity.setStandingNeed}
          userPhone={identity.userPhone} setUserPhone={identity.setUserPhone}
          userLinkedin={identity.userLinkedin} setUserLinkedin={identity.setUserLinkedin}
          showContactSharing={identity.showContactSharing}
          setShowContactSharing={identity.setShowContactSharing}
          onSave={async () => { const ok = await identity.saveProfile(); if (ok) setShowProfile(false); }}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}

      {/* Messaging */}
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

      {/* Message request bottom sheet */}
      {pendingMessageRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}
          onClick={() => setPendingMessageRequest(null)}>
          <div style={{ background: '#17172A', width: '100%', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              Message {pendingMessageRequest.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(240,235,225,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
              They'll see a request before your message is delivered.
            </div>
            <textarea
              autoFocus
              placeholder={`Introduce yourself to ${pendingMessageRequest.name.split(' ')[0]}…`}
              value={introText}
              onChange={e => setIntroText(e.target.value)}
              style={{
                width: '100%', minHeight: 100, padding: 14, borderRadius: 12,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0EBE1', fontSize: 14, resize: 'none', boxSizing: 'border-box',
                marginBottom: 12, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button onClick={sendMessageRequest} disabled={!introText.trim()} style={{
              width: '100%', padding: 13, borderRadius: 12,
              background: introText.trim() ? '#E26D34' : 'rgba(255,255,255,0.08)',
              color: introText.trim() ? '#fff' : '#888',
              border: 'none', fontWeight: 700, fontSize: 15,
              cursor: introText.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
            }}>
              Send Request
            </button>
          </div>
        </div>
      )}

      {/* Connection detail */}
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
