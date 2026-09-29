import { Guild, GuildSummary, Item } from '../../types';
import { cloneItem } from './items';

export const INITIAL_GUILD_LIST: GuildSummary[] = [
  {
    id: 'g_01',
    name: '星辰破晓骑士团',
    tag: 'STAR',
    level: 4,
    leaderName: 'Arthur_Pendragon',
    memberCount: 38,
    maxMembers: 50,
    joinMode: 'approval',
    minLevel: 30,
    notice: '每晚20:00准时开启深渊团本，欢迎活跃冒险者！',
  },
  {
    id: 'g_02',
    name: '绯红月影商盟',
    tag: 'MOON',
    level: 3,
    leaderName: 'Sylvanas_Wind',
    memberCount: 25,
    maxMembers: 40,
    joinMode: 'free',
    minLevel: 15,
    notice: '休闲生活与锻造商盟，自由加入无需审批！',
  },
  {
    id: 'g_03',
    name: '龙眠高塔议会',
    tag: 'DRGN',
    level: 5,
    leaderName: 'Archmage_Kael',
    memberCount: 60,
    maxMembers: 60,
    joinMode: 'closed',
    minLevel: 50,
    notice: '全服第一满级公会，目前名额已满暂停招募。',
  },
];

export function createGuildWarehouseSlots(): (Item | null)[] {
  const slots: (Item | null)[] = Array.from({ length: 54 }, () => null);
  slots[0] = cloneItem('ore_mythril', 48);
  slots[1] = cloneItem('gem_void', 16);
  slots[2] = cloneItem('potion_heal', 32);
  slots[3] = cloneItem('helm_iron', 1);
  slots[4] = cloneItem('ring_frost', 1);
  slots[5] = cloneItem('coin_guild_token', 50);
  return slots;
}

export const INITIAL_GUILD_DATA: Guild = {
  id: 'g_01',
  name: '星辰破晓骑士团',
  tag: 'STAR',
  level: 4,
  exp: 6800,
  expToNext: 10000,
  funds: 158000,
  notice: '§e[公会公告] §f本周六晚 20:30 开启世界首领攻坚战，全员备好特级圣水！',
  joinMode: 'approval',
  minLevel: 30,
  maxMembers: 50,
  members: [
    {
      uuid: 'u_01',
      name: 'Arthur_Pendragon',
      role: 'leader',
      level: 58,
      contribution: 28500,
      online: true,
      lastOnline: '当前在线',
    },
    {
      uuid: 'u_02',
      name: 'Lyra_Starweaver',
      role: 'vice_leader',
      level: 54,
      contribution: 19200,
      online: true,
      lastOnline: '当前在线',
    },
    {
      uuid: 'u_03',
      name: 'Kaelen_Shadow',
      role: 'elite',
      level: 49,
      contribution: 11400,
      online: true,
      lastOnline: '当前在线',
    },
    {
      uuid: 'u_04',
      name: 'Brom_Ironbeard',
      role: 'elite',
      level: 46,
      contribution: 9800,
      online: false,
      lastOnline: '2小时前',
    },
    {
      uuid: 'u_05',
      name: 'Elena_Frost',
      role: 'member',
      level: 39,
      contribution: 4200,
      online: true,
      lastOnline: '当前在线',
    },
    {
      uuid: 'u_06',
      name: 'Ronan_Blade',
      role: 'member',
      level: 34,
      contribution: 2150,
      online: false,
      lastOnline: '1天前',
    },
  ],
  applications: [
    {
      uuid: 'app_01',
      name: 'Valkyrie_Freya',
      level: 44,
      combatPower: 14800,
      appliedAt: '10分钟前',
      message: '主修圣骑士坦位，每晚稳定在线求通过！',
    },
    {
      uuid: 'app_02',
      name: 'Zephyr_Archer',
      level: 36,
      combatPower: 11200,
      appliedAt: '35分钟前',
      message: '老玩家回归，擅长远程输出与药剂炼制。',
    },
  ],
  logs: [
    {
      id: 'log_01',
      time: '10:42',
      type: 'donate',
      text: '§bLyra_Starweaver §7向公会金库捐献了 §610,000 金币 §7(贡献 +100)',
    },
    {
      id: 'log_02',
      time: '09:15',
      type: 'warehouse',
      text: '§aKaelen_Shadow §7向公会仓库存入了 §b星辉秘银矿石 ×16',
    },
    {
      id: 'log_03',
      time: '昨日',
      type: 'promote',
      text: '§6Arthur_Pendragon §7将 §bBrom_Ironbeard §7任命为 §d公会精英',
    },
    {
      id: 'log_04',
      time: '昨日',
      type: 'join',
      text: '§aElena_Frost §7通过审批加入了公会',
    },
  ],
  warehouse: {
    slots: createGuildWarehouseSlots(),
    unlockedCount: 36,
    maxSlots: 54,
    totalAmount: 152,
    maxTotalAmount: 500,
    categories: ['all', 'equipment', 'material', 'consumable', 'quest', 'other'],
    unlockCostGold: 5000,
    canUnlockPermissions: true,
  },
};
