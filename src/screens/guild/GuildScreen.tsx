import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { PagerSlot } from '../../core/Pager';
import { ProgressBar } from '../../core/ProgressBar';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import { calculateWarehouseTotalAmount } from '../../mock/scenarios';
import { GuildRole, GuildTab } from '../../types';
import { ReusableWarehouseGrid } from '../warehouse/WarehouseScreen';
import {
  GUILD_LEVEL_RULES,
  GUILD_PERMISSION_MATRIX,
  hasGuildPermission,
} from './permissionMatrix';

const GUILD_TABS: {
  key: GuildTab;
  slot: number;
  label: string;
  icon: string;
}[] = [
  { key: 'overview', slot: 0, label: '公会概览', icon: 'banner_guild' },
  { key: 'members', slot: 1, label: '成员管理', icon: 'helmet_gold' },
  { key: 'applications', slot: 2, label: '申请审批', icon: 'scroll_quest' },
  { key: 'donate', slot: 3, label: '捐献贡献', icon: 'coin_gold' },
  { key: 'warehouse', slot: 4, label: '公会仓库', icon: 'chest_guild' },
  { key: 'logs', slot: 5, label: '公会日志', icon: 'book' },
  { key: 'settings', slot: 6, label: '公会设置', icon: 'sort' },
];

const ROLE_ORDER: GuildRole[] = ['leader', 'vice_leader', 'elite', 'member'];

