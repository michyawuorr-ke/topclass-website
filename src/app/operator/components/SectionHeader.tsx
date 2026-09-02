import React from 'react';

export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, opacity: 0.6 }}>{sub}</div>}
    </div>
  );
}
