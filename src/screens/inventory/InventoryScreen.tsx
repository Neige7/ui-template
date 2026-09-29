import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import { ServerState } from '../../types';

export function computeAggregatedStats(state: ServerState) {
  const totals = { ...state.player.baseStats };

  // 1. 汇总穿戴装备与扩展首饰加成
  Object.values(state.player.equipment).forEach((item) => {
    if (!item || !item.stats) return;
    totals.attack += item.stats.attack || 0;
    totals.defense += item.stats.defense || 0;
    totals.hp += item.stats.hp || 0;
    totals.critRate += item.stats.critRate || 0;
    totals.speed += item.stats.speed || 0;
  });

  // 2. 快捷栏第 1 格主手武器加成
  const mainWeapon = state.player.inventory[27];
  if (mainWeapon && mainWeapon.equipType === 'weapon' && mainWeapon.stats) {
    totals.attack += mainWeapon.stats.attack || 0;
    totals.critRate += mainWeapon.stats.critRate || 0;
  }

  // 3. 出战宠物属性与宠物护具加成
  const activePet = state.pet.pets.find((p) => p.isActive);
  if (activePet) {
    totals.attack += activePet.level * 3;
    totals.hp += activePet.level * 12;
    activePet.equipmentSlots.forEach((gear) => {
      if (gear?.stats) {
        totals.attack += gear.stats.attack || 0;
        totals.hp += gear.stats.hp || 0;
        totals.critRate += gear.stats.critRate || 0;
      }
    });
  }

  // 4. 骑乘坐骑属性与坐骑鞍具加成
  const activeMount = state.mount.mounts.find((m) => m.isActive);
  if (activeMount) {
    totals.speed += activeMount.speed || 0;
    totals.defense += activeMount.level * 2;
    activeMount.equipmentSlots.forEach((gear) => {
      if (gear?.stats) {
        totals.speed += gear.stats.speed || 0;
        totals.defense += gear.stats.defense || 0;
      }
    });
  }

  return { totals, activePet, activeMount };
}

