'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Page() {
  const [sessionCode, setSessionCode] = useState('OFFLINE');
  const [isConnecting, setIsConnecting] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Presence Engine Active');
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setSessionCode(room.toUpperCase());
      }
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

  // Generate a clean QR code using the Google Charts API for crisp rendering
  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(currentUrl)}&chco=F5E6D3&chf=bg,s,65432100`;

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#140D0C',
      color: '#FDFBF7',
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
        padding: '24px',
      }}>
        
        {/* Layered Profile Card Component */}
        <div style={{
          width: '100%',
          maxWidth: '340px',
          backgroundColor: 'rgba(38, 25, 22, 0.45)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '32px',
          padding: '32px 24px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(245, 230, 211, 0.15)',
          border: '1px solid rgba(245, 230, 211, 0.06)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '3px', color: '#D9C3B0', textTransform: 'uppercase' }}>
              Oreeti Sovereign
            </span>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: isConnecting ? '#E6A15C' : '#8CE65C',
              borderRadius: '50%',
              boxShadow: isConnecting ? '0 0 12px #E6A15C' : '0 0 12px #8CE65C',
            }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '300', letterSpacing: '-0.5px', margin: '0 0 4px 0', color: '#F5E6D3' }}>
              Oreeti Node
            </h1>
            <div style={{ fontSize: '13px', color: '#A68F81', letterSpacing: '0.5px' }}>
              Principal Architecture Lead
            </div>
          </div>

          {/* Integrated Proximity QR Node */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '24px 0',
            padding: '16px',
            backgroundColor: 'rgba(20, 13, 12, 0.4)',
            borderRadius: '20px',
            border: '1px solid rgba(245, 230, 211, 0.04)'
          }}>
            <img 
              src={qrCodeUrl} 
              alt="Proximity Node QR" 
              style={{ width: '150px', height: '150px', display: 'block' }}
            />
          </div>

          <div style={{ textAlign: 'left', borderTop: '1px solid rgba(245, 230, 211, 0.08)', paddingTop: '16px' }}>
            <div style={{ fontSize: '9px', color: '#6E5950', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Engine Status
            </div>
            <div style={{ fontSize: '12px', color: '#D9C3B0' }}>
              {systemStatus}
            </div>
          </div>

        </div>
      </div>

      {/* LOWER 40%: Ergonomic Thumb Zone */}
      <div style={{
        height: '35%',
        background: 'linear-gradient(to top, #0E0908 85%, rgba(20, 13, 12, 0))',
        padding: '0 24px 32px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        
        <div style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: '#5C4A43', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Proximity Anchor Field
          </div>
          <div style={{ fontSize: '16px', fontWeight: '300', color: sessionCode !== 'OFFLINE' ? '#F5E6D3' : '#5C4A43', marginTop: '4px' }}>
            {sessionCode}
          </div>
        </div>

        <div 
          onClick={handleSyncTrigger}
          style={{
            width: '100%',
            maxWidth: '310px',
            height: '56px',
            backgroundColor: isConnecting ? '#2E1E1B' : '#1C1211',
            border: '1px solid rgba(245, 230, 211, 0.12)',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}
        >
          <span style={{ fontSize: '13px', letterSpacing: '1.5px', color: '#F5E6D3' }}>
            {isConnecting ? 'TRANSMITTING NODE...' : 'SCAN PROXIMITY FIELD'}
          </span>
        </div>
      </div>

    </div>
  );
}