export const GuildScreen: React.FC = () => {
  const { state, dispatchAction } = useGui();
  const gState = state.guild;
  const guild = gState.guildData;
  const role = gState.playerRole;

  const nextRole = ROLE_ORDER[(ROLE_ORDER.indexOf(role) + 1) % ROLE_ORDER.length];

  // Top Row (Slots 0~8) for Joined Guild
  const renderJoinedTopRow = () => (
    <>
      {GUILD_TABS.map((t) => {
        const isSelected = gState.activeTab === t.key;
        const appCount =
          t.key === 'applications' && guild ? guild.applications.length : 0;
        return (
          <Slot
            key={t.slot}
            slot={t.slot}
            screen="guild"
            state={isSelected ? 'selected' : 'normal'}
            badgeText={
              appCount > 0
                ? `●${appCount}`
                : isSelected
                ? '★'
                : undefined
            }
            badgeColor={appCount > 0 ? '#ff5555' : '#ffd369'}
            item={{
              id: `gtab_${t.key}`,
              name: isSelected ? `§6§l${t.label}` : `§7${t.label}`,
              icon: t.icon,
              rarity: isSelected ? 'legendary' : 'common',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: isSelected
                ? `§6★ ${t.label} (当前子页面)`
                : `§f切换至「${t.label}」`,
              lore: ['§a▶ 左键点击切换公会子页面'],
            }}
            payload={{ action: `guild_tab:${t.key}` }}
          />
        );
      })}

      {/* 槽位 7: 切换当前模拟职位（方便验收权限矩阵） */}
      <Slot
        slot={7}
        screen="guild"
        badgeText={zh_CN.guildRoles[role]}
        badgeColor="#55ffff"
        item={{
          id: 'btn_sim_role',
          name: `§b当前职位: ${zh_CN.guildRoles[role]}`,
          icon: 'helmet_gold',
          rarity: 'epic',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: `§b🛡 职位权限模拟器: 当前为「${zh_CN.guildRoles[role]}」`,
          lore: [
            '§7用于验证不同职位下 UI 操作按钮的显隐与权限拦截：',
            '§7会长 -> 副会长 -> 精英 -> 普通成员',
            '§e▶ 左键点击切换下一个职位，右键切换「无公会」模式',
          ],
        }}
        payload={{
          action: `guild_sim_role:${nextRole}`,
        }}
      />

      {/* 槽位 8: 返回角色行囊 Hub */}
      <Slot
        slot={8}
        screen="guild"
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
          lore: ['§7返回角色主背包'],
        }}
        payload={{ action: 'nav_screen:inventory' }}
      />
    </>
  );

  // ==================== 子页面 5: 公会仓库（直接复用 ReusableWarehouseGrid） ====================
  if (gState.joined && gState.activeTab === 'warehouse' && guild) {
    const wh = guild.warehouse;
    const stackTotal = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
    const canUnlockGuildWh = hasGuildPermission(role, 'warehouse_unlock');
    const canWithdrawGuildWh = hasGuildPermission(role, 'warehouse_withdraw');

    return (
      <div>
        <GuiFrame
          screen="guild"
          title={`§8[§6公会仓库 · ${guild.name}§8]`}
          rows={5}
          subtitleRight={`§7职位: §b${zh_CN.guildRoles[role]} §7(${
            canWithdrawGuildWh ? '§a可存取' : '§e仅限存入'
          }§7)`}
          overlayElements={
            <ProgressBar
              startCol={2}
              row={4}
              spanCols={5}
              current={stackTotal}
              max={wh.maxTotalAmount}
              label={`§f公会仓库容量: §e${stackTotal}§7/${wh.maxTotalAmount}`}
              variant="guild"
            />
          }
          footerBanner={
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <MinecraftText
                  text={`§6[复用仓库组件] §7公会资金: §e${guild.funds.toLocaleString()} G §7| 取出权限: ${
                    canWithdrawGuildWh ? '§a✔允许' : '§c✖普通成员禁止取出'
                  }`}
                />
              </span>
              <span>
                <MinecraftText
                  text={`§7扩充权限: ${
                    canUnlockGuildWh ? '§a✔会长/副会长' : '§8无权扩充'
                  }`}
                />
              </span>
            </div>
          }
        >
          <ReusableWarehouseGrid
            screen="guild"
            warehouse={wh}
            currentPage={gState.warehousePage}
            selectedCategory={gState.warehouseCategory}
            searchQuery=""
            canUnlock={canUnlockGuildWh}
            unlockCostLabel={`${wh.unlockCostGold} 公会资金`}
            topRowOverride={renderJoinedTopRow()}
          />
        </GuiFrame>
        <GuildPermissionMatrixPanel currentRole={role} />
      </div>
    );
  }

  // ==================== 未加入公会状态 ====================
  if (!gState.joined) {
    const q = gState.searchQuery.trim().toLowerCase();
    const filteredGuilds = gState.guildList.filter(
      (g) =>
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.tag.toLowerCase().includes(q)
    );

    const renderNoGuildSlot = (slotNum: number) => {
      if (slotNum === 0) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state="selected"
            badgeText="招募"
            item={{
              id: 'ng_list',
              name: '§6🏰 服务器公会招募榜',
              icon: 'banner_guild',
              rarity: 'legendary',
              category: 'other',
              amount: filteredGuilds.length,
              maxStack: 99,
              lore: [],
            }}
            customTooltip={{
              title: '§6🏰 服务器公会列表 (未加入公会状态)',
              lore: ['§7浏览服务器内的公会并申请加入，或创立属于自己的公会。'],
            }}
          />
        );
      }

      if (slotNum === 2) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="搜索"
            item={{
              id: 'ng_search',
              name: gState.searchQuery
                ? `§b搜索中: ${gState.searchQuery}`
                : '§b🔍 搜索公会名称/标签',
              icon: 'search',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§b🔍 搜索公会 (AnvilGUI)',
              lore: [
                `§7当前关键词: §e${gState.searchQuery || '(全部)'}`,
                '§a▶ 左键点击打开铁砧搜索框',
              ],
            }}
            payload={{ action: 'guild_search_list' }}
          />
        );
      }

      if (slotNum === 4) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="创建"
            badgeColor="#55ff55"
            item={{
              id: 'ng_create',
              name: '§a§l✨ 创建新公会 (花费 20,000G)',
              icon: 'unlock_plus',
              rarity: 'mythic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§a§l✨ 创立新公会',
              lore: [
                '§7建会费用: §620,000 金币',
                '§7校验规则: 名称长度 2~12 字，且不可与现有公会重名。',
                '§8[MC输入源: 铁砧 AnvilGUI]',
                '§a▶ 左键点击输入公会名称并创建',
              ],
            }}
            payload={{ action: 'guild_create_new' }}
          />
        );
      }

      if (slotNum === 7) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="演示切换"
            item={{
              id: 'ng_switch_joined',
              name: '§d🔄 切换至「已加入公会」视图',
              icon: 'banner_guild',
              rarity: 'epic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§d🔄 快速切换至「已加入公会」演示状态',
              lore: ['§a▶ 左键点击立即进入已加入公会管理界面'],
            }}
            payload={{ action: 'guild_toggle_joined_mode' }}
          />
        );
      }

      if (slotNum === 8) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
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
              title: '§e⬅ 返回角色行囊',
              lore: ['§7返回角色背包'],
            }}
            payload={{ action: 'nav_screen:inventory' }}
          />
        );
      }

      // 槽位 18, 20, 22: 公会列表项
      const gIdxMap: Record<number, number> = { 18: 0, 20: 1, 22: 2 };
      if (slotNum in gIdxMap) {
        const gItem = filteredGuilds[gIdxMap[slotNum]];
        if (!gItem) {
          return <Slot key={slotNum} slot={slotNum} screen="guild" state="normal" />;
        }
        const modeText =
          gItem.joinMode === 'free'
            ? '§a自由加入'
            : gItem.joinMode === 'approval'
            ? '§e需审批'
            : '§c暂停招募';
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state={gItem.applied ? 'selected' : 'normal'}
            badgeText={gItem.applied ? '已申请' : `[${gItem.tag}]`}
            badgeColor={gItem.applied ? '#55ff55' : '#ffd369'}
            item={{
              id: gItem.id,
              name: `§6[${gItem.tag}] ${gItem.name} §7(Lv.${gItem.level})`,
              icon: 'banner_guild',
              rarity: 'legendary',
              category: 'other',
              amount: gItem.level,
              maxStack: 99,
              lore: [],
            }}
            customTooltip={{
              title: `§6🏰 [${gItem.tag}] ${gItem.name} (Lv.${gItem.level})`,
              lore: [
                `§7现任会长: §b${gItem.leaderName}`,
                `§7成员规模: §f${gItem.memberCount} §7/ §a${gItem.maxMembers} 人`,
                `§7加入方式: ${modeText} §7| 最低等级: §eLv.${gItem.minLevel}`,
                `§7公告: §f${gItem.notice}`,
                '',
                gItem.applied
                  ? '§a✔ 您已提交入会申请，请等待会长审批'
                  : '§a▶ 左键点击申请加入该公会',
              ],
            }}
            payload={{ action: 'guild_apply', guildId: gItem.id }}
          />
        );
      }

      return <Slot key={slotNum} slot={slotNum} screen="guild" state="hidden" />;
    };

    return (
      <div>
        <GuiFrame
          screen="guild"
          title="§8[§6荣耀公会圣殿 · 未入会§8]"
          rows={5}
          subtitleRight="§e点击槽位 4 创建公会，或点击槽位 18/20/22 申请入会"
        >
          {Array.from({ length: 45 }, (_, i) => renderNoGuildSlot(i))}
        </GuiFrame>
        <GuildPermissionMatrixPanel currentRole={role} />
      </div>
    );
  }

  // ==================== 已加入公会：其余 6 个子页面 ====================
  if (!guild) return null;

  const selectedMember =
    guild.members.find((m) => m.uuid === gState.selectedMemberUuid) ||
    guild.members[0] ||
    null;

  const renderJoinedSlot = (slotNum: number) => {
    // 第 1 行 (0..8)
    if (slotNum <= 8) return null; // 由 renderJoinedTopRow 渲染

    // -------- 子页面 1: 公会概览 (overview) --------
    if (gState.activeTab === 'overview') {
      if (slotNum === 19) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state="selected"
            badgeText={`[${guild.tag}]`}
            item={{
              id: 'g_overview_info',
              name: `§6🏰 [${guild.tag}] ${guild.name} (Lv.${guild.level})`,
              icon: 'banner_guild',
              rarity: 'legendary',
              category: 'other',
              amount: guild.level,
              maxStack: 99,
              lore: [],
            }}
            customTooltip={{
              title: `§6🏰 [${guild.tag}] ${guild.name} · 等级 Lv.${guild.level}`,
              lore: [
                `§7公会经验: §e${guild.exp} §7/ §f${guild.expToNext}`,
                `§7金库资金: §6${guild.funds.toLocaleString()} 金币`,
                `§7成员数量: §a${guild.members.length} §7/ §f${guild.maxMembers} 人`,
                `§7加入方式: §b${guild.joinMode} §7(门槛 Lv.${guild.minLevel})`,
                '',
                '§6【既定等级与职位配额规则】',
                ...GUILD_LEVEL_RULES.map(
                  (r) =>
                    `§7Lv.${r.level}: 上限 ${r.maxMembers}人 (副会长×${r.maxViceLeaders}, 精英×${r.maxElites})`
                ),
              ],
            }}
          />
        );
      }

      if (slotNum === 21) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="公告"
            item={{
              id: 'g_overview_notice',
              name: '§e📢 公会圣殿公告板',
              icon: 'scroll_quest',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§e📢 当前公会公告',
              lore: [
                guild.notice,
                '',
                hasGuildPermission(role, 'edit_settings')
                  ? '§a▶ 左键点击修改公告 (SignGUI)'
                  : '§8(仅会长/副会长可修改公告)',
              ],
            }}
            payload={{ action: 'guild_edit_notice' }}
          />
        );
      }

      if (slotNum === 44) {
        const isLeader = role === 'leader';
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText={isLeader ? '解散' : '退出'}
            badgeColor="#ff5555"
            item={{
              id: 'btn_leave_disband',
              name: isLeader ? '§c✖ 解散当前公会' : '§e🚪 主动退出公会',
              icon: 'cross_red',
              rarity: 'mythic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: isLeader
                ? '§c✖ 永久解散公会 (仅限会长 · 需二次确认)'
                : '§e🚪 主动退出公会 (需二次确认)',
              lore: ['§c▶ 左键点击弹出二次确认窗口'],
            }}
            payload={{ action: 'guild_leave_or_disband' }}
          />
        );
      }
    }

    // -------- 子页面 2: 成员列表与按权限显隐的人事操作 (members) --------
    if (gState.activeTab === 'members') {
      const mIdx = slotNum - 9;
      if (mIdx >= 0 && mIdx < guild.members.length && slotNum <= 17) {
        const m = guild.members[mIdx];
        const isSelected = selectedMember?.uuid === m.uuid;
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state={isSelected ? 'selected' : 'normal'}
            badgeText={zh_CN.guildRoles[m.role]}
            badgeColor={m.online ? '#55ff55' : '#888888'}
            item={{
              id: m.uuid,
              name: `${m.online ? '§a●' : '§8○'} §f${m.name} §7(${zh_CN.guildRoles[m.role]})`,
              icon: m.role === 'leader' ? 'helmet_gold' : 'helmet_iron',
              rarity:
                m.role === 'leader'
                  ? 'legendary'
                  : m.role === 'vice_leader'
                  ? 'epic'
                  : 'rare',
              category: 'other',
              amount: m.level,
              maxStack: 99,
              lore: [],
            }}
            customTooltip={{
              title: `§b${m.name} §7[Lv.${m.level} · ${zh_CN.guildRoles[m.role]}]`,
              lore: [
                `§7在线状态: ${m.online ? '§a当前在线' : `§8离线 (${m.lastOnline})`}`,
                `§7累计贡献度: §6${m.contribution.toLocaleString()}`,
                '',
                '§e▶ 左键选中该成员以执行下方人事管理操作',
              ],
            }}
            payload={{ action: 'guild_select_member', uuid: m.uuid }}
          />
        );
      }

      // 按权限矩阵显隐人事操作按钮 (槽位 40: 升职, 41: 降职, 42: 踢出, 43: 转让会长)
      if (slotNum === 40) {
        if (!hasGuildPermission(role, 'promote_member')) {
          return <Slot key={slotNum} slot={slotNum} screen="guild" state="hidden" />;
        }
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="升职"
            badgeColor="#55ff55"
            item={{
              id: 'btn_promote',
              name: '§a⬆ 升职选中成员 (需确认)',
              icon: 'unlock_plus',
              rarity: 'uncommon',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§a⬆ 升职成员: ${selectedMember?.name || ''}`,
              lore: [
                '§7权限矩阵要求: 会长 / 副会长',
                '§a▶ 左键点击弹出二次确认窗口',
              ],
            }}
            payload={{ action: 'guild_member_promote' }}
          />
        );
      }

      if (slotNum === 41) {
        if (!hasGuildPermission(role, 'demote_member')) {
          return <Slot key={slotNum} slot={slotNum} screen="guild" state="hidden" />;
        }
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="降职"
            badgeColor="#ffaa00"
            item={{
              id: 'btn_demote',
              name: '§e⬇ 降职选中成员 (需确认)',
              icon: 'arrow_left',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§e⬇ 降职成员: ${selectedMember?.name || ''}`,
              lore: [
                '§7权限矩阵要求: 仅限会长',
                '§e▶ 左键点击弹出二次确认窗口',
              ],
            }}
            payload={{ action: 'guild_member_demote' }}
          />
        );
      }

      if (slotNum === 42) {
        if (!hasGuildPermission(role, 'kick_member')) {
          return <Slot key={slotNum} slot={slotNum} screen="guild" state="hidden" />;
        }
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="踢出"
            badgeColor="#ff5555"
            item={{
              id: 'btn_kick',
              name: '§c✖ 踢出选中成员 (需确认)',
              icon: 'cross_red',
              rarity: 'mythic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§c✖ 踢出成员: ${selectedMember?.name || ''}`,
              lore: [
                '§7权限矩阵要求: 会长 / 副会长',
                '§c▶ 左键点击弹出二次确认窗口',
              ],
            }}
            payload={{ action: 'guild_member_kick' }}
          />
        );
      }

      if (slotNum === 43) {
        if (!hasGuildPermission(role, 'transfer_leader')) {
          return <Slot key={slotNum} slot={slotNum} screen="guild" state="hidden" />;
        }
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="让位"
            badgeColor="#ffd369"
            item={{
              id: 'btn_transfer',
              name: '§6👑 转让会长职位 (需确认)',
              icon: 'helmet_gold',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§6👑 将会长转让给: ${selectedMember?.name || ''}`,
              lore: [
                '§7权限矩阵要求: 仅限会长',
                '§e▶ 左键点击弹出二次确认窗口',
              ],
            }}
            payload={{ action: 'guild_member_transfer' }}
          />
        );
      }
    }

    // -------- 子页面 3: 申请审批 (applications) --------
    if (gState.activeTab === 'applications') {
      const canApprove = hasGuildPermission(role, 'approve_application');
      const app = guild.applications[slotNum - 9];
      if (slotNum >= 9 && slotNum <= 14 && app) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText={`Lv.${app.level}`}
            item={{
              id: app.uuid,
              name: `§b申请人: ${app.name}`,
              icon: 'scroll_quest',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§b📩 入会申请: ${app.name} (Lv.${app.level})`,
              lore: [
                `§7战斗力: §6${app.combatPower} §7| 申请时间: ${app.appliedAt}`,
                `§7留言: §f"${app.message}"`,
                '',
                canApprove
                  ? '§a▶ 左键点击同意入会 | §c▶ 右键点击拒绝申请'
                  : '§c✖ 您当前的职位无审批权限',
              ],
            }}
            payload={{
              action: 'guild_app_approve',
              uuid: app.uuid,
            }}
          />
        );
      }

      if (slotNum === 43 && canApprove && guild.applications.length > 0) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="全拒"
            badgeColor="#ff5555"
            item={{
              id: 'btn_app_reject_all',
              name: '§c🧹 全部拒绝待审批申请',
              icon: 'cross_red',
              rarity: 'mythic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§c🧹 一键全部拒绝',
              lore: ['§7清空当前所有待处理的入会申请。'],
            }}
            payload={{ action: 'guild_app_reject_all' }}
          />
        );
      }
    }

    // -------- 子页面 4: 捐献与贡献 (donate) --------
    if (gState.activeTab === 'donate') {
      if (slotNum === 20) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="+50贡献"
            badgeColor="#ffd369"
            item={{
              id: 'donate_gold',
              name: '§6🪙 金币捐献 (5,000 金币)',
              icon: 'coin_gold',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§6🪙 向公会金库捐献 5,000 金币',
              lore: [
                '§7获得个人贡献: §a+50 点',
                '§7增加公会资金: §6+5,000 §7| 公会经验: §b+500',
                '§a▶ 左键点击立即捐献',
              ],
            }}
            payload={{ action: 'guild_donate_gold' }}
          />
        );
      }

      if (slotNum === 24) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText="+30贡献"
            badgeColor="#55ffff"
            item={{
              id: 'donate_token',
              name: '§d🏅 物资捐献 (荣耀公会徽记 ×1)',
              icon: 'gem_star',
              rarity: 'epic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§d🏅 捐献背包内的「荣耀公会徽记 ×1」',
              lore: [
                '§7获得个人贡献: §a+30 点',
                '§7增加公会资金: §6+2,000 §7| 公会经验: §b+300',
                '§a▶ 左键点击立即捐献',
              ],
            }}
            payload={{ action: 'guild_donate_item' }}
          />
        );
      }
    }

    // -------- 子页面 6: 公会日志 (logs) --------
    if (gState.activeTab === 'logs') {
      const logItem = guild.logs[slotNum - 9];
      if (slotNum >= 9 && slotNum <= 26 && logItem) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText={logItem.time}
            item={{
              id: logItem.id,
              name: logItem.text,
              icon: 'book',
              rarity: 'uncommon',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§e📜 公会事件记录 (${logItem.time})`,
              lore: [logItem.text],
            }}
          />
        );
      }
    }

    // -------- 子页面 7: 公会设置 (settings) --------
    if (gState.activeTab === 'settings') {
      const canEdit = hasGuildPermission(role, 'edit_settings');
      if (slotNum === 19) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state={canEdit ? 'normal' : 'disabled'}
            badgeText="公告"
            item={{
              id: 'set_notice',
              name: '§e📢 修改公会公告',
              icon: 'scroll_quest',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§e📢 编辑公会公告 (SignGUI)',
              lore: [
                `§7当前公告: ${guild.notice}`,
                canEdit ? '§a▶ 左键点击修改' : '§c✖ 当前职位无修改权限',
              ],
            }}
            payload={{ action: 'guild_edit_notice' }}
          />
        );
      }

      if (slotNum === 21) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state={canEdit ? 'normal' : 'disabled'}
            badgeText={guild.joinMode}
            item={{
              id: 'set_join_mode',
              name: `§b🔑 加入方式: ${guild.joinMode}`,
              icon: 'unlock_plus',
              rarity: 'epic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§b🔑 切换入会方式 (当前: ${guild.joinMode})`,
              lore: [
                '§7可选: 自由加入 (free) / 需审批 (approval) / 关闭招募 (closed)',
                canEdit ? '§a▶ 左键点击循环切换' : '§c✖ 当前职位无修改权限',
              ],
            }}
            payload={{ action: 'guild_cycle_join_mode' }}
          />
        );
      }

      if (slotNum === 23) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            state={canEdit ? 'normal' : 'disabled'}
            badgeText={`Lv.${guild.minLevel}`}
            item={{
              id: 'set_min_lvl',
              name: `§6📈 最低等级门槛: Lv.${guild.minLevel}`,
              icon: 'sword_iron',
              rarity: 'legendary',
              category: 'other',
              amount: guild.minLevel,
              maxStack: 99,
              lore: [],
            }}
            customTooltip={{
              title: `§6📈 调整入会最低等级门槛 (当前 Lv.${guild.minLevel})`,
              lore: [
                canEdit ? '§a▶ 左键点击调整等级门槛' : '§c✖ 当前职位无修改权限',
              ],
            }}
            payload={{ action: 'guild_cycle_min_level' }}
          />
        );
      }

      if (slotNum === 44) {
        const isLeader = role === 'leader';
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="guild"
            badgeText={isLeader ? '解散' : '退出'}
            badgeColor="#ff5555"
            item={{
              id: 'set_leave_disband',
              name: isLeader ? '§c✖ 永久解散公会' : '§e🚪 主动退出公会',
              icon: 'cross_red',
              rarity: 'mythic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: isLeader
                ? '§c✖ 永久解散公会 (需二次确认)'
                : '§e🚪 主动退出公会 (需二次确认)',
              lore: ['§c▶ 左键点击弹出二次确认窗口'],
            }}
            payload={{ action: 'guild_leave_or_disband' }}
          />
        );
      }
    }

    // 底部分页
    if (slotNum === 36) {
      return (
        <PagerSlot
          key={slotNum}
          type="prev"
          slot={36}
          screen="guild"
          currentPage={1}
          totalPages={1}
        />
      );
    }
    if (slotNum === 37) {
      return (
        <PagerSlot
          key={slotNum}
          type="indicator"
          slot={37}
          screen="guild"
          currentPage={1}
          totalPages={1}
        />
      );
    }

    return <Slot key={slotNum} slot={slotNum} screen="guild" state="hidden" />;
  };

  return (
    <div>
      <GuiFrame
        screen="guild"
        title={zh_CN.screens.guild}
        rows={5}
        subtitleRight={`§6[${guild.tag}] ${guild.name} §7| 职位: §b${zh_CN.guildRoles[role]}`}
        overlayElements={
          gState.activeTab === 'overview' ? (
            <ProgressBar
              startCol={2}
              row={4}
              spanCols={5}
              current={guild.exp}
              max={guild.expToNext}
              label={`§fLv.${guild.level} EXP §e${guild.exp}§7/${guild.expToNext}`}
              variant="guild"
            />
          ) : undefined
        }
        footerBanner={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              <MinecraftText text={guild.notice} />
            </span>
            <span
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() =>
                dispatchAction({
                  screen: 'guild',
                  slot: 7,
                  click: 'right',
                  payload: { action: 'guild_toggle_joined_mode' },
                })
              }
            >
              <MinecraftText text="§b[点击此处切换「无公会」列表视图]" />
            </span>
          </div>
        }
      >
        {renderJoinedTopRow()}
        {Array.from({ length: 36 }, (_, i) => renderJoinedSlot(i + 9))}
      </GuiFrame>

      {/* 输出权限矩阵表格（需求 6.5：需输出一张“职位 × 操作”表格，UI按矩阵显示或隐藏按钮） */}
      <GuildPermissionMatrixPanel currentRole={role} />
    </div>
  );
};

