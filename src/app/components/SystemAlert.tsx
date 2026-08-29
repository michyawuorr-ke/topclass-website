import React from 'react';

export function SystemAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#E26D34', color: '#fff', padding: '8px 16px', borderRadius: 8, zIndex: 50 }}>
      {message}
    </div>
  );
}

