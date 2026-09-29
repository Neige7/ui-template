import React from 'react';
import { ScreenId } from '../types';
import { Slot } from './Slot';

interface PagerSlotProps {
  type: 'prev' | 'indicator' | 'next';
  slot: number;
  screen?: ScreenId;
  currentPage: number;
  totalPages: number;
  extraLore?: string[];
  payloadPrefix?: string;
}

export const PagerSlot: React.FC<PagerSlotProps> = ({
  type,
  slot,
  screen,
  currentPage,
  totalPages,
  extraLore = [],
  payloadPrefix = 'page',
}) => {
  const safeTotal = Math.max(1, totalPages);

  if (type === 'prev') {
    const canPrev = currentPage > 1;
    return (
      <Slot
        slot={slot}
        screen={screen}
        state={canPrev ? 'normal' : 'disabled'}
        placeholderIcon="arrow_left"
        item={
          canPrev
            ? {
                id: 'btn_prev_page',
                name: '§e◀ 上一页',
                icon: 'arrow_left',
                rarity: 'uncommon',
                category: 'other',
                amount: 1,
                maxStack: 1,
                lore: [],
              }
            : null
        }
        customTooltip={{
          title: canPrev ? '§e◀ 上一页' : '§7◀ 上一页 (已达首页)',
          lore: [
            `§7当前页码: §f${currentPage} §7/ §b${safeTotal}`,
            ...extraLore,
            canPrev ? '§a▶ 左键切换至上一页' : '§8当前已经是第 1 页',
          ],
        }}
        payload={{ action: `${payloadPrefix}_prev` }}
      />
    );
  }

  if (type === 'next') {
    const canNext = currentPage < safeTotal;
    return (
      <Slot
        slot={slot}
        screen={screen}
        state={canNext ? 'normal' : 'disabled'}
        placeholderIcon="arrow_right"
        item={
          canNext
            ? {
                id: 'btn_next_page',
                name: '§e下一页 ▶',
                icon: 'arrow_right',
                rarity: 'uncommon',
                category: 'other',
                amount: 1,
                maxStack: 1,
                lore: [],
              }
            : null
        }
        customTooltip={{
          title: canNext ? '§e下一页 ▶' : '§7下一页 ▶ (已达末页)',
          lore: [
            `§7当前页码: §f${currentPage} §7/ §b${safeTotal}`,
            ...extraLore,
            canNext ? '§a▶ 左键切换至下一页' : '§8当前已经是最后一页',
          ],
        }}
        payload={{ action: `${payloadPrefix}_next` }}
      />
    );
  }

  // indicator
  return (
    <Slot
      slot={slot}
      screen={screen}
      state="normal"
      badgeText={`${currentPage}/${safeTotal}`}
      item={{
        id: 'page_indicator',
        name: `§b第 ${currentPage}/${safeTotal} 页`,
        icon: 'book',
        rarity: 'rare',
        category: 'other',
        amount: currentPage,
        maxStack: 99,
        lore: [],
      }}
      customTooltip={{
        title: `§b📖 页码指示 (第 ${currentPage}/${safeTotal} 页)`,
        lore: [
          `§7当前处于第 §f${currentPage} §7页，共 §b${safeTotal} §7页`,
          ...extraLore,
        ],
      }}
      payload={{ action: `${payloadPrefix}_info` }}
    />
  );
};
