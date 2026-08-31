import React, { useState } from 'react';
import { Opportunity } from '../types';

const TYPE_COLORS: Record<string, string> = {
  Scholarship: '#D4AF37', Job: '#4A90D9', Internship: '#4A90D9', Grant: '#D4AF37',
  Program: '#8A7355', Workshop: '#8A7355', Consultation: '#8A7355', Other: '#8A7355',
};

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 4 }}>
      <span>{icon}</span>
      <span><strong>{label}:</strong> {value}</span>
    </div>
  );
}

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
        const closed = o.status === 'closed';
        const badgeColor = TYPE_COLORS[o.type] || '#8A7355';
        const isLink = o.application_method?.startsWith('http');

        return (
          <div key={o.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
            {o.image_url && (
              <img src={o.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 20, background: badgeColor, color: '#1C1C2E' }}>
                  {o.type.toUpperCase()}
                </span>
                {closed && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', opacity: 0.7 }}>CLOSED</span>
                )}
              </div>

              <div style={{ fontSize: 17, fontWeight: 700 }}>{o.title}</div>
              {o.provider && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{o.provider}</div>}
              {o.description && <p style={{ fontSize: 13, marginTop: 10, opacity: 0.9, lineHeight: 1.5 }}>{o.description}</p>}

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <DetailRow icon="📍" label="Location" value={o.location} />
                <DetailRow icon="🎓" label="Eligibility" value={o.eligibility} />
                <DetailRow icon="💰" label="Compensation" value={o.compensation} />
                <DetailRow icon="⏰" label="Deadline" value={o.deadline ? new Date(o.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                {o.application_method && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 4 }}>
                    <span>👉</span>
                    <span>
                      <strong>How to apply:</strong>{' '}
                      {isLink ? (
                        <a href={o.application_method} target="_blank" rel="noopener noreferrer" style={{ color: '#E26D34' }}>{o.application_method}</a>
                      ) : o.application_method}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                {closed ? (
                  <div style={{ fontSize: 13, opacity: 0.6 }}>Applications closed.</div>
                ) : applied ? (
                  <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>✓ Applied</div>
                ) : expandedId === o.id ? (
                  <div>
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
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#E26D34', color: '#fff', border: 'none', fontWeight: 600 }}>
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

