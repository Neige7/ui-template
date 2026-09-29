import { GuildRole } from '../../types';

export type GuildPermissionAction =
  | 'promote_member'
  | 'demote_member'
  | 'kick_member'
  | 'transfer_leader'
  | 'approve_application'
  | 'edit_settings'
  | 'donate'
  | 'warehouse_deposit'
  | 'warehouse_withdraw'
  | 'warehouse_unlock'
  | 'leave_guild'
  | 'disband_guild';

export interface PermissionMatrixRow {
  action: GuildPermissionAction;
  label: string;
  description: string;
  roles: Record<GuildRole, boolean>;
}

/**
 * 公会职位 × 操作 权限矩阵
 */
export const GUILD_PERMISSION_MATRIX: PermissionMatrixRow[] = [
  {
    action: 'promote_member',
    label: '升职成员',
    description: '将会员提升为精英或副会长（需二次确认）',
    roles: { leader: true, vice_leader: true, elite: false, member: false },
  },
  {
    action: 'demote_member',
    label: '降职成员',
    description: '将副会长/精英降职（需二次确认）',
    roles: { leader: true, vice_leader: false, elite: false, member: false },
  },
  {
    action: 'kick_member',
    label: '踢出成员',
    description: '将下级成员移出公会（需二次确认）',
    roles: { leader: true, vice_leader: true, elite: false, member: false },
  },
  {
    action: 'transfer_leader',
    label: '转让会长',
    description: '将会长职位移交给其他成员（需二次确认）',
    roles: { leader: true, vice_leader: false, elite: false, member: false },
  },
  {
    action: 'approve_application',
    label: '审批入会申请',
    description: '同意、拒绝或全部拒绝玩家入会申请',
    roles: { leader: true, vice_leader: true, elite: true, member: false },
  },
  {
    action: 'edit_settings',
    label: '修改公会设置',
    description: '修改公会公告、加入方式与最低等级门槛',
    roles: { leader: true, vice_leader: true, elite: false, member: false },
  },
  {
    action: 'donate',
    label: '捐献金币/物资',
    description: '向公会金库捐献以获取个人贡献度与公会资金',
    roles: { leader: true, vice_leader: true, elite: true, member: true },
  },
  {
    action: 'warehouse_deposit',
    label: '公会仓库存入',
    description: '将背包物品放入公会共享仓库',
    roles: { leader: true, vice_leader: true, elite: true, member: true },
  },
  {
    action: 'warehouse_withdraw',
    label: '公会仓库取出',
    description: '从公会仓库取出物品（普通成员受限，精英及以上可取出）',
    roles: { leader: true, vice_leader: true, elite: true, member: false },
  },
  {
    action: 'warehouse_unlock',
    label: '解锁公会仓库槽位',
    description: '消耗公会资金扩充公会仓库容量',
    roles: { leader: true, vice_leader: true, elite: false, member: false },
  },
  {
    action: 'leave_guild',
    label: '主动退出公会',
    description: '离开当前公会（会长需先转让或解散）',
    roles: { leader: false, vice_leader: true, elite: true, member: true },
  },
  {
    action: 'disband_guild',
    label: '解散公会',
    description: '永久解散当前公会（仅限会长，需二次确认）',
    roles: { leader: true, vice_leader: false, elite: false, member: false },
  },
];

export function hasGuildPermission(
  role: GuildRole,
  action: GuildPermissionAction
): boolean {
  const row = GUILD_PERMISSION_MATRIX.find((r) => r.action === action);
  return row ? row.roles[role] : false;
}

/**
 * 公会既定职位配额与等级人数上限规则（用户确认4）
 */
export const GUILD_LEVEL_RULES = [
  { level: 1, maxMembers: 20, maxViceLeaders: 1, maxElites: 4 },
  { level: 2, maxMembers: 30, maxViceLeaders: 2, maxElites: 6 },
  { level: 3, maxMembers: 40, maxViceLeaders: 2, maxElites: 8 },
  { level: 4, maxMembers: 50, maxViceLeaders: 3, maxElites: 10 },
  { level: 5, maxMembers: 60, maxViceLeaders: 3, maxElites: 15 },
];
