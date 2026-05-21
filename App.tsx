import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function App() {
  const [sessionCode, setSessionCode] = useState('OFFLINE');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setSessionCode(room.toUpperCase());
    }
  }, []);

  const handleSyncTrigger = () => {
    setIsConnecting(true);
    setTimeout(() => setIsConnecting(false), 800);
  };

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1A1110',
      color: '#F9F6F0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '320px',
          backgroundColor: 'rgba(44, 31, 28, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(244, 231, 219, 0.1)',
          border: '1px solid rgba(244, 231, 219, 0.05)'
        }}>
          <div style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            color: '#D4C3B3',
            marginBottom: '16px'
          }}>
            Identity Node
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '300',
            letterSpacing: '-0.5px',
            margin: '0 0 8px 0',
            color: '#F5E6D3'
          }}>
            Oreeti
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#9C8A7C',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Presence Engine Active
          </p>
        </div>
      </div>

      <div style={{
        height: '40%',
        background: 'linear-gradient(to top, #120A09 80%, rgba(26, 17, 16, 0))',
        padding: '0 24px 40px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '11px', color: '#7A695C', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Current Node Anchor
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '400',
            color: sessionCode !== 'OFFLINE' ? '#E6C594' : '#7A695C',
            marginTop: '6px',
            letterSpacing: '1px'
          }}>
            {sessionCode}
          </div>
        </div>

        <div 
          onClick={handleSyncTrigger}
          style={{
            width: '100%',
            maxWidth: '300px',
            height: '56px',
            backgroundColor: isConnecting ? '#3D2A25' : '#231614',
            border: '1px solid #4A3530',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <span style={{
            fontSize: '15px',
            letterSpacing: '1px',
            fontWeight: '400',
            color: '#F5E6D3'
          }}>
            {isConnecting ? 'Establishing Link...' : 'Scan Proximity Field'}
          </span>
        </div>
      </div>

    </div>
  );
}
