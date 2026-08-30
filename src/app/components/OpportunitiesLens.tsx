import React, { useState } from 'react';
import { Opportunity } from '../types';

export function OpportunitiesLens({ opportunities, appliedOpportunityIds, applyToOpportunity }: {
  opportunities: Opportunity[]; appliedOpportunityIds: Set<string>; applyToOpportunity: (id: string, note: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const submit = (id: string) => {
    applyToOpportunity(id, noteDraft);
    setExpandedId(null);
    setNoteDraft('');
  };

  return (
    <div>
      {opportunities.length === 0 && <p style={{ opacity: 0.5 }}>No opportunities posted yet.</p>}
      {opportunities.map(o => {
        const applied = appliedOpportunityIds.has(o.id);
        return (
          <div key={o.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{o.title}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{o.type} · {o.provider}</div>
            {o.eligibility && <div style={{ fontSize: 13, marginTop: 6 }}>Eligibility: {o.eligibility}</div>}
            {o.deadline && <div style={{ fontSize: 13 }}>Deadline: {new Date(o.deadline).toLocaleDateString()}</div>}

            {applied ? (
              <div style={{ marginTop: 10, fontSize: 13, color: '#D4AF37' }}>✓ Applied</div>
            ) : expandedId === o.id ? (
              <div style={{ marginTop: 10 }}>
                <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Add a note (optional) — why you're a good fit"
                  style={{ width: '100%', minHeight: 50, padding: 8, borderRadius: 8, border: 'none', fontFamily: 'inherit', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => submit(o.id)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>Submit</button>
                  <button onClick={() => setExpandedId(null)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#F5EFE3', border: 'none' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setExpandedId(o.id)}
                style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none' }}>
                Apply
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

