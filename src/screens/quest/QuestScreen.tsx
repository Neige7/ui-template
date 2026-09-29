import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { PagerSlot } from '../../core/Pager';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import { Quest, QuestCategory, QuestStatus } from '../../types';

const QUEST_CAT_TABS: {
  key: QuestCategory;
  slot: number;
  label: string;
  icon: string;
}[] = [
  { key: 'main', slot: 0, label: '主线史诗', icon: 'sword_mythic' },
  { key: 'side', slot: 1, label: '支线轶事', icon: 'scroll_quest' },
  { key: 'daily', slot: 2, label: '日常委托', icon: 'potion_exp' },
  { key: 'weekly', slot: 3, label: '周常讨伐', icon: 'shield' },
  { key: 'event', slot: 4, label: '限时庆典', icon: 'gem_star' },
];

const STATUS_META: Record<
  QuestStatus,
  { badge: string; color: string; label: string; rarity: 'uncommon' | 'rare' | 'legendary' | 'common' }
> = {
  available: {
    badge: '可接',
    color: '#ffff55',
    label: '§e[可接取]',
    rarity: 'uncommon',
  },
  in_progress: {
    badge: '进行',
    color: '#55ffff',
    label: '§b[进行中]',
    rarity: 'rare',
  },
  claimable: {
    badge: '领奖',
    color: '#55ff55',
    label: '§a§l[可提交领奖]',
    rarity: 'legendary',
  },
  completed: {
    badge: '完成',
    color: '#888888',
    label: '§8[已完成]',
    rarity: 'common',
  },
};

