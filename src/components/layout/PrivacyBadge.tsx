import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyBadge() {
  return (
    <div style={{
      background: '#edf7e4',
      border: '1px solid #66B539',
      borderRadius: '8px',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '13px',
      color: '#2d6a4f',
      fontWeight: 600,
      margin: '12px 16px'
    }}>
      <ShieldCheck className="h-5 w-5 flex-shrink-0" style={{ color: '#66B539' }} />
      <span>
        <strong>Your files never leave this page.</strong> All processing runs 
        in your browser. No uploads. No account. No logs. 
        GDPR Article 25 compliant · Governed under Irish Data Protection Act 2018 · 
        Operated by <a href="https://priyalifescience.com" 
        style={{color:'#66B539'}}>Priya Life Science</a>
      </span>
    </div>
  );
}
