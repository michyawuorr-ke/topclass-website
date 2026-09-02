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
