import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { PagerSlot } from '../../core/Pager';
import { ProgressBar } from '../../core/ProgressBar';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import { calculateWarehouseTotalAmount } from '../../mock/scenarios';
import { getFilteredWarehouseIndices } from '../../mock/server';
import {
  Item,
  ScreenId,
  Warehouse,
  WarehouseFilterCategory,
} from '../../types';

const CATEGORY_DEFS: {
  key: WarehouseFilterCategory;
  label: string;
  icon: string;
}[] = [
  { key: 'all', label: '全部物品', icon: 'warehouse' },
  { key: 'equipment', label: '武器装备', icon: 'sword_iron' },
  { key: 'material', label: '锻造材料', icon: 'ore_mythril' },
  { key: 'consumable', label: '消耗药剂', icon: 'potion_hp' },
  { key: 'quest', label: '任务信物', icon: 'scroll_quest' },
  { key: 'other', label: '杂项珍宝', icon: 'coin_gold' },
];

export interface ReusableWarehouseGridProps {
  screen: ScreenId;
  warehouse: Warehouse;
  currentPage: number;
  selectedCategory: WarehouseFilterCategory;
  searchQuery: string;
  capacityMode?: 'stack_sum' | 'slot_count';
  canUnlock?: boolean;
  unlockCostLabel?: string;
  topRowOverride?: React.ReactNode;
}

/**
 * 可复用的仓库 5 行网格内核（被私人仓库与公会仓库共同复用）
 */
