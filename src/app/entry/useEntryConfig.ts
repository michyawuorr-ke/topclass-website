import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getDefaultEntryConfig, type EntryConfig, type EnvironmentType } from './types';

interface UseEntryConfigResult {
  config: EntryConfig | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the entry configuration for a space.
 *
 * Priority:
 * 1. If the space has a custom entry_config JSON column → use that.
 * 2. Otherwise look up the organisation's environment_type and return
 *    the matching default config, merged with the org's branding.
 * 3. Fall back to COWORKING_CONFIG if nothing is found.
 *
 * This means operators get a sensible default immediately on setup,
 * and can progressively override fields via the operator dashboard.
 */
export function useEntryConfig(spaceId: string): UseEntryConfigResult {
  const [config, setConfig] = useState<EntryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1. Fetch the space + its parent organisation
      const { data: space, error: spaceErr } = await supabase
        .from('spaces')
        .select(`
          id,
          name,
          type,
          entry_config,
          organization_id,
          organizations (
            id,
            name,
            description,
            website,
            logo_url,
            environment_type,
            primary_color,
            background_color,
            entry_config
          )
        `)
        .eq('id', spaceId)
        .single();

      if (spaceErr || !space) {
        setError('Space not found.');
        setLoading(false);
        return;
      }

      const org = (space as any).organizations;

      // 2. Determine environment type
      const envType: EnvironmentType =
        (org?.environment_type as EnvironmentType) ||
        (space.type as EnvironmentType) ||
        'coworking';

      // 3. Start from the default config for this environment type
      const base = getDefaultEntryConfig(envType);

      // 4. Merge org-level branding
      const withBranding: EntryConfig = {
        ...base,
        org_name: org?.name || space.name || '',
        org_logo_url: org?.logo_url || undefined,
        welcome_headline: base.welcome_headline.replace('the space', org?.name || 'the space'),
        primary_color: org?.primary_color || base.primary_color,
        background_color: org?.background_color || base.background_color,
      };

      // 5. If the org has a custom entry_config JSON, deep-merge it on top
      //    This lets operators override specific fields without losing defaults.
      const orgCustom = org?.entry_config
        ? (typeof org.entry_config === 'string' ? JSON.parse(org.entry_config) : org.entry_config)
        : null;

      // 6. If the space itself has entry_config, that wins over org-level
      const spaceCustom = (space as any).entry_config
        ? (typeof (space as any).entry_config === 'string'
            ? JSON.parse((space as any).entry_config)
            : (space as any).entry_config)
        : null;

      const final: EntryConfig = {
        ...withBranding,
        ...(orgCustom || {}),
        ...(spaceCustom || {}),
      };

      setConfig(final);
      setLoading(false);
    };

    load();
  }, [spaceId]);

  return { config, loading, error };
}
