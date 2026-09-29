import React from 'react';
import { TooltipPayload } from './GuiContext';
import {
  getMcVisualLength,
  MC_SAFE_LINE_UNITS,
  MinecraftText,
} from './MinecraftText';

interface TooltipProps {
  tooltip: TooltipPayload | null;
  debugMode?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ tooltip, debugMode = true }) => {
  if (!tooltip) return null;

  const allLines = [tooltip.title, ...tooltip.lore];
  const overlongLines = allLines.filter(
    (line) => getMcVisualLength(line) > MC_SAFE_LINE_UNITS
  );

  // 防止超出浏览器视口右/下边界
  const left = Math.min(tooltip.x + 16, window.innerWidth - 350);
  const top = Math.min(tooltip.y + 12, window.innerHeight - 240);

  return (
    <div
      className="mc-tooltip"
      style={{
        left: `${Math.max(8, left)}px`,
        top: `${Math.max(8, top)}px`,
      }}
    >
      <div className="mc-tooltip-title">
        <MinecraftText text={tooltip.title} />
      </div>
      {tooltip.lore.map((line, idx) => (
        <div key={idx} className="mc-tooltip-lore-line">
          {line === '' ? (
            <span>&nbsp;</span>
          ) : (
            <MinecraftText text={line} defaultColor="#AAAAAA" />
          )}
        </div>
      ))}
      {debugMode && (
        <div
          style={{
            marginTop: '6px',
            paddingTop: '4px',
            borderTop: '1px dashed rgba(120, 100, 180, 0.35)',
            fontSize: '10px',
            color: '#7c84a8',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Slot: {String(tooltip.slotId)}</span>
          <span>MaxWidth: {Math.max(...allLines.map(getMcVisualLength))}/{MC_SAFE_LINE_UNITS}u</span>
        </div>
      )}
      {overlongLines.length > 0 && (
        <div className="mc-tooltip-warning">
          ⚠ [MC 宽度警告] 有 {overlongLines.length} 行文本超过 {MC_SAFE_LINE_UNITS} 字符宽度单位，移植到原版容器时建议折行。
        </div>
      )}
    </div>
  );
};