export const ReusableWarehouseGrid: React.FC<ReusableWarehouseGridProps> = ({
  screen,
  warehouse,
  currentPage,
  selectedCategory,
  searchQuery,
  capacityMode = 'stack_sum',
  canUnlock = true,
  unlockCostLabel,
  topRowOverride,
}) => {
  const isFiltered =
    selectedCategory !== 'all' || searchQuery.trim().length > 0;
  const filteredIndices = getFilteredWarehouseIndices(
    warehouse.slots,
    warehouse.unlockedCount,
    warehouse.maxSlots,
    selectedCategory,
    searchQuery
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      (isFiltered ? Math.max(1, filteredIndices.length) : warehouse.maxSlots) /
        27
    )
  );

  // 第 2~4 行 (槽位 9 ~ 35): 27 个仓库存储格
  const storageCells = Array.from({ length: 27 }, (_, localIdx) => {
    const slotNum = 9 + localIdx;
    const pageOffset = (currentPage - 1) * 27 + localIdx;

    if (isFiltered) {
      const realIdx = filteredIndices[pageOffset];
      const item: Item | null =
        realIdx !== undefined ? warehouse.slots[realIdx] : null;
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={screen}
          item={item}
          state="normal"
          badgeText={realIdx !== undefined ? `#${realIdx + 1}` : undefined}
          badgeColor="#8e96b8"
          actionHints={[
            '§e左键:拿放 §7| §b右键:半组/单放',
            '§aShift+左键:快速转移至玩家背包',
            '§8[筛选模式] 放入物品将自动存入真实空闲槽位',
          ]}
        />
      );
    }

    // 非筛选真实槽位视图
    const realIdx = pageOffset;
    const isLocked = realIdx >= warehouse.unlockedCount;
    const isBeyondMax = realIdx >= warehouse.maxSlots;
    const item = !isLocked && !isBeyondMax ? warehouse.slots[realIdx] : null;

    return (
      <Slot
        key={slotNum}
        slot={slotNum}
        screen={screen}
        item={item}
        state={isBeyondMax ? 'hidden' : isLocked ? 'locked' : 'normal'}
        actionHints={[
          '§e左键:拿起/放入 §7| §b右键:拿一半/放一个',
          '§aShift+左键:快速取回玩家背包 §7| §d数字键1-9:快捷栏交换',
        ]}
      />
    );
  });

  // 槽位 43 解锁按钮可见性判断 (遵循 6.7)
  const showUnlockButton =
    canUnlock &&
    warehouse.canUnlockPermissions &&
    warehouse.unlockedCount < warehouse.maxSlots;

  return (
    <>
      {/* 第 1 行 (槽位 0 ~ 8) */}
      {topRowOverride ? (
        topRowOverride
      ) : (
        <>
          {CATEGORY_DEFS.map((cat, idx) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Slot
                key={idx}
                slot={idx}
                screen={screen}
                state={isSelected ? 'selected' : 'normal'}
                badgeText={isSelected ? '★' : undefined}
                item={{
                  id: `cat_${cat.key}`,
                  name: isSelected ? `§6§l${cat.label}` : `§7${cat.label}`,
                  icon: cat.icon,
                  rarity: isSelected ? 'legendary' : 'common',
                  category: 'other',
                  amount: 1,
                  maxStack: 1,
                  lore: [],
                }}
                customTooltip={{
                  title: isSelected
                    ? `§6★ 分类: ${cat.label} (当前选中)`
                    : `§f分类筛选: ${cat.label}`,
                  lore: [
                    '§7只显示对应分类的仓库物品，分页自动重新计算。',
                    '§e▶ 左键切换分类并重置页码为 1',
                  ],
                }}
              />
            );
          })}

          {/* 槽位 6: 返回角色背包 Hub 入口 */}
          <Slot
            slot={6}
            screen={screen}
            item={{
              id: 'btn_back_hub',
              name: '§e返回角色背包 (Hub)',
              icon: 'chest_plate',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§e⬅ 返回角色行囊 (Hub)',
              lore: ['§7返回角色主背包与系统导航中心', '§a▶ 左键点击切换'],
            }}
            payload={{ action: 'nav_screen:inventory' }}
          />

          {/* 槽位 7: 排序按钮 */}
          <Slot
            slot={7}
            screen={screen}
            item={{
              id: 'btn_sort',
              name: '§d整理与品质排序',
              icon: 'sort',
              rarity: 'epic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§d✨ 整理与品质排序 (槽位 7)',
              lore: [
                '§7将已解锁槽位内的物品按稀有度与名称自动对齐排列。',
                '§a▶ 左键点击立即整理',
              ],
            }}
          />

          {/* 槽位 8: 搜索按钮（左键输入，右键清除） */}
          <Slot
            slot={8}
            screen={screen}
            state={searchQuery ? 'selected' : 'normal'}
            badgeText={searchQuery ? '🔍' : undefined}
            item={{
              id: 'btn_search',
              name: searchQuery
                ? `§b搜索中: "${searchQuery}"`
                : '§b搜索仓库物品',
              icon: 'search',
              rarity: searchQuery ? 'legendary' : 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: searchQuery
                ? `§b🔍 搜索生效中: §e"${searchQuery}"`
                : '§b🔍 跨页搜索物品 (槽位 8)',
              lore: [
                '§7跨所有页与当前分类检索物品名称及 Lore。',
                '§8[MC输入源: 铁砧 AnvilGUI / 模组 GuiTextField]',
                '',
                '§a▶ 左键点击输入搜索关键词',
                searchQuery ? '§c▶ 右键点击清除当前搜索词' : '§8当前无搜索过滤',
              ],
            }}
          />
        </>
      )}

      {/* 第 2~4 行 (槽位 9 ~ 35): 27 格仓库存储区 */}
      {storageCells}

      {/* 第 5 行 (槽位 36 ~ 44): 分页、总量限制条、解锁下一槽位 */}
      <PagerSlot
        type="prev"
        slot={36}
        screen={screen}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      <Slot
        slot={37}
        screen={screen}
        badgeText={`${currentPage}/${totalPages}`}
        item={{
          id: 'wh_page_info',
          name: `§b第 ${currentPage}/${totalPages} 页`,
          icon: 'book',
          rarity: 'rare',
          category: 'other',
          amount: currentPage,
          maxStack: 99,
          lore: [],
        }}
        customTooltip={{
          title: `§b📖 页码指示: 第 ${currentPage}/${totalPages} 页 (槽位 37)`,
          lore: [
            `§7已解锁槽位: §a${warehouse.unlockedCount} §7/ §f${warehouse.maxSlots} 格`,
            `§7当前统计模式: §e${
              capacityMode === 'stack_sum'
                ? '堆叠总数 / 总上限 (默认)'
                : '占用槽位数 / 已解锁槽位'
            }`,
            '',
            '§e▶ 左键点击可切换「堆叠总数 / 槽位占用」统计显示',
          ],
        }}
        payload={{ action: 'toggle_capacity_mode' }}
      />

      {/* 槽位 38 ~ 42: 底层占位槽，上层由 ProgressBar 跨 5 格绘制 */}
      {[38, 39, 40, 41, 42].map((s) => (
        <Slot
          key={s}
          slot={s}
          screen={screen}
          state="hidden"
          customTooltip={{
            title: '§6📊 仓库总量限制条 (跨槽位 38-42)',
            lore: [
              `§7当前物品堆叠总数: §e${warehouse.totalAmount} §7/ §f${warehouse.maxTotalAmount}`,
              `§7已解锁槽位进度: §a${warehouse.unlockedCount} §7/ §f${warehouse.maxSlots}`,
            ],
          }}
        />
      ))}

      {/* 槽位 43: 解锁下一个槽位（条件可见，已达上限或无权限时为 hidden） */}
      {showUnlockButton ? (
        <Slot
          slot={43}
          screen={screen}
          badgeText="+1"
          badgeColor="#55ff55"
          item={{
            id: 'btn_unlock_next',
            name: '§6🔓 解锁下一格槽位',
            icon: 'unlock_plus',
            rarity: 'legendary',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: `§6🔓 解锁第 #${warehouse.unlockedCount + 1} 号仓库槽位 (槽位 43)`,
            lore: [
              `§7当前已解锁: §a${warehouse.unlockedCount} §7/ §f${warehouse.maxSlots} 格`,
              `§7解锁花费: §6${unlockCostLabel || `${warehouse.unlockCostGold} 金币`}`,
              '§7规则: 按顺序逐个解锁，未解锁槽位显示锁图标。',
              '',
              '§a▶ 左键点击立即解锁下一格',
            ],
          }}
        />
      ) : (
        <Slot slot={43} screen={screen} state="hidden" />
      )}

      <PagerSlot
        type="next"
        slot={44}
        screen={screen}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </>
  );
};

