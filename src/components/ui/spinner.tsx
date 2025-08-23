'use client';

import React from 'react';

type Props = {
  text?: string;
  overlay?: boolean;   // 페이지 전체 덮는 오버레이
  size?: number;       // 스피너 지름(px)
};

export default function LoadingSpinner({ text = '로딩 중…', overlay = false, size = 32 }: Props) {
  return (
    <div className={overlay ? 'lds-overlay' : 'lds-wrap'}>
      <div className="lds-spinner" style={{ width: size, height: size }} />
      {text && <div className="lds-text">{text}</div>}

      <style jsx>{`
        @keyframes lds-rotate { 100% { transform: rotate(360deg); } }

        .lds-wrap {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.5rem; min-height: 6rem;
        }

        .lds-overlay {
          position: fixed; inset: 0; background: rgba(255,255,255,0.6);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.75rem; z-index: 9999; backdrop-filter: blur(1px);
        }

        .lds-spinner {
          border: 3px solid rgba(0,0,0,0.08);
          border-top-color: #018941;
          border-radius: 50%;
          animation: lds-rotate 0.8s linear infinite;
        }

        .lds-text { font-size: 0.875rem; color: #2c3e50; }
      `}</style>
    </div>
  );
}