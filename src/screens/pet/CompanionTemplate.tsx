import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { MinecraftText } from '../../core/MinecraftText';
import { PagerSlot } from '../../core/Pager';
import { ProgressBar } from '../../core/ProgressBar';
import { Slot } from '../../core/Slot';
import { Companion } from '../../types';

export interface CompanionTemplateConfig {
  mode: 'pet' | 'mount';
  title: string;
  emptyTitle: string;
  emptyLore: string[];
  activeBadgeText: string;
  activeButtonActivateLabel: string;
  activeButtonRecallLabel: string;
  equipSlotTitle: string;
  equipPlaceholderIcon: string;
  showSpeedAndSkin?: boolean;
}

interface CompanionTemplateProps {
  config: CompanionTemplateConfig;
  companions: Companion[];
  selectedId: string | null;
  currentPage: number;
  equipSlotCount: 1 | 3;
}

export const CompanionTemplate: React.FC<CompanionTemplateProps> = ({
  config,
  companions,
  selectedId,
  currentPage,
  equipSlotCount,
}) => {
  const { mode, title } = config;
  const pageSize = 8; // 左侧 4列 × 2行 (槽位 9..12, 18..21)
  const totalPages = Math.max(1, Math.ceil(companions.length / pageSize));
  const pageItems = companions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selected: Companion | null =
    companions.find((c) => c.id === selectedId) || companions[0] || null;

  const listSlots = [9, 10, 11, 12, 18, 19, 20, 21];

  const renderSlot = (slotNum: number) => {
    // 槽位 0: 模式说明与当前出战状态汇总
    if (slotNum === 0) {
      const activeOne = companions.find((c) => c.isActive);
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          badgeText={activeOne ? config.activeBadgeText : '未激活'}
          badgeColor={activeOne ? '#55ff55' : '#888888'}
          item={{
            id: `summary_${mode}`,
            name: activeOne
              ? `§a当前${config.activeBadgeText}: ${activeOne.name}`
              : `§7当前无${config.activeBadgeText}伙伴`,
            icon: activeOne ? activeOne.icon : config.equipPlaceholderIcon,
            rarity: activeOne ? activeOne.rarity : 'common',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: activeOne
              ? `§a★ 当前${config.activeBadgeText}: ${activeOne.name}`
              : `§7尚未设置${config.activeBadgeText}`,
            lore: [
              '§7规则: 同时仅允许 1 只伙伴处于激活状态 (用户确认项 3)。',
              ...(activeOne
                ? activeOne.attributes.map((a) => `§7${a.label}: §a${a.value}`)
                : ['§8请在下方列表选择伙伴并点击激活按钮']),
            ],
          }}
        />
      );
    }

    // 槽位 7: 切换装备槽数量配置 (1格 默认 vs 3格 扩展演示)
    if (slotNum === 7) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          badgeText={`${equipSlotCount}槽`}
          item={{
            id: 'btn_toggle_equip_count',
            name: `§d装备槽配置: ${equipSlotCount} 格`,
            icon: 'sort',
            rarity: 'epic',
            category: 'other',
            amount: equipSlotCount,
            maxStack: 3,
            lore: [],
          }}
          customTooltip={{
            title: `§d⚙ 伙伴装备槽数量配置: 当前 ${equipSlotCount} 格`,
            lore: [
              '§7默认采用 1 个伙伴装备槽（符合用户确认项 3），',
              '§7同时支持一键切换为 3 槽模式以验证多护具扩展布局。',
              '',
              '§e▶ 左键点击切换 1 格 / 3 格装备槽模式',
            ],
          }}
          payload={{ action: 'toggle_equip_slot_count' }}
        />
      );
    }

    // 槽位 8: 返回角色行囊 Hub
    if (slotNum === 8) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
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
            lore: ['§7返回角色背包主界面'],
          }}
          payload={{ action: 'nav_screen:inventory' }}
        />
      );
    }

    // 左侧伙伴列表槽位 (9..12, 18..21)
    const listIdx = listSlots.indexOf(slotNum);
    if (listIdx !== -1) {
      if (companions.length === 0 && slotNum === 10) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen={mode}
            state="disabled"
            placeholderIcon={config.equipPlaceholderIcon}
            badgeText="空"
            customTooltip={{
              title: config.emptyTitle,
              lore: config.emptyLore,
            }}
          />
        );
      }

      const comp = pageItems[listIdx];
      if (!comp) {
        return <Slot key={slotNum} slot={slotNum} screen={mode} state="normal" />;
      }

      const isSelected = selected?.id === comp.id;
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          state={isSelected ? 'selected' : 'normal'}
          badgeText={comp.isActive ? config.activeBadgeText : `Lv.${comp.level}`}
          badgeColor={comp.isActive ? '#55ff55' : '#9ba3c4'}
          item={{
            id: comp.id,
            name: comp.name,
            icon: comp.icon,
            rarity: comp.rarity,
            category: 'other',
            amount: comp.level,
            maxStack: 99,
            lore: [],
          }}
          customTooltip={{
            title: `${comp.name} §7(Lv.${comp.level}) ${
              comp.isActive ? `§a[${config.activeBadgeText}中]` : ''
            }`,
            lore: [
              `§7经验进度: §d${comp.exp} §7/ §f${comp.expToNext}`,
              ...(config.showSpeedAndSkin && comp.speed
                ? [
                    `§7骑乘移速: §b+${comp.speed}%`,
                    `§7当前外观: §e${comp.appearance || '默认形态'}`,
                  ]
                : []),
              '',
              '§6【属性加成】',
              ...comp.attributes.map((a) => `§7• ${a.label}: §a${a.value}`),
              '',
              '§e▶ 左键选中查看详情与装配护具',
            ],
          }}
          payload={{ action: 'select_companion', companionId: comp.id }}
        />
      );
    }

    // 右侧选中伙伴核心详情槽 (槽位 14)
    if (slotNum === 14) {
      if (!selected) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen={mode}
            state="disabled"
            placeholderIcon={config.equipPlaceholderIcon}
            customTooltip={{
              title: config.emptyTitle,
              lore: config.emptyLore,
            }}
          />
        );
      }
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          state="selected"
          badgeText={selected.isActive ? config.activeBadgeText : `Lv.${selected.level}`}
          badgeColor={selected.isActive ? '#55ff55' : '#ffd369'}
          item={{
            id: `detail_${selected.id}`,
            name: selected.name,
            icon: selected.icon,
            rarity: selected.rarity,
            category: 'other',
            amount: selected.level,
            maxStack: 99,
            lore: [],
          }}
          customTooltip={{
            title: `${selected.name} §e(Lv.${selected.level})`,
            lore: [
              `§7成长经验: §d${selected.exp} §7/ §f${selected.expToNext}`,
              ...(config.showSpeedAndSkin
                ? [
                    `§7移动速度加成: §b+${selected.speed || 100}%`,
                    `§7当前幻化外观: §e${selected.appearance || '默认'}`,
                  ]
                : []),
              '',
              '§6【属性加成明细】',
              ...selected.attributes.map((a) => `§f• ${a.label}: §a${a.value}`),
            ],
          }}
        />
      );
    }

    // 槽位 15, 16, 17: 伙伴经验条底层占位槽 (上层由 ProgressBar 跨 3 格绘制)
    if (slotNum >= 15 && slotNum <= 17) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          state="hidden"
          customTooltip={
            selected
              ? {
                  title: `§d✨ 等级经验进度 (Lv.${selected.level})`,
                  lore: [
                    `§7当前经验: §d${selected.exp} §7/ §f${selected.expToNext}`,
                    '§7点击下方「喂养升级」消耗灵宠星魂果露提升等级。',
                  ],
                }
              : undefined
          }
        />
      );
    }

    // 伙伴专属装备槽 (槽位 23, 以及当 equipSlotCount === 3 时的 24, 25)
    if (slotNum >= 23 && slotNum <= 25) {
      const equipIdx = slotNum - 23;
      if (!selected || equipIdx >= equipSlotCount) {
        return <Slot key={slotNum} slot={slotNum} screen={mode} state="hidden" />;
      }
      const gear = selected.equipmentSlots[equipIdx] || null;
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          item={gear}
          placeholderIcon={config.equipPlaceholderIcon}
          badgeText={`装${equipIdx + 1}`}
          badgeColor="#d066ff"
          customTooltip={
            !gear
              ? {
                  title: `§d[${config.equipSlotTitle} #${equipIdx + 1}] §8(空)`,
                  lore: [
                    `§7可从下方背包拿起「${config.equipSlotTitle}」放入，`,
                    '§7或在背包中按 §aShift+左键 §7快速穿戴。',
                    '§c⚠ 非本类伙伴专属护具将被类型校验拦截！',
                  ],
                }
              : undefined
          }
          actionHints={['§e左键:穿戴/卸下伙伴护具']}
          payload={{ action: 'companion_equip_slot', equipIdx }}
        />
      );
    }

    // 坐骑专属差异项：槽位 26 外观皮肤选择 (仅在坐骑模式下显示)
    if (slotNum === 26 && config.showSpeedAndSkin && selected) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          badgeText="外观"
          badgeColor="#55ffff"
          item={{
            id: 'btn_mount_skin',
            name: `§b🎨 外观: ${selected.appearance || '默认'}`,
            icon: 'gem_star',
            rarity: 'rare',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: `§b🎨 坐骑外观选择: §e${selected.appearance}`,
            lore: [
              '§7已解锁外观列表:',
              ...(selected.unlockedSkins || []).map((s) =>
                s === selected.appearance ? `§a★ ${s} (当前)` : `§7• ${s}`
              ),
              '',
              '§e▶ 左键点击循环切换坐骑外观形态',
            ],
          }}
          payload={{ action: 'mount_cycle_skin' }}
        />
      );
    }

    // 底部分页槽位 (36, 37, 38)
    if (slotNum === 36) {
      return (
        <PagerSlot
          key={slotNum}
          type="prev"
          slot={36}
          screen={mode}
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
          screen={mode}
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
          screen={mode}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      );
    }

    // 右下角操作按钮组 (41: 出战/骑乘, 42: 喂养升级, 43: 改名, 44: 放生)
    if (slotNum === 41 && selected) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          state={selected.isActive ? 'selected' : 'normal'}
          badgeText={selected.isActive ? '收回' : config.activeBadgeText}
          badgeColor={selected.isActive ? '#ffaa00' : '#55ff55'}
          item={{
            id: 'btn_comp_active',
            name: selected.isActive
              ? config.activeButtonRecallLabel
              : config.activeButtonActivateLabel,
            icon: selected.isActive ? 'check_green' : selected.icon,
            rarity: selected.isActive ? 'legendary' : 'uncommon',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: selected.isActive
              ? config.activeButtonRecallLabel
              : config.activeButtonActivateLabel,
            lore: [
              `§7目标伙伴: ${selected.name}`,
              '§7同时仅允许 1 只伙伴处于激活状态。',
              '§a▶ 左键点击立即切换状态',
            ],
          }}
          payload={{ action: 'companion_toggle_active' }}
        />
      );
    }

    if (slotNum === 42 && selected) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          badgeText="喂养"
          badgeColor="#55ff55"
          item={{
            id: 'btn_comp_feed',
            name: '§a🧪 喂养升级 (+250 EXP)',
            icon: 'potion_exp',
            rarity: 'epic',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§a🧪 喂养伙伴提升等级',
            lore: [
              `§7当前经验: §d${selected.exp} §7/ §f${selected.expToNext}`,
              '§7优先消耗背包内 1 瓶「灵宠星魂果露」，否则消耗 500 金币。',
              '§a▶ 左键点击立即喂养 (+250 经验)',
            ],
          }}
          payload={{ action: 'companion_feed' }}
        />
      );
    }

    if (slotNum === 43 && selected) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          badgeText="改名"
          item={{
            id: 'btn_comp_rename',
            name: '§b✏ 修改伙伴昵称',
            icon: 'scroll_quest',
            rarity: 'rare',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§b✏ 自定义伙伴昵称',
            lore: [
              '§8[MC输入源: 铁砧 AnvilGUI / 模组 GuiTextField]',
              '§a▶ 左键点击打开改名输入框',
            ],
          }}
          payload={{ action: 'companion_rename' }}
        />
      );
    }

    if (slotNum === 44 && selected) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen={mode}
          badgeText="放生"
          badgeColor="#ff5555"
          item={{
            id: 'btn_comp_release',
            name: '§c✖ 放生该伙伴',
            icon: 'cross_red',
            rarity: 'mythic',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§c✖ 放生伙伴 (需二次确认)',
            lore: [
              `§7永久放生 ${selected.name}，已穿戴护具将自动退回背包。`,
              '§c▶ 左键点击打开二次确认弹窗',
            ],
          }}
          payload={{ action: 'companion_release' }}
        />
      );
    }

    return <Slot key={slotNum} slot={slotNum} screen={mode} state="hidden" />;
  };

  return (
    <GuiFrame
      screen={mode}
      title={title}
      rows={5}
      subtitleRight={
        selected
          ? `${selected.name} §7(Lv.${selected.level})`
          : '§8暂无契约伙伴'
      }
      overlayElements={
        selected ? (
          <ProgressBar
            startCol={6} // 槽位 15..17 (第 2 行 row=1, col=6..8 共 3 格)
            row={1}
            spanCols={3}
            current={selected.exp}
            max={selected.expToNext}
            label={`§fEXP §d${selected.exp}§7/${selected.expToNext}`}
            variant="exp"
          />
        ) : undefined
      }
      footerBanner={
        selected ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              <MinecraftText
                text={selected.attributes
                  .map((a) => `§7${a.label}: §a${a.value}`)
                  .join('  §8|  ')}
              />
            </span>
            {config.showSpeedAndSkin && (
              <span>
                <MinecraftText
                  text={`§b移速: +${selected.speed}% §7| 外观: §e${selected.appearance}`}
                />
              </span>
            )}
          </div>
        ) : (
          <MinecraftText text={`§7${config.emptyTitle} — ${config.emptyLore[0] || ''}`} />
        )
      }
    >
      {Array.from({ length: 45 }, (_, i) => renderSlot(i))}
    </GuiFrame>
  );
};
