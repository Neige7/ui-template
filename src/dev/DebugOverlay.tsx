import React from 'react';
import { ScreenId } from '../types';

interface DebugOverlayBannerProps {
  debugMode: boolean;
  guiScale: number;
  screen: ScreenId;
  rows: number;
}

export const DebugOverlayBanner: React.FC<DebugOverlayBannerProps> = ({
  debugMode,
  guiScale,
  screen,
  rows,
}) => {
  if (!debugMode) return null;

  return (
    <div
      style={{
        width: 'var(--gui-width)',
        marginBottom: '8px',
        padding: '6px 10px',
        background: 'rgba(0, 32, 36, 0.9)',
        border: '1px solid #00ffcc',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: '#b8fff0',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '6px',
      }}
    >
      <div>
        <strong style={{ color: '#00ffcc' }}>[DEBUG GRID ON]</strong> Screen:{' '}
        <code>{screen}</code> | 容器宽度: <code>176px×{guiScale}={176 * guiScale}px</code>
      </div>
      <div>
        单槽位: <code>18×18px</code> (图标 <code>16×16px</code>) | 容器索引:{' '}
        <code>0~{rows * 9 - 1}</code> | 背包索引: <code>P0~P35</code>
      </div>
    </div>
  );
};
