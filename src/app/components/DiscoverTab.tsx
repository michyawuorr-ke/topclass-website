import React from 'react';
import { Lens, Presence, Opportunity, ResourceItem, ActivityItem } from '../types';
import { PeopleLens } from './PeopleLens';
import { OpportunitiesLens } from './OpportunitiesLens';
import { ResourcesLens } from './ResourcesLens';
import { ActivitiesLens } from './ActivitiesLens';

export function DiscoverTab({
  isVisible, onBecomeVisible, activeLens, setActiveLens,
  presentPeople, profileId, throttled, triggerHandshake,
  opportunities, resources, activities,
  appliedOpportunityIds, applyToOpportunity,
}: {
  isVisible: boolean; onBecomeVisible: () => void; activeLens: Lens; setActiveLens: (l: Lens) => void;
  presentPeople: Presence[]; profileId: string; throttled: Record<string, boolean>; triggerHandshake: (p: Presence) => void;
  opportunities: Opportunity[]; resources: ResourceItem[]; activities: ActivityItem[];
  appliedOpportunityIds: Set<string>; applyToOpportunity: (id: string, note: string) => void;
}) {
  return (
    <div style={{ padding: '0 16px' }}>
      {!isVisible && (
        <button onClick={onBecomeVisible}
          style={{ width: '100%', padding: 14, borderRadius: 10, background: '#E26D34', color: '#fff', border: 'none', marginBottom: 16 }}>
          Become visible in this space
        </button>
      )}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
        {(['foryou', 'people', 'opportunities', 'resources', 'activities'] as Lens[]).map(lens => (
          <button key={lens} onClick={() => setActiveLens(lens)}
            style={{
              padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap', border: 'none',
              background: activeLens === lens ? '#D4AF37' : 'rgba(255,255,255,0.08)',
              color: activeLens === lens ? '#1C1C2E' : '#F5EFE3',
            }}>
            {lens === 'foryou' ? 'For You' : lens.charAt(0).toUpperCase() + lens.slice(1)}
          </button>
        ))}
      </div>

      {(activeLens === 'foryou' || activeLens === 'people') && (
        <PeopleLens presentPeople={presentPeople} profileId={profileId} throttled={throttled} triggerHandshake={triggerHandshake} />
      )}
      {activeLens === 'opportunities' && (
        <OpportunitiesLens opportunities={opportunities} appliedOpportunityIds={appliedOpportunityIds} applyToOpportunity={applyToOpportunity} />
      )}
      {activeLens === 'resources' && <ResourcesLens resources={resources} />}
      {activeLens === 'activities' && <ActivitiesLens activities={activities} />}
    </div>
  );
}

