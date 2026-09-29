import React from 'react';
import { Item, ScreenId, SlotVisualState } from '../types';
import { useGui } from './GuiContext';
import { ItemIcon } from './ItemIcon';

export interface SlotProps {
  slot: number | string; // 容器槽位 0~53 或 背包 P0~P35
  screen?: ScreenId;
  item?: Item | null;
  state?: SlotVisualState;
  badgeText?: string;
  badgeColor?: string;
  placeholderIcon?: string;
  customTooltip?: {
    title: string;
    lore: string[];
  };
  actionHints?: string[];
  payload?: unknown;
}

const RARITY_COLOR_CODE: Record<string, string> = {
  common: '§f',
  uncommon: '§a',
  rare: '§b',
  epic: '§d',
  legendary: '§6',
  mythic: '§c',
};

const RARITY_LABEL: Record<string, string> = {
  common: '§7[普通品质]',
  uncommon: '§a[优秀品质]',
  rare: '§b[精良品质]',
  epic: '§d[史诗品质]',
  legendary: '§6[传说品质]',
  mythic: '§c[神话品质]',
};

export const Slot: React.FC<SlotProps> = ({
  slot,
  screen,
  item,
  state = 'normal',
  badgeText,
  badgeColor,
  placeholderIcon,
  customTooltip,
  actionHints,
  payload,
}) => {
  const { state: serverState, dispatchAction, debugMode, setTooltip } = useGui();
  const activeScreen = screen || serverState.currentScreen;

  const buildTooltip = (): { title: string; lore: string[] } | null => {
    if (state === 'hidden') return null;
    if (customTooltip) {
      const lore = [...customTooltip.lore];
      if (actionHints && actionHints.length > 0) {
        lore.push('', ...actionHints);
      }
      return { title: customTooltip.title, lore };
    }
    if (state === 'locked') {
      return {
        title: '§c🔒 未解锁槽位',
        lore: [
          '§7该槽位尚未开启，无法存放物品。',
          '§8请点击右下角「解锁下一格槽位」按钮按序解锁。',
        ],
      };
    }
    if (item) {
      const prefix = RARITY_COLOR_CODE[item.rarity] || '§f';
      const title = item.name.startsWith('§') ? item.name : `${prefix}${item.name}`;
      const lore: string[] = [RARITY_LABEL[item.rarity] || '§7[普通]'];
      if (item.bindType === 'bind_on_pickup') {
        lore.push('§c拾取后已绑定');
      } else if (item.bindType === 'bind_on_equip') {
        lore.push('§e装备后绑定');
      }
      if (item.stats) {
        lore.push('');
        if (item.stats.attack) lore.push(`§7攻击力: §c+${item.stats.attack}`);
        if (item.stats.defense) lore.push(`§7防御力: §a+${item.stats.defense}`);
        if (item.stats.hp) lore.push(`§7生命上限: §d+${item.stats.hp}`);
        if (item.stats.critRate) lore.push(`§7暴击率: §6+${item.stats.critRate}%`);
        if (item.stats.speed) lore.push(`§7移动速度: §b+${item.stats.speed}%`);
      }
      if (item.lore && item.lore.length > 0) {
        lore.push('', ...item.lore);
      }
      lore.push(`§8堆叠: ${item.amount}/${item.maxStack}`);
      if (actionHints && actionHints.length > 0) {
        lore.push('', ...actionHints);
      }
      return { title, lore };
    }
    return null;
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const tip = buildTooltip();
    if (tip) {
      setTooltip({
        title: tip.title,
        lore: tip.lore,
        slotId: slot,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const tip = buildTooltip();
    if (tip) {
      setTooltip({
        title: tip.title,
        lore: tip.lore,
        slotId: slot,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (state === 'disabled' || state === 'locked' || state === 'hidden') return;
    const isShift = e.shiftKey;
    dispatchAction({
      screen: activeScreen,
      slot,
      click: isShift ? 'shift_left' : 'left',
      payload,
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (state === 'disabled' || state === 'locked' || state === 'hidden') return;
    const isShift = e.shiftKey;
    dispatchAction({
      screen: activeScreen,
      slot,
      click: isShift ? 'shift_right' : 'right',
      payload,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (state === 'disabled' || state === 'locked' || state === 'hidden') return;
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      dispatchAction({
        screen: activeScreen,
        slot,
        click: 'number_key',
        payload: Number(e.key) - 1, // 快捷栏索引 0~8 (对应 P27~P35)
      });
    } else if (e.key === 'q' || e.key === 'Q' || e.key === 'Delete') {
      e.preventDefault();
      dispatchAction({
        screen: activeScreen,
        slot,
        click: 'drop',
        payload,
      });
    }
  };

  const rarityClass = item ? `rarity-frame-${item.rarity}` : '';

  return (
    <div
      className={`mc-slot state-${state} ${rarityClass}`}
      tabIndex={state === 'normal' || state === 'selected' ? 0 : -1}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      data-slot={String(slot)}
    >
      {debugMode && <span className="mc-debug-slot-index">{String(slot)}</span>}

      {state === 'locked' && <ItemIcon icon="lock" rarity="common" />}

      {state !== 'locked' && state !== 'hidden' && item && (
        <>
          <ItemIcon icon={item.icon} rarity={item.rarity} />
          {item.amount > 1 && <span className="mc-item-amount">{item.amount}</span>}
        </>
      )}

      {state !== 'locked' && state !== 'hidden' && !item && placeholderIcon && (
        <div style={{ opacity: 0.35 }}>
          <ItemIcon icon={placeholderIcon} rarity="common" />
        </div>
      )}

      {badgeText && state !== 'hidden' && (
        <span
          className="mc-slot-badge"
          style={badgeColor ? { color: badgeColor } : undefined}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
};