export const WarehouseScreen: React.FC = () => {
  const { state } = useGui();
  const wh = state.warehouse;

  const isStackMode = wh.capacityMode === 'stack_sum';
  const currentVal = isStackMode
    ? calculateWarehouseTotalAmount(wh.slots, 'stack_sum')
    : calculateWarehouseTotalAmount(wh.slots, 'slot_count');
  const maxVal = isStackMode ? wh.maxTotalAmount : wh.unlockedCount;

  const barLabel = isStackMode
    ? `§f总堆叠数: §e${currentVal} §7/ §6${maxVal}`
    : `§f已用槽位: §b${currentVal} §7/ §a${maxVal}`;

  return (
    <GuiFrame
      screen="warehouse"
      title={zh_CN.screens.warehouse}
      rows={5}
      subtitleRight={`§7已解锁 §a${wh.unlockedCount}§7/${wh.maxSlots}格`}
      overlayElements={
        <ProgressBar
          startCol={2} // 对应槽位 38 (第 5 行 row=4, col=2..6 共 5 格)
          row={4}
          spanCols={5}
          current={currentVal}
          max={maxVal}
          label={barLabel}
          variant="capacity"
        />
      }
      footerBanner={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            <MinecraftText
              text={
                wh.searchQuery
                  ? `§b🔍 搜索过滤: "${wh.searchQuery}" §7(右键槽位8清除)`
                  : `§7分类: §e${wh.selectedCategory.toUpperCase()} §7| Shift+左键可在仓库与背包间快速转移`
              }
            />
          </span>
          <span>
            <MinecraftText text={`§7单格解锁费: §6${wh.unlockCostGold} 金币`} />
          </span>
        </div>
      }
    >
      <ReusableWarehouseGrid
        screen="warehouse"
        warehouse={wh}
        currentPage={wh.currentPage}
        selectedCategory={wh.selectedCategory}
        searchQuery={wh.searchQuery}
        capacityMode={wh.capacityMode}
      />
    </GuiFrame>
  );
};
