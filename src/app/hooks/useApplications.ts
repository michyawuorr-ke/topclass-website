import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Tracks which opportunities the current profile has already applied
// to, and lets them apply (with an optional note) to a new one.
export function useApplications(profileId: string, alert: (msg: string) => void) {
  const [appliedOpportunityIds, setAppliedOpportunityIds] = useState<Set<string>>(new Set());

  const fetchApplications = async () => {
    if (!profileId) return;
    const { data } = await supabase.from('opportunity_applications').select('opportunity_id').eq('profile_id', profileId);
    if (data) setAppliedOpportunityIds(new Set(data.map(a => a.opportunity_id)));
  };

  useEffect(() => { fetchApplications(); }, [profileId]);

  const applyToOpportunity = async (opportunityId: string, note: string) => {
    if (!profileId || appliedOpportunityIds.has(opportunityId)) return;
    const { error } = await supabase.from('opportunity_applications').insert({
      opportunity_id: opportunityId, profile_id: profileId, note: note || null,
    });
    if (error) {
      alert('Could not apply — try again.');
      return;
    }
    setAppliedOpportunityIds(prev => new Set(prev).add(opportunityId));
    alert('Applied.');
  };

  return { appliedOpportunityIds, applyToOpportunity };
}

