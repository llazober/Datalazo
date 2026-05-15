"use client";

import React from 'react';

interface PDFReportProps {
  metrics: {
    keywordsGained: number;
    contentPieces: number;
    avgRanking: number;
    conversionRate: string;
  };
  clientUrl?: string;
}

export default function GrowthReportPDF({ metrics, clientUrl }: PDFReportProps) {
  return (
    <div 
      id="datalazo-report-template"
      style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '0', 
        opacity: 1, 
        pointerEvents: 'none',
        zIndex: -1,
        width: '800px',
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: '48px',
        fontFamily: 'sans-serif'
      }}
    >

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #000000', paddingBottom: '32px', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.05em', marginBottom: '8px' }}>
            Datalazo <span style={{ color: '#0891b2' }}>Intelligence</span>
          </h1>
          <p style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>
            Monthly Growth Matrix Report
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af' }}>Date Generated</p>
          <p style={{ fontSize: '14px', fontWeight: '700' }}>{new Date().toLocaleDateString()}</p>
          <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', marginTop: '8px' }}>Target Domain</p>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#0891b2' }}>{clientUrl || 'Global Matrix'}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '16px', borderLeft: '4px solid #0891b2', paddingLeft: '16px' }}>Executive ROI Summary</h2>
        <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
          The following intelligence report summarizes the search performance and asset production for the current period. 
          Our AI-driven Growth Matrix has successfully expanded your search footprint and automated the production of high-authority content assets.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}>Keywords Gained</p>
          <p style={{ fontSize: '36px', fontWeight: '900', color: '#0891b2', fontStyle: 'italic' }}>+{metrics.keywordsGained}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>Active search footprint expansion</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}>Content Assets</p>
          <p style={{ fontSize: '36px', fontWeight: '900', color: '#000000', fontStyle: 'italic' }}>{metrics.contentPieces}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>High-authority articles published</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}>Avg. Ranking</p>
          <p style={{ fontSize: '36px', fontWeight: '900', color: '#4f46e5', fontStyle: 'italic' }}>#{metrics.avgRanking}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>Average Page 1 search position</p>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}>Conversion Rank</p>
          <p style={{ fontSize: '36px', fontWeight: '900', color: '#059669', fontStyle: 'italic' }}>{metrics.conversionRate}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>Lead generation efficiency</p>
        </div>
      </div>

      {/* Strategic Roadmap */}
      <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '40px', borderRadius: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '16px', color: '#22d3ee' }}>Strategic Roadmap: Next 30 Days</h3>
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <p>▶ Technical Audit Shield will perform a deep-scan of the new content cluster.</p>
          <p>▶ AI Architect will begin drafting the next 10 high-volume keywords.</p>
          <p>▶ Conversion optimization will be applied to the top-performing articles.</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.4em', color: '#9ca3af' }}>
          Confidential Intelligence Report | Datalazo v3.6
        </p>
      </div>
    </div>
  );
}
