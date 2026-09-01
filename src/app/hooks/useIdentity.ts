import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Space context + the persistent profile fields that travel with a
// participant's identity. Auth itself (anonymous / magic link / phone /
// institutional / invite code) is now owned entirely by EntryFlow
// (src/app/entry/) — this hook no longer signs anyone in on its own.
// EntryFlow calls hydrateFromEntry() once it completes, using the data
// it already wrote to `profiles`, rather than this hook re-fetching.
export function useIdentity(alert: (msg: string) => void) {
  const [spaceId, setSpaceId] = useState<string>('');
  const [spaceInput, setSpaceInput] = useState('');
  const [spaceName, setSpaceName] = useState('');

  const [profileId, setProfileId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [standingNeed, setStandingNeed] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userLinkedin, setUserLinkedin] = useState('');
  const [showContactSharing, setShowContactSharing] = useState(false);

  // Bootstrap: space from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('space');
    if (s) {
      setSpaceId(s);
      localStorage.setItem('toruok_space_id', s);
    } else {
      const saved = localStorage.getItem('toruok_space_id');
      if (saved) setSpaceId(saved);
    }
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    supabase.from('spaces').select('name').eq('id', spaceId).single()
      .then(({ data }) => { if (data) setSpaceName(data.name); });
  }, [spaceId]);

  const confirmSpaceCode = () => {
    if (!spaceInput.trim()) return;
    setSpaceId(spaceInput.trim());
    localStorage.setItem('toruok_space_id', spaceInput.trim());
  };

  // Called once EntryFlow completes (new entry or a returning, already-
  // hydrated session) — populates local state from what EntryFlow
  // already persisted, instead of a second redundant DB fetch.
  const hydrateFromEntry = (uid: string, data: Record<string, string>) => {
    setProfileId(uid);
    setFullName(data.full_name || '');
    setRole(data.title || '');
    setDomain(data.domain || '');
    setCapabilities(data.capabilities || '');
    setStandingNeed(data.standing_need || '');
    setUserPhone(data.phone || '');
    setUserLinkedin(data.linkedin || '');
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      alert('Add your name first.');
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: profileId, name: fullName, title: role, domain, phone: userPhone, linkedin: userLinkedin,
      capabilities, standing_need: standingNeed,
    });
    if (error) {
      alert('Save failed — try again.');
      return;
    }
    alert('Profile saved.');
    return true;
  };

  return {
    spaceId, spaceInput, setSpaceInput, spaceName, confirmSpaceCode,
    profileId, hydrateFromEntry,
    fullName, setFullName, role, setRole, domain, setDomain,
    capabilities, setCapabilities, standingNeed, setStandingNeed,
    userPhone, setUserPhone, userLinkedin, setUserLinkedin,
    showContactSharing, setShowContactSharing,
    saveProfile,
  };
}