export const InventoryScreen: React.FC = () => {
  const { state, debugMode } = useGui();
  const equip = state.player.equipment;
  const { totals, activePet, activeMount } = computeAggregatedStats(state);

  const unreadMailCount = state.mail.mails.filter(
    (m) => !m.read && !m.expired
  ).length;

  const equipSlotDefs: Record<
    number,
    {
      key: keyof typeof equip;
      label: string;
      placeholder: string;
      badge: string;
    }
  > = {
    0: { key: 'helmet', label: '头部防具槽', placeholder: 'helmet_iron', badge: '头' },
    9: { key: 'chestplate', label: '胸部防具槽', placeholder: 'chest_plate', badge: '胸' },
    18: { key: 'leggings', label: '腿部防具槽', placeholder: 'leggings', badge: '腿' },
    27: { key: 'boots', label: '脚部防具槽', placeholder: 'boots', badge: '脚' },
    36: { key: 'offhand', label: '副手盾牌槽', placeholder: 'shield', badge: '副' },
    1: { key: 'necklace', label: 'RPG扩展 · 项链槽', placeholder: 'necklace', badge: '链' },
    10: { key: 'ring1', label: 'RPG扩展 · 戒指槽 #1', placeholder: 'ring_ruby', badge: '戒1' },
    19: { key: 'ring2', label: 'RPG扩展 · 戒指槽 #2', placeholder: 'ring_sapphire', badge: '戒2' },
    28: { key: 'talisman', label: 'RPG扩展 · 护符槽', placeholder: 'talisman', badge: '符' },
  };

  const hubButtons: Record<
    number,
    {
      target: 'quest' | 'pet' | 'mount' | 'guild' | 'mail' | 'warehouse';
      title: string;
      icon: string;
      rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
      badge?: string;
      badgeColor?: string;
      lore: string[];
    }
  > = {
    6: {
      target: 'quest',
      title: '§a📜 冒险委托日志',
      icon: 'scroll_quest',
      rarity: 'rare',
      badge: '任务',
      lore: [
        `§7进行中/可领奖委托: §e${state.quest.quests.filter((q) => q.status === 'in_progress' || q.status === 'claimable').length} 个`,
        '§a▶ 左键打开任务视图',
      ],
    },
    7: {
      target: 'pet',
      title: '§d🐾 灵宠契约法阵',
      icon: 'pet_dragon',
      rarity: 'epic',
      badge: '宠物',
      lore: [
        `§7当前出战: ${activePet ? activePet.name : '§8未出战'}`,
        '§a▶ 左键打开宠物培养与护具界面',
      ],
    },
    8: {
      target: 'mount',
      title: '§b🦅 皇家坐骑兽栏',
      icon: 'mount_griffin',
      rarity: 'legendary',
      badge: '坐骑',
      lore: [
        `§7当前骑乘: ${activeMount ? activeMount.name : '§8未骑乘'}`,
        '§a▶ 左键打开坐骑界面',
      ],
    },
    15: {
      target: 'guild',
      title: '§6🏰 荣耀公会圣殿',
      icon: 'banner_guild',
      rarity: 'legendary',
      badge: '公会',
      lore: [
        state.guild.joined && state.guild.guildData
          ? `§7所属公会: §e${state.guild.guildData.name} §7(职位: ${state.guild.playerRole})`
          : '§7当前尚未加入任何公会',
        '§a▶ 左键打开公会管理/仓库界面',
      ],
    },
    16: {
      target: 'mail',
      title: '§e✉ 信使猫头鹰驿站',
      icon: unreadMailCount > 0 ? 'mail_unread' : 'mail_read',
      rarity: unreadMailCount > 0 ? 'mythic' : 'rare',
      badge: unreadMailCount > 0 ? `●${unreadMailCount}` : '邮箱',
      badgeColor: unreadMailCount > 0 ? '#ff5555' : '#ffd369',
      lore: [
        unreadMailCount > 0
          ? `§c● 您有 ${unreadMailCount} 封未读邮件等待查收！`
          : '§7暂无未读新邮件',
        '§7支持系统邮件、玩家寄信与 CDK 礼包兑换。',
        '§a▶ 左键打开邮箱界面',
      ],
    },
    17: {
      target: 'warehouse',
      title: '§9📦 星辰私人仓库',
      icon: 'warehouse',
      rarity: 'epic',
      badge: '仓库',
      lore: [
        `§7已存物品总数: §e${state.warehouse.totalAmount} §7/ §6${state.warehouse.maxTotalAmount}`,
        `§7已解锁槽位: §a${state.warehouse.unlockedCount} §7/ §f${state.warehouse.maxSlots} 格`,
        '§a▶ 左键打开私人仓库',
      ],
    },
  };

  const renderSlot = (slotNum: number) => {
    // 1. 装备槽与 RPG 扩展槽
    const eqDef = equipSlotDefs[slotNum];
    if (eqDef) {
      const worn = equip[eqDef.key];
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="inventory"
          item={worn}
          placeholderIcon={eqDef.placeholder}
          badgeText={eqDef.badge}
          badgeColor="#9ba3c4"
          customTooltip={
            !worn
              ? {
                  title: `§e[${eqDef.label}] §8(空)`,
                  lore: [
                    '§7从下方背包拿起对应部位的装备左键放入，',
                    '§7或在背包中按 §aShift+左键 §7快速穿戴。',
                    '§c⚠ 错误部位的物品将被类型校验自动拦截。',
                  ],
                }
              : undefined
          }
          actionHints={[
            '§e左键:穿戴/替换 §7| §aShift+左键:快速卸下至背包',
          ]}
          payload={{ equipSlot: eqDef.key }}
        />
      );
    }

    // 2. Hub 快捷入口槽位
    const hub = hubButtons[slotNum];
    if (hub) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="inventory"
          badgeText={hub.badge}
          badgeColor={hub.badgeColor}
          item={{
            id: `hub_${hub.target}`,
            name: hub.title,
            icon: hub.icon,
            rarity: hub.rarity,
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: hub.title,
            lore: hub.lore,
          }}
          payload={{ action: `nav_screen:${hub.target}` }}
        />
      );
    }

    // 3. 槽位 5: 属性汇总详情悬浮槽
    if (slotNum === 5) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="inventory"
          badgeText="属性"
          item={{
            id: 'stat_summary',
            name: '§6⚔ 角色综合属性面板',
            icon: 'sword_legend',
            rarity: 'legendary',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: `§6⚔ ${state.player.name} · 属性汇总 (Lv.${state.player.level})`,
            lore: [
              `§7综合战力评估: §e${(totals.attack * 12 + totals.defense * 9 + totals.hp * 2).toLocaleString()}`,
              '',
              `§c✦ 物理/魔法攻击: §f${totals.attack} §8(基础 ${state.player.baseStats.attack})`,
              `§a✦ 护甲防御力: §f${totals.defense} §8(基础 ${state.player.baseStats.defense})`,
              `§d✦ 最大生命值: §f${totals.hp} §8(基础 ${state.player.baseStats.hp})`,
              `§6✦ 暴击几率: §f${totals.critRate}% §8(基础 ${state.player.baseStats.critRate}%)`,
              `§b✦ 移动速度加成: §f${totals.speed}%`,
              '',
              `§7出战灵宠加成: ${activePet ? activePet.name : '§8无'}`,
              `§7骑乘坐骑加成: ${activeMount ? activeMount.name : '§8无'}`,
            ],
          }}
        />
      );
    }

    // 4. 槽位 14: 出战灵宠槽位快速预览
    if (slotNum === 14) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="inventory"
          badgeText="灵宠"
          item={
            activePet
              ? {
                  id: activePet.id,
                  name: activePet.name,
                  icon: activePet.icon,
                  rarity: activePet.rarity,
                  category: 'other',
                  amount: activePet.level,
                  maxStack: 99,
                  lore: [],
                }
              : null
          }
          placeholderIcon="pet_dragon"
          customTooltip={{
            title: activePet
              ? `§d🐾 出战灵宠: ${activePet.name} (Lv.${activePet.level})`
              : '§8🐾 当前无出战灵宠',
            lore: activePet
              ? [
                  ...activePet.attributes.map((a) => `§7${a.label}: §a${a.value}`),
                  '',
                  '§e▶ 左键前往宠物界面调整',
                ]
              : ['§7前往宠物界面选择一只灵宠设为出战', '§e▶ 左键打开宠物界面'],
          }}
          payload={{ action: 'nav_screen:pet' }}
        />
      );
    }

    // 5. 槽位 23: 骑乘坐骑快速预览
    if (slotNum === 23) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="inventory"
          badgeText="坐骑"
          item={
            activeMount
              ? {
                  id: activeMount.id,
                  name: activeMount.name,
                  icon: activeMount.icon,
                  rarity: activeMount.rarity,
                  category: 'other',
                  amount: activeMount.level,
                  maxStack: 99,
                  lore: [],
                }
              : null
          }
          placeholderIcon="mount_griffin"
          customTooltip={{
            title: activeMount
              ? `§b🦅 当前坐骑: ${activeMount.name} (+${activeMount.speed}%移速)`
              : '§8🦅 当前未骑乘坐骑',
            lore: activeMount
              ? [
                  `§7外观形态: §e${activeMount.appearance}`,
                  ...activeMount.attributes.map((a) => `§7${a.label}: §b${a.value}`),
                  '',
                  '§e▶ 左键前往坐骑界面调整',
                ]
              : ['§7前往坐骑界面选择坐骑骑乘', '§e▶ 左键打开坐骑界面'],
          }}
          payload={{ action: 'nav_screen:mount' }}
        />
      );
    }

    // 6. 槽位 44: 货币详情槽
    if (slotNum === 44) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="inventory"
          badgeText="金库"
          item={{
            id: 'currency_purse',
            name: '§6🪙 皇家次元钱袋',
            icon: 'coin_gold',
            rarity: 'legendary',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§6🪙 角色货币资产详情',
            lore: [
              `§7王国金币 (Gold): §6${state.player.gold.toLocaleString()}`,
              `§7星辰晶石 (Gems): §b${state.player.gems.toLocaleString()}`,
              '§8(可在工作台测试面板随时调整货币数量)',
            ],
          }}
        />
      );
    }

    return <Slot key={slotNum} slot={slotNum} screen="inventory" state="hidden" />;
  };

  return (
    <GuiFrame
      screen="inventory"
      title={zh_CN.screens.inventory}
      rows={5}
      subtitleRight={`§eLv.${state.player.level} §6战力 ${(totals.attack * 12 + totals.defense * 9 + totals.hp * 2).toLocaleString()}`}
      overlayElements={
        <>
          {/* 角色预览框（跨第 0~3 行、第 2~4 列，标注为 background + entity 渲染层） */}
          <div
            className="mc-spanning-bar"
            style={{
              left: 'calc(2 * var(--slot-size))',
              top: 'calc(0 * var(--slot-size))',
              width: 'calc(3 * var(--slot-size))',
              height: 'calc(4 * var(--slot-size))',
              padding: 'calc(2px * var(--gui-scale))',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(180deg, #121521 0%, #1d2236 100%)',
                border: 'var(--px) solid #4f577a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'calc(2px * var(--gui-scale))',
              }}
            >
              <span
                style={{
                  fontSize: 'calc(3.8px * var(--gui-scale))',
                  color: '#ffd369',
                }}
              >
                {state.player.name}
              </span>
              {/* 像素小人立绘 SVG 占位 */}
              <svg
                viewBox="0 0 16 24"
                style={{
                  width: 'calc(22px * var(--gui-scale))',
                  height: 'calc(32px * var(--gui-scale))',
                }}
                shapeRendering="crispEdges"
              >
                {/* 头盔与脸 */}
                <rect x="4" y="1" width="8" height="2" fill="#f5b942" />
                <rect x="4" y="3" width="8" height="6" fill="#f2c8a0" />
                <rect x="5" y="5" width="2" height="2" fill="#2c4a7c" />
                <rect x="9" y="5" width="2" height="2" fill="#2c4a7c" />
                {/* 胸甲与披风 */}
                <rect x="2" y="9" width="12" height="7" fill="#7a2899" />
                <rect x="4" y="9" width="8" height="7" fill="#9eb0cf" />
                <rect x="6" y="10" width="4" height="3" fill="#ffd369" />
                {/* 手持圣剑 */}
                <rect x="13" y="4" width="2" height="9" fill="#ff5555" />
                <rect x="12" y="11" width="4" height="1" fill="#ffd369" />
                {/* 护腿与战靴 */}
                <rect x="4" y="16" width="3" height="5" fill="#5b6882" />
                <rect x="9" y="16" width="3" height="5" fill="#5b6882" />
                <rect x="4" y="21" width="3" height="2" fill="#d4a64a" />
                <rect x="9" y="21" width="3" height="2" fill="#d4a64a" />
              </svg>
              <span
                style={{
                  fontSize: 'calc(3.6px * var(--gui-scale))',
                  color: '#9aa2c2',
                }}
              >
                [EntityRender]
              </span>
            </div>
          </div>

          {/* 底部综合属性条（跨第 4 行 槽位 37~43） */}
          <div
            className="mc-spanning-bar"
            style={{
              left: 'calc(1 * var(--slot-size))',
              top: 'calc(4 * var(--slot-size))',
              width: 'calc(7 * var(--slot-size))',
              height: 'var(--slot-size)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: 'calc(14px * var(--gui-scale))',
                background: 'rgba(14, 16, 26, 0.92)',
                border: 'var(--px) solid #424969',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                fontSize: 'calc(4px * var(--gui-scale))',
                padding: '0 4px',
              }}
            >
              <MinecraftText text={`§c攻:${totals.attack}`} />
              <MinecraftText text={`§a防:${totals.defense}`} />
              <MinecraftText text={`§d血:${totals.hp}`} />
              <MinecraftText text={`§6暴:${totals.critRate}%`} />
              <MinecraftText text={`§b速:${totals.speed}%`} />
            </div>
            {debugMode && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: 2,
                  fontSize: '9px',
                  color: '#ffd369',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                [dynamic_text]
              </span>
            )}
          </div>
        </>
      }
    >
      {Array.from({ length: 45 }, (_, i) => renderSlot(i))}
    </GuiFrame>
  );
};
