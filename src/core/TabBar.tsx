import React from 'react';
import { ItemRarity, ScreenId } from '../types';
import { Slot } from './Slot';

export interface TabOption {
  key: string;
  slot: number;
  label: string;
  icon: string;
  rarity?: ItemRarity;
  lore?: string[];
  badgeText?: string;
  badgeColor?: string;
}

interface TabSlotProps {
  tab: TabOption;
  activeKey: string;
  screen?: ScreenId;
  actionPrefix?: string;
}

export const TabSlot: React.FC<TabSlotProps> = ({
  tab,
  activeKey,
  screen,
  actionPrefix = 'tab',
}) => {
  const isSelected = tab.key === activeKey;

  return (
    <Slot
      slot={tab.slot}
      screen={screen}
      state={isSelected ? 'selected' : 'normal'}
      badgeText={tab.badgeText || (isSelected ? '★' : undefined)}
      badgeColor={tab.badgeColor || (isSelected ? '#ffd369' : undefined)}
      item={{
        id: `tab_${tab.key}`,
        name: isSelected ? `§6§l${tab.label}` : `§7${tab.label}`,
        icon: tab.icon,
        rarity: isSelected ? 'legendary' : tab.rarity || 'common',
        category: 'other',
        amount: 1,
        maxStack: 1,
        lore: [],
      }}
      customTooltip={{
        title: isSelected ? `§6★ ${tab.label} §a(当前选中)` : `§f${tab.label}`,
        lore: [
          ...(tab.lore || []),
          '',
          isSelected ? '§8当前已处于该分类视图' : '§e▶ 左键点击切换至此分类',
        ],
      }}
      payload={{ action: `${actionPrefix}:${tab.key}`, tabKey: tab.key }}
    />
  );
};
