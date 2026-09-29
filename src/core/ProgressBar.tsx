import React from 'react';
import { useGui } from './GuiContext';
import { MinecraftText } from './MinecraftText';

interface ProgressBarProps {
  /** 起始列 0~8 */
  startCol: number;
  /** 所在行 0~5 */
  row: number;
  /** 跨越槽位列数，如 5 表示跨 5 格 */
  spanCols: number;
  current: number;
  max: number;
  label: string;
  variant?: 'capacity' | 'exp' | 'guild';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  startCol,
  row,
  spanCols,
  current,
  max,
  label,
  variant = 'capacity',
}) => {
  const { debugMode } = useGui();
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  const pct = Math.round(ratio * 100);

  // 接近上限时自动变色（>=90% 红色，>=75% 橙色，默认青绿/金色）
  let fillColor = '#44cc77';
  if (variant === 'capacity') {
    if (ratio >= 0.9) fillColor = '#ff4455';
    else if (ratio >= 0.75) fillColor = '#ffaa00';
    else fillColor = '#33bbdd';
  } else if (variant === 'exp') {
    fillColor = '#a855f7';
  } else {
    fillColor = '#f59e0b';
  }

  return (
    <div
      className="mc-spanning-bar"
      style={{
        left: `calc(${startCol} * var(--slot-size))`,
        top: `calc(${row} * var(--slot-size))`,
        width: `calc(${spanCols} * var(--slot-size))`,
        height: 'var(--slot-size)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: 'calc(11px * var(--gui-scale))',
          background: 'rgba(12, 14, 22, 0.92)',
          border: 'var(--px) solid #4f5678',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: fillColor,
            opacity: 0.75,
            transition: 'width 0.2s ease, background 0.2s ease',
          }}
        />
        <span
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: 'calc(4.3px * var(--gui-scale))',
            textShadow: 'var(--px) var(--px) 0 #090a10',
            whiteSpace: 'nowrap',
          }}
        >
          <MinecraftText text={label} />
        </span>
      </div>
      {debugMode && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '2px',
            fontSize: '9px',
            color: '#ffd369',
            background: 'rgba(0,0,0,0.85)',
            padding: '0 3px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          [Layer: dynamic_text + background]
        </span>
      )}
    </div>
  );
};
