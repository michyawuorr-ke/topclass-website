'use client';

import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Lens, NavTab } from './types';
import { useAlert } from './hooks/useAlert';
import { useIdentity } from './hooks/useIdentity';
import { useDiscover } from './hooks/useDiscover';
import { usePresence } from './hooks/usePresence';
import { useConnections } from './hooks/useConnections';
import { useChat } from './hooks/useChat';
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
import EntryFlow from './entry/EntryFlow';
import { useEntryConfig } from './entry/useEntryConfig';

// Thin wrapper: loads the entry config for a space, then renders
// EntryFlow with it. Keeps config-loading out of the main orchestrator.
function EntryFlowGate({ spaceId, onComplete }: {
  spaceId: string; onComplete: (profileId: string, profileData: Record<string, string>) => void;
}) {
  const { config, loading, error } = useEntryConfig(spaceId);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ opacity: 0.5 }}>Loading space…</div>
      </div>
    );
  }
  if (error || !config) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{ opacity: 0.7, marginBottom: 16 }}>Space not found or unavailable.</div>
        <div style={{ opacity: 0.4, fontSize: 13 }}>{error}</div>
      </div>
    );
  }
  return <EntryFlow config={config} spaceId={spaceId} onComplete={onComplete} />;
}

export default function ToruokSpaceApp() {
  const { systemAlert, alert } = useAlert();
  const identity = useIdentity(alert);
  const discover = useDiscover(identity.spaceId);

  const [activeNav, setActiveNav] = useState<NavTab>('discover');
  const [activeLens, setActiveLens] = useState<Lens>('foryou');
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);

  const presence = usePresence(
    identity.profileId, identity.spaceId,
    {
      fullName: identity.fullName, role: identity.role, domain: identity.domain,
      userPhone: identity.userPhone, userLinkedin: identity.userLinkedin,
      capabilities: identity.capabilities, standingNeed: identity.standingNeed,
    },
    discover.fetchPresentPeople, alert
  );

  const connections = useConnections(identity.profileId, identity.spaceId, setActiveNav, alert);
  const chat = useChat(connections.selectedConnection, identity.profileId, identity.spaceId);
  const applications = useApplications(identity.profileId, alert);

  const handleEntryComplete = (uid: string, profileData: Record<string, string>) => {
    identity.hydrateFromEntry(uid, profileData);
    setEntryComplete(true);
  };

  if (!identity.spaceId) {
    return <SpaceGate spaceInput={identity.spaceInput} setSpaceInput={identity.setSpaceInput} confirmSpaceCode={identity.confirmSpaceCode} />;
  }

  if (!entryComplete) {
    return <EntryFlowGate spaceId={identity.spaceId} onComplete={handleEntryComplete} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1C1C2E', color: '#F5EFE3', fontFamily: 'sans-serif', paddingBottom: 70 }}>
      <SystemAlert message={systemAlert} />
      <Header fullName={identity.fullName} spaceName={identity.spaceName} onAvatarClick={() => setShowProfilePanel(true)} />

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
          isScanning={connections.isScanning} startQrScanner={connections.startQrScanner} stopQrScanner={connections.stopQrScanner}
        />
      )}

      {activeNav === 'journey' && <JourneyTab connections={connections.connections} />}

      <BottomNav activeNav={activeNav} setActiveNav={setActiveNav} />

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
          messages={chat.messages} messageInput={chat.messageInput} setMessageInput={chat.setMessageInput}
          sendMessage={chat.sendMessage} peerStation={chat.peerStation}
          stickyNoteText={connections.stickyNoteText} setStickyNoteText={connections.setStickyNoteText}
          saveStickyNote={connections.saveStickyNote}
          showTier2Options={connections.showTier2Options} setShowTier2Options={connections.setShowTier2Options}
          reqPhoneCheckbox={connections.reqPhoneCheckbox} setReqPhoneCheckbox={connections.setReqPhoneCheckbox}
          reqLinkedinCheckbox={connections.reqLinkedinCheckbox} setReqLinkedinCheckbox={connections.setReqLinkedinCheckbox}
          submitTier2Request={connections.submitTier2Request}
        />
      )}

      <Analytics />
    </div>
  );
}

