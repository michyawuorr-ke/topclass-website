'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Page() {
  const [sessionCode, setSessionCode] = useState('OFFLINE');
  const [isConnecting, setIsConnecting] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Presence Engine Active');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setSessionCode(room.toUpperCase());
    }
  }, []);

  const handleSyncTrigger = async () => {
    setIsConnecting(true);
    setSystemStatus('Scanning proximity fields...');
    
    try {
      const { error } = await supabase
        .from('encounters')
        .insert([
          { 
            node_anchor: sessionCode, 
            status: 'verified'
          }
        ]);

      if (error) throw error;
      setSystemStatus('Handshake Logged Successfully');
    } catch (err) {
      setSystemStatus('Sync Fallback Active');
    } finally {
      setTimeout(() => {
        setIsConnecting(false);
        setSystemStatus('Presence Engine Active');
      }, 1500);
    }
  };

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#140D0C', // Deep Rich Mocha
      color: '#FDFBF7', // Blush Silk Base
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* UPPER 60%: Premium Identity Canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 24px',
      }}>
        
        {/* Layered Profile Card Component */}
        <div style={{
          width: '100%',
          maxWidth: '340px',
          backgroundColor: 'rgba(38, 25, 22, 0.45)', // Translucent Cognac Base
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '32px',
          padding: '40px 32px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(245, 230, 211, 0.15)',
          border: '1px solid rgba(245, 230, 211, 0.06)',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          
          {/* Top Status Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '3px',
              color: '#D9C3B0', // Champagne Accent
              textTransform: 'uppercase'
            }}>
              Oreeti Sovereign
            </span>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: isConnecting ? '#E6A15C' : '#8CE65C',
              borderRadius: '50%',
              boxShadow: isConnecting ? '0 0 12px #E6A15C' : '0 0 12px #8CE65C',
              transition: 'all 0.3s ease'
            }} />
          </div>

          {/* User Core Identity */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '300',
              letterSpacing: '-0.5px',
              margin: '0 0 6px 0',
              color: '#F5E6D3' // Blush Silk
            }}>
              Oreeti Node
            </h1>
            <div style={{
              fontSize: '14px',
              fontWeight: '400',
              color: '#A68F81', // Muted Cognac Tone
              letterSpacing: '0.5px'
            }}>
              Principal Architecture Lead
            </div>
          </div>

          <hr style={{
            border: 'none',
            height: '1px',
            backgroundColor: 'rgba(245, 230, 211, 0.08)',
            margin: '0 0 24px 0'
          }} />

          {/* Metadata Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Engine Status
              </div>
              <div style={{ fontSize: '13px', color: '#D9C3B0', fontWeight: '400' }}>
                {systemStatus}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* LOWER 40%: The Ergonomic Thumb Control Zone */}
      <div style={{
        height: '38%',
        background: 'linear-gradient(to top, #0E0908 85%, rgba(20, 13, 12, 0))',
        padding: '0 24px 44px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        
        {/* Operational Readout */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          marginBottom: '28px'
        }}>
          <div style={{ fontSize: '10px', color: '#5C4A43', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Proximity Anchor Field
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '300',
            color: sessionCode !== 'OFFLINE' ? '#F5E6D3' : '#5C4A43',
            marginTop: '6px',
            letterSpacing: '1.5px'
          }}>
            {sessionCode}
          </div>
        </div>

        {/* Tactile Operational Controller */}
        <div 
          onClick={handleSyncTrigger}
          style={{
            width: '100%',
            maxWidth: '310px',
            height: '58px',
            backgroundColor: isConnecting ? '#2E1E1B' : '#1C1211',
            border: '1px solid rgba(245, 230, 211, 0.12)',
            borderRadius: '18px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}
        >
          <span style={{
            fontSize: '14px',
            letterSpacing: '1.5px',
            fontWeight: '400',
            color: '#F5E6D3'
          }}>
            {isConnecting ? 'TRANSMITTING NODE...' : 'SCAN PROXIMITY FIELD'}
          </span>
        </div>
      </div>

    </div>
  );
}
