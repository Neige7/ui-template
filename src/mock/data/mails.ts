import { Item, Mail } from '../../types';
import { cloneItem } from './items';

export const INITIAL_MAILS: Mail[] = [
  {
    id: 'mail_sys_01',
    type: 'system',
    sender: '艾泽兰王国执政厅',
    title: '§6[全服补偿] 星辰祭典停机维护贺礼',
    content: [
      '§7亲爱的冒险者：',
      '§7感谢您对王国服务器的守护！',
      '§7随信附上维护补偿礼包，请及时提取附件。',
    ],
    attachments: [cloneItem('gem_void', 8), cloneItem('potion_pet_exp', 6)],
    attachedGold: 8888,
    read: false,
    claimed: false,
    expireAt: '6天 22小时',
    expired: false,
  },
  {
    id: 'mail_sys_02',
    type: 'system',
    sender: '世界首领讨伐结算处',
    title: '§d[排名奖励] 深渊魔龙伤害榜第 3 名',
    content: [
      '§7恭喜您在昨晚的世界首领讨伐战中表现卓越！',
      '§7这是属于您的荣耀战利品。',
    ],
    attachments: [cloneItem('ring_crimson', 1), cloneItem('coin_guild_token', 15)],
    attachedGold: 15000,
    read: true,
    claimed: false,
    expireAt: '14天 05小时',
    expired: false,
  },
  {
    id: 'mail_sys_03',
    type: 'system',
    sender: '冒险者协会引导员',
    title: '§a[新手贺礼] 欢迎踏入艾泽兰大陆',
    content: ['§7祝您旅途愉快，新手药剂包已查收。'],
    attachments: [cloneItem('potion_heal', 10)],
    attachedGold: 1000,
    read: true,
    claimed: true,
    expireAt: '29天 12小时',
    expired: false,
  },
  {
    id: 'mail_sys_04',
    type: 'system',
    sender: '限时活动信使',
    title: '§8[已过期] 上月庆典烟花补给箱',
    content: [
      '§c该邮件已超过有效期，附件已被系统信使回收，',
      '§c无法再领取附件，仅可阅读或清理删除。',
    ],
    attachments: [cloneItem('ore_mythril', 20)],
    attachedGold: 5000,
    read: true,
    claimed: false,
    expireAt: '已过期',
    expired: true,
  },
  {
    id: 'mail_plr_01',
    type: 'player',
    sender: 'Lyra_Starweaver',
    title: '§b今晚团本的秘银矿和圣水寄给你啦',
    content: [
      '§7会长大人，今晚 20:30 团本需要的锻造秘银',
      '§7和特级圣水我放附件里了，记得查收喔！',
    ],
    attachments: [cloneItem('ore_mythril', 16), cloneItem('potion_heal', 8)],
    attachedGold: 0,
    read: false,
    claimed: false,
    expireAt: '4天 18小时',
    expired: false,
  },
  {
    id: 'mail_plr_02',
    type: 'player',
    sender: 'Brom_Ironbeard',
    title: '§e刚打造好的精钢头盔，送你试用',
    content: ['§7俺在铁匠铺刚出炉的头盔，属性还不错！'],
    attachments: [cloneItem('helm_iron', 1)],
    attachedGold: 0,
    read: true,
    claimed: false,
    expireAt: '5天 09小时',
    expired: false,
  },
];

export interface CdkPreset {
  code: string;
  status: 'success' | 'used' | 'expired';
  message: string;
  rewards: Item[];
}

export const CDK_DATABASE: Record<string, CdkPreset> = {
  'RPG-2026-STAR': {
    code: 'RPG-2026-STAR',
    status: 'success',
    message: '§a✔ 兑换成功！已获得「星辰荣耀大礼包」奖励！',
    rewards: [cloneItem('talisman_void', 1), cloneItem('gem_void', 10)],
  },
  'VIP-USED-888': {
    code: 'VIP-USED-888',
    status: 'used',
    message: '§e⚠ 兑换失败：该 CDK 礼包码已被您的角色使用过！',
    rewards: [],
  },
  'OLD-2024-GIFT': {
    code: 'OLD-2024-GIFT',
    status: 'expired',
    message: '§c✖ 兑换失败：该 CDK 礼包码已超过有效期！',
    rewards: [],
  },
};
