import React from 'react';
import { ScreenId } from '../types';
import { useGui } from './GuiContext';
import { MinecraftText } from './MinecraftText';
import { PlayerInventory } from './PlayerInventory';

interface GuiFrameProps {
  screen: ScreenId;
  title: string;
  rows: number; // 1 ~ 6 (MC 容器最大 6 行 = 54 格)
  subtitleRight?: string;
  children: React.ReactNode;
  overlayElements?: React.ReactNode;
  footerBanner?: React.ReactNode;
  playerInventoryHint?: string;
}

export const GuiFrame: React.FC<GuiFrameProps> = ({
  screen,
  title,
  rows,
  subtitleRight,
  children,
  overlayElements,
  footerBanner,
  playerInventoryHint,
}) => {
  const { debugMode } = useGui();
  const safeRows = Math.min(6, Math.max(1, rows));

  return (
    <div
      className={`mc-gui-frame ${debugMode ? 'mc-debug-grid-active' : ''}`}
      data-screen={screen}
      data-rows={safeRows}
    >
      {/* 顶部标题栏 (dynamic_text layer) */}
      <div className="mc-gui-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MinecraftText text={title} />
          {debugMode && (
            <span className="mc-debug-layer-tag">
              {safeRows}×9={safeRows * 9}格
            </span>
          )}
        </div>
        {subtitleRight && (
          <div>
            <MinecraftText text={subtitleRight} />
          </div>
        )}
      </div>

      {/* 容器区 9列 × rows行 槽位网格 */}
      <div
        className="mc-slot-grid"
        style={{
          height: `calc(${safeRows} * var(--slot-size))`,
        }}
      >
        {children}
        {overlayElements}
      </div>

      {/* 可选动态信息横幅 (标注为 dynamic_text / mod overlay 层) */}
      {footerBanner && (
        <div
          style={{
            width: 'var(--grid-width)',
            margin: 'calc(2px * var(--gui-scale)) auto 0',
            padding: 'calc(2px * var(--gui-scale)) calc(3px * var(--gui-scale))',
            background: '#171924',
            border: 'var(--px) solid #373d59',
            fontSize: 'calc(4.4px * var(--gui-scale))',
            lineHeight: 1.35,
            position: 'relative',
          }}
        >
          {debugMode && (
            <span
              style={{
                position: 'absolute',
                top: 1,
                right: 3,
                fontSize: '9px',
                color: '#ffd369',
                fontFamily: 'var(--font-mono)',
              }}
            >
              [dynamic_text layer]
            </span>
          )}
          {footerBanner}
        </div>
      )}

      {/* 下方 3×9 + 1×9 玩家背包 (P0~P35) */}
      <PlayerInventory screen={screen} actionHintText={playerInventoryHint} />
    </div>
  );
};