const GuildPermissionMatrixPanel: React.FC<{ currentRole: GuildRole }> = ({
  currentRole,
}) => {
  const { dispatchAction } = useGui();

  return (
    <div
      style={{
        width: 'var(--gui-width)',
        marginTop: '12px',
        background: '#151826',
        border: '1px solid #384060',
        padding: '10px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <strong style={{ color: '#ffd369', fontSize: '12px' }}>
          📋 公会「职位 × 操作」权限矩阵 (点击职位按钮可实时验证 UI 显隐)
        </strong>
        <div style={{ display: 'flex', gap: '4px' }}>
          {ROLE_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              className={`wb-btn ${currentRole === r ? 'active' : ''}`}
              style={{ padding: '2px 7px', fontSize: '11px' }}
              onClick={() =>
                dispatchAction({
                  screen: 'guild',
                  slot: 7,
                  click: 'left',
                  payload: { action: `guild_sim_role:${r}` },
                })
              }
            >
              {zh_CN.guildRoles[r]}
            </button>
          ))}
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #2e344f', color: '#9aa2c2' }}>
            <th style={{ padding: '4px' }}>操作项</th>
            <th style={{ padding: '4px', textAlign: 'center' }}>会长</th>
            <th style={{ padding: '4px', textAlign: 'center' }}>副会长</th>
            <th style={{ padding: '4px', textAlign: 'center' }}>精英</th>
            <th style={{ padding: '4px', textAlign: 'center' }}>普通成员</th>
          </tr>
        </thead>
        <tbody>
          {GUILD_PERMISSION_MATRIX.map((row) => (
            <tr
              key={row.action}
              style={{ borderBottom: '1px solid rgba(46,52,79,0.45)' }}
            >
              <td style={{ padding: '3px 4px', color: '#dce1f5' }} title={row.description}>
                {row.label}
              </td>
              {ROLE_ORDER.map((r) => {
                const allowed = row.roles[r];
                const isCurrentCol = r === currentRole;
                return (
                  <td
                    key={r}
                    style={{
                      padding: '3px 4px',
                      textAlign: 'center',
                      background: isCurrentCol
                        ? 'rgba(212, 166, 74, 0.12)'
                        : undefined,
                      color: allowed ? '#55ff55' : '#666b85',
                      fontWeight: isCurrentCol ? 700 : 400,
                    }}
                  >
                    {allowed ? '✔允许' : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
