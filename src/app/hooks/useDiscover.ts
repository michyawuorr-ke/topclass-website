import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Presence, Opportunity, ResourceItem, ActivityItem } from '../types';

// Discover data fetches — everything visible in the current space,
// scoped by spaceId. Polls presence every 5s so people appearing/
// leaving stay reasonably fresh without needing full realtime here.
export function useDiscover(spaceId: string) {
  const [presentPeople, setPresentPeople] = useState<Presence[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const fetchPresentPeople = async () => {
    if (!spaceId) return;
    const { data } = await supabase
      .from('presence')
      .select('*, profiles(name, title, domain)')
      .eq('space_id', spaceId);
    if (data) setPresentPeople(data as any);
  };

  const fetchOpportunities = async () => {
    if (!spaceId) return;
    const { data } = await supabase.from('opportunities').select('*').eq('space_id', spaceId);
    if (data) setOpportunities(data as any);
  };
  const fetchResources = async () => {
    if (!spaceId) return;
    const { data } = await supabase.from('resources').select('*, zones(name)').eq('space_id', spaceId);
    if (data) setResources(data as any);
  };
  const fetchActivities = async () => {
    if (!spaceId) return;
    const { data } = await supabase.from('activities').select('*, zones(name)').eq('space_id', spaceId);
    if (data) setActivities(data as any);
  };

  useEffect(() => {
    if (!spaceId) return;
    fetchPresentPeople();
    fetchOpportunities();
    fetchResources();
    fetchActivities();
    const interval = setInterval(fetchPresentPeople, 5000);
    return () => clearInterval(interval);
  }, [spaceId]);

  return { presentPeople, opportunities, resources, activities, fetchPresentPeople };
}