export const QuestScreen: React.FC = () => {
  const { state } = useGui();
  const { selectedCategory, currentPage, selectedQuestId, quests } = state.quest;

  const categoryQuests = quests.filter((q) => q.category === selectedCategory);
  const pageSize = 10; // 左侧 5列 × 2行 = 10个任务槽位/页
  const totalPages = Math.max(1, Math.ceil(categoryQuests.length / pageSize));
  const pageQuests = categoryQuests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedQuest: Quest | null =
    categoryQuests.find((q) => q.id === selectedQuestId) ||
    categoryQuests[0] ||
    null;

  // 左侧列表槽位编号：第 2 行 (9..13) 与第 3 行 (18..22)
  const listSlotNumbers = [9, 10, 11, 12, 13, 18, 19, 20, 21, 22];

  const renderSlot = (slotNum: number) => {
    // 1. 顶部 0~4 任务大分类按钮
    const tab = QUEST_CAT_TABS.find((t) => t.slot === slotNum);
    if (tab) {
      const isSelected = selectedCategory === tab.key;
      const count = quests.filter((q) => q.category === tab.key).length;
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          state={isSelected ? 'selected' : 'normal'}
          badgeText={isSelected ? `★${count}` : String(count)}
          item={{
            id: `qcat_${tab.key}`,
            name: isSelected ? `§6§l${tab.label}` : `§7${tab.label}`,
            icon: tab.icon,
            rarity: isSelected ? 'legendary' : 'common',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: isSelected
              ? `§6★ ${tab.label} (当前分类)`
              : `§f切换至「${tab.label}」`,
            lore: [
              `§7该分类下共有 §e${count} §7项委托任务`,
              '§a▶ 左键切换分类（页码将自动重置为第 1 页）',
            ],
          }}
          payload={{ action: `quest_cat:${tab.key}` }}
        />
      );
    }

    // 槽位 8: 返回角色背包 Hub
    if (slotNum === 8) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          item={{
            id: 'back_hub',
            name: '§e返回角色行囊 (Hub)',
            icon: 'chest_plate',
            rarity: 'rare',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§e⬅ 返回角色行囊 (Hub)',
            lore: ['§7返回主背包与系统入口界面'],
          }}
          payload={{ action: 'nav_screen:inventory' }}
        />
      );
    }

    // 2. 左侧任务列表槽位 (9..13, 18..22)
    const listIdx = listSlotNumbers.indexOf(slotNum);
    if (listIdx !== -1) {
      // 空状态提示槽 (当分类下没有任何任务时，在槽位 11 显示空状态提示)
      if (categoryQuests.length === 0 && slotNum === 11) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="quest"
            state="disabled"
            placeholderIcon="book"
            badgeText="空"
            customTooltip={{
              title: '§7📭 当前分类暂无委托任务',
              lore: ['§8请切换其他任务分类或提升角色等级后再来查看。'],
            }}
          />
        );
      }

      const q = pageQuests[listIdx];
      if (!q) {
        return <Slot key={slotNum} slot={slotNum} screen="quest" state="normal" />;
      }

      const meta = STATUS_META[q.status];
      const isSelected = selectedQuest?.id === q.id;

      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          state={isSelected ? 'selected' : 'normal'}
          badgeText={q.isTracked ? '📍追踪' : meta.badge}
          badgeColor={q.isTracked ? '#ffd369' : meta.color}
          item={{
            id: q.id,
            name: q.name,
            icon: q.status === 'completed' ? 'book' : 'scroll_quest',
            rarity: meta.rarity,
            category: 'quest',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: `${q.name} ${meta.label}`,
            lore: [
              `§7推荐等级: §eLv.${q.level} ${q.isTracked ? '§6[📍计分板追踪中]' : ''}`,
              '',
              ...q.description,
              '',
              '§6【任务目标进度】',
              ...q.objectives.map(
                (o) =>
                  `§7- ${o.text}: ${
                    o.current >= o.target ? '§a' : '§e'
                  }${o.current}/${o.target}`
              ),
              '',
              '§a▶ 左键选中查看右侧详情与奖励',
            ],
          }}
          payload={{ action: 'select_quest', questId: q.id }}
        />
      );
    }

    // 3. 右侧选中任务详情槽 (槽位 15)
    if (slotNum === 15) {
      if (!selectedQuest) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="quest"
            state="disabled"
            placeholderIcon="book"
            customTooltip={{
              title: '§8未选择任务',
              lore: ['§7请在左侧列表点击选择一项任务查看详情。'],
            }}
          />
        );
      }
      const meta = STATUS_META[selectedQuest.status];
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          state="selected"
          badgeText={`Lv.${selectedQuest.level}`}
          item={{
            id: `detail_${selectedQuest.id}`,
            name: selectedQuest.name,
            icon: 'book',
            rarity: meta.rarity,
            category: 'quest',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: `${selectedQuest.name} ${meta.label}`,
            lore: [
              `§7推荐等级: §eLv.${selectedQuest.level}`,
              `§7通关赏金: §6+${selectedQuest.rewardGold || 0} 金币 §7| §b+${selectedQuest.rewardExp || 0} 经验`,
              '',
              ...selectedQuest.description,
              '',
              '§e【目标进度详情】',
              ...selectedQuest.objectives.map(
                (o) => `§f• ${o.text}: §b${o.current} §7/ §a${o.target}`
              ),
            ],
          }}
        />
      );
    }

    // 4. 右侧奖励物品预览槽 (槽位 24, 25, 26)
    if (slotNum >= 24 && slotNum <= 26) {
      const rewardIdx = slotNum - 24;
      const rewardItem = selectedQuest?.rewards[rewardIdx] || null;
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          item={rewardItem}
          badgeText={rewardItem ? '奖励' : undefined}
          badgeColor="#55ff55"
          customTooltip={
            !rewardItem
              ? {
                  title: `§8任务奖励槽 #${rewardIdx + 1} (无额外物品)`,
                  lore: ['§7完成并提交任务后，奖励物品将直接发放到下方背包。'],
                }
              : undefined
          }
          actionHints={['§6🎁 任务完成奖励预览 (提交任务后自动发放)']}
        />
      );
    }

    // 5. 底部分页槽位 (36, 37, 38)
    if (slotNum === 36) {
      return (
        <PagerSlot
          key={slotNum}
          type="prev"
          slot={36}
          screen="quest"
          currentPage={currentPage}
          totalPages={totalPages}
        />
      );
    }
    if (slotNum === 37) {
      return (
        <PagerSlot
          key={slotNum}
          type="indicator"
          slot={37}
          screen="quest"
          currentPage={currentPage}
          totalPages={totalPages}
        />
      );
    }
    if (slotNum === 38) {
      return (
        <PagerSlot
          key={slotNum}
          type="next"
          slot={38}
          screen="quest"
          currentPage={currentPage}
          totalPages={totalPages}
        />
      );
    }

    // 6. 右下角操作按钮区 (41: 追踪, 42: 放弃(二次确认), 43: 接取 / 提交)
    if (slotNum === 41) {
      const canTrack =
        selectedQuest &&
        selectedQuest.trackable &&
        (selectedQuest.status === 'in_progress' ||
          selectedQuest.status === 'claimable');
      if (!canTrack) {
        return <Slot key={slotNum} slot={slotNum} screen="quest" state="hidden" />;
      }
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          state={selectedQuest.isTracked ? 'selected' : 'normal'}
          badgeText={selectedQuest.isTracked ? '追踪中' : '追踪'}
          item={{
            id: 'btn_quest_track',
            name: selectedQuest.isTracked ? '§6📍 取消计分板追踪' : '§e📍 追踪此任务',
            icon: 'gem_star',
            rarity: 'rare',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: selectedQuest.isTracked ? '§6📍 已开启任务追踪' : '§e📍 开启任务追踪',
            lore: [
              '§7在屏幕右侧 HUD / 原版 Scoreboard 实时显示该任务目标进度。',
              '§a▶ 左键点击切换追踪状态',
            ],
          }}
          payload={{ action: 'quest_track' }}
        />
      );
    }

    if (slotNum === 42) {
      const canAbandon = selectedQuest && selectedQuest.status === 'in_progress';
      if (!canAbandon) {
        return <Slot key={slotNum} slot={slotNum} screen="quest" state="hidden" />;
      }
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          badgeText="放弃"
          badgeColor="#ff5555"
          item={{
            id: 'btn_quest_abandon',
            name: '§c✖ 放弃当前任务',
            icon: 'cross_red',
            rarity: 'mythic',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§c✖ 放弃任务 (需二次确认)',
            lore: [
              `§7放弃 ${selectedQuest.name} §7并将目标进度清零。`,
              '§c▶ 左键点击打开二次确认弹窗',
            ],
          }}
          payload={{ action: 'quest_abandon' }}
        />
      );
    }

    if (slotNum === 43) {
      if (!selectedQuest) {
        return <Slot key={slotNum} slot={slotNum} screen="quest" state="hidden" />;
      }
      if (selectedQuest.status === 'available') {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="quest"
            badgeText="接取"
            badgeColor="#55ff55"
            item={{
              id: 'btn_quest_accept',
              name: '§a✔ 接取此委托',
              icon: 'check_green',
              rarity: 'uncommon',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§a✔ 接取委托任务',
              lore: [
                `§7立即接取 ${selectedQuest.name}`,
                '§a▶ 左键点击接取',
              ],
            }}
            payload={{ action: 'quest_accept' }}
          />
        );
      }

      if (selectedQuest.status === 'claimable') {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="quest"
            state="selected"
            badgeText="领奖!"
            badgeColor="#55ff55"
            item={{
              id: 'btn_quest_submit',
              name: '§6§l🎁 提交任务并领取奖励',
              icon: 'check_green',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§6§l🎁 提交委托并领取奖励',
              lore: [
                '§7所有任务目标已达成！',
                `§7奖励金币: §6+${selectedQuest.rewardGold || 0} §7| 经验: §b+${selectedQuest.rewardExp || 0}`,
                '§a▶ 左键点击提交并将奖励放入下方背包',
              ],
            }}
            payload={{ action: 'quest_submit' }}
          />
        );
      }

      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="quest"
          state="disabled"
          placeholderIcon="book"
          badgeText={selectedQuest.status === 'completed' ? '已完结' : '进行中'}
          customTooltip={{
            title:
              selectedQuest.status === 'completed'
                ? '§8✔ 该任务已完成归档'
                : '§e⏳ 任务正在进行中',
            lore: [
              selectedQuest.status === 'completed'
                ? '§7您已经领取过该任务的全部奖励。'
                : '§7达成全部目标进度后即可在此处提交领奖。',
            ],
          }}
        />
      );
    }

    return <Slot key={slotNum} slot={slotNum} screen="quest" state="hidden" />;
  };

  return (
    <GuiFrame
      screen="quest"
      title={zh_CN.screens.quest}
      rows={5}
      subtitleRight={`§e${zh_CN.questCategories[selectedCategory]} §7(第 ${currentPage}/${totalPages} 页)`}
      footerBanner={
        selectedQuest ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <MinecraftText
                text={`${selectedQuest.name} §7(Lv.${selectedQuest.level}) · `}
              />
              <MinecraftText
                text={selectedQuest.objectives
                  .map((o) => `§f${o.text} §b${o.current}/${o.target}`)
                  .join(' §8| ')}
              />
            </div>
            <div>
              <MinecraftText
                text={`§6赏金: +${selectedQuest.rewardGold || 0}G`}
              />
            </div>
          </div>
        ) : (
          <MinecraftText text="§7📭 当前任务分类下暂无委托条目，请点击顶部槽位 0~4 切换分类。" />
        )
      }
    >
      {Array.from({ length: 45 }, (_, i) => renderSlot(i))}
    </GuiFrame>
  );
};
