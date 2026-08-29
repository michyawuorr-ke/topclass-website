import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileFields {
  fullName: string; role: string; domain: string; userPhone: string; userLinkedin: string;
  capabilities: string; standingNeed: string;
}

// Being visible in the current space: your situational Need/Offer and
// station, distinct from the persistent profile fields in useIdentity.
export function usePresence(
  profileId: string, spaceId: string, profile: ProfileFields,
  fetchPresentPeople: () => void, alert: (msg: string) => void
) {
  const [isVisible, setIsVisible] = useState(false);
  const [need, setNeed] = useState('');
  const [offer, setOffer] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [showIntentModal, setShowIntentModal] = useState(false);

  // Restore presence — if you're already visible in this space (e.g. after
  // a refresh), reflect that instead of showing "Become visible" again.
  useEffect(() => {
    if (!profileId || !spaceId) return;
    supabase.from('presence').select('*').eq('profile_id', profileId).eq('space_id', spaceId).single()
      .then(({ data }) => {
        if (data) {
          setIsVisible(true);
          setNeed(data.need || '');
          setOffer(data.offer || '');
          setSelectedStation(data.station || '');
        }
      });
  }, [profileId, spaceId]);

  const confirmVisibility = async () => {
    if (!profile.fullName.trim() || !profile.role.trim() || !need.trim() || !selectedStation.trim() || !spaceId) {
      alert('Complete your name, role, need, and station.');
      return;
    }
    setShowIntentModal(false);
    setIsVisible(true);

    localStorage.setItem('p_name', profile.fullName);
    localStorage.setItem('p_role', profile.role);
    localStorage.setItem('p_domain', profile.domain);
    localStorage.setItem('p_phone', profile.userPhone);
    localStorage.setItem('p_link', profile.userLinkedin);

    await supabase.from('profiles').upsert({
      id: profileId, name: profile.fullName, title: profile.role, domain: profile.domain,
      phone: profile.userPhone, linkedin: profile.userLinkedin,
      capabilities: profile.capabilities, standing_need: profile.standingNeed,
    });

    await supabase.from('presence').upsert({
      id: profileId, // reuse profile id as presence id for simplicity — one active presence per profile
      profile_id: profileId,
      space_id: spaceId,
      intent: `${need}${offer ? ' / offering: ' + offer : ''}`,
      need, offer,
      station: selectedStation,
      last_seen: new Date().toISOString(),
    });

    setTimeout(fetchPresentPeople, 300);
  };

  return {
    isVisible, need, setNeed, offer, setOffer, selectedStation, setSelectedStation,
    showIntentModal, setShowIntentModal, confirmVisibility,
  };
}

