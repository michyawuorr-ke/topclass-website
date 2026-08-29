import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Space context + persistent identity (Supabase anonymous auth) + the
// profile fields that travel with that identity across spaces.
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

  // Bootstrap: space from URL, identity from Supabase anonymous auth
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

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let uid = session?.user?.id;
      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          alert('Could not start a session — check your connection.');
          return;
        }
        uid = data?.user?.id;
      }
      if (uid) setProfileId(uid);
    };
    initAuth();

    setFullName(localStorage.getItem('p_name') || '');
    setRole(localStorage.getItem('p_role') || '');
    setDomain(localStorage.getItem('p_domain') || '');
    setCapabilities(localStorage.getItem('p_capabilities') || '');
    setStandingNeed(localStorage.getItem('p_standing_need') || '');
    setUserPhone(localStorage.getItem('p_phone') || '');
    setUserLinkedin(localStorage.getItem('p_link') || '');
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    supabase.from('spaces').select('name').eq('id', spaceId).single()
      .then(({ data }) => { if (data) setSpaceName(data.name); });
  }, [spaceId]);

  // Restore profile from the database — source of truth over localStorage,
  // in case this device's localStorage was cleared but the profile row exists.
  useEffect(() => {
    if (!profileId) return;
    supabase.from('profiles').select('*').eq('id', profileId).single().then(({ data }) => {
      if (data) {
        setFullName(data.name || '');
        setRole(data.title || '');
        setDomain(data.domain || '');
        setCapabilities(data.capabilities || '');
        setStandingNeed(data.standing_need || '');
        setUserPhone(data.phone || '');
        setUserLinkedin(data.linkedin || '');
        localStorage.setItem('p_name', data.name || '');
        localStorage.setItem('p_role', data.title || '');
        localStorage.setItem('p_domain', data.domain || '');
        localStorage.setItem('p_capabilities', data.capabilities || '');
        localStorage.setItem('p_standing_need', data.standing_need || '');
        localStorage.setItem('p_phone', data.phone || '');
        localStorage.setItem('p_link', data.linkedin || '');
      }
    });
  }, [profileId]);

  const confirmSpaceCode = () => {
    if (!spaceInput.trim()) return;
    setSpaceId(spaceInput.trim());
    localStorage.setItem('toruok_space_id', spaceInput.trim());
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      alert('Add your name first.');
      return;
    }
    localStorage.setItem('p_name', fullName);
    localStorage.setItem('p_role', role);
    localStorage.setItem('p_domain', domain);
    localStorage.setItem('p_capabilities', capabilities);
    localStorage.setItem('p_standing_need', standingNeed);
    localStorage.setItem('p_phone', userPhone);
    localStorage.setItem('p_link', userLinkedin);

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
    profileId,
    fullName, setFullName, role, setRole, domain, setDomain,
    capabilities, setCapabilities, standingNeed, setStandingNeed,
    userPhone, setUserPhone, userLinkedin, setUserLinkedin,
    showContactSharing, setShowContactSharing,
    saveProfile,
  };
}

