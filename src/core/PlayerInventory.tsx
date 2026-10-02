import React from 'react';
import { ScreenId } from '../types';
import { useGui } from './GuiContext';
import { MinecraftText } from './MinecraftText';
import { Slot } from './Slot';

interface PlayerInventoryProps {
  screen?: ScreenId;
  actionHintText?: string;
}

export const PlayerInventory: React.FC<PlayerInventoryProps> = ({
  screen,
  actionHintText = '§e左键:拿放 §7| §b右键:半组/单放 §7| §aShift+左键:快速转移 §7| §d数字键1-9:快捷栏交换',
}) => {
  const { state } = useGui();
  const { inventory, gold, gems } = state.player;
  const activeScreen = screen || state.currentScreen;

  // P0 ~ P26: 3行×9列主背包
  const mainSlots = Array.from({ length: 27 }, (_, idx) => `P${idx}`);
  // P27 ~ P35: 1行×9列快捷栏
  const hotbarSlots = Array.from({ length: 9 }, (_, idx) => `P${idx + 27}`);

  return (
    <div style={{ marginTop: 'calc(4px * var(--gui-scale))' }}>
      <div className="mc-section-divider">
        <span>
          <MinecraftText text="§7玩家行囊 §8(P0~P35 · 3×9 + 1×9)" />
        </span>
        <span style={{ display: 'flex', gap: 'calc(2px * var(--gui-scale))' }}>
          <span className="mc-currency-chip chip-gold">
            <MinecraftText text={`§6🪙 ${gold.toLocaleString()}`} />
          </span>
          <span className="mc-currency-chip chip-gems">
            <MinecraftText text={`§b💎 ${gems.toLocaleString()}`} />
          </span>
        </span>
      </div>

      {/* 3×9 主背包 */}
      <div className="mc-slot-grid">
        {mainSlots.map((slotId, idx) => (
          <Slot
            key={slotId}
            slot={slotId}
            screen={activeScreen}
            item={inventory[idx] || null}
            actionHints={[actionHintText]}
          />
        ))}
      </div>

      {/* 原版 MC 主背包与快捷栏之间的 4px 间隔 */}
      <div style={{ height: 'calc(4px * var(--gui-scale))' }} />

      {/* 1×9 快捷栏 */}
      <div className="mc-slot-grid">
        {hotbarSlots.map((slotId, idx) => {
          const invIdx = idx + 27;
          return (
            <Slot
              key={slotId}
              slot={slotId}
              screen={activeScreen}
              item={inventory[invIdx] || null}
              badgeText={String(idx + 1)}
              badgeColor="#7c84a8"
              actionHints={[actionHintText, `§8快捷键栏位 #${idx + 1}`]}
            />
          );
        })}
      </div>
    </div>
  );
};
