/**
 * 奇幻简约 RPG 16x16 像素矢量图标数据定义
 * 用于 Canvas 高速无损光栅化渲染及批量导出
 */

export type PixelRect = [x: number, y: number, w: number, h: number, fill: string];

export const RARITY_COLORS = {
  common: '#9ea4b0',
  uncommon: '#55ff55',
  rare: '#55ffff',
  epic: '#d066ff',
  legendary: '#ffaa00',
  mythic: '#ff5555',
};

export const PIXEL_ICONS: Record<string, { name: string; category: string; rects: PixelRect[] }> = {
  // === 武器装备 ===
  sword_iron: {
    name: '精钢长剑 (Iron Sword)',
    category: 'equipment',
    rects: [
      [11, 2, 3, 3, '#d8e2ef'],
      [9, 4, 3, 3, '#d8e2ef'],
      [7, 6, 3, 3, '#d8e2ef'],
      [5, 8, 3, 3, '#d8e2ef'],
      [12, 2, 2, 2, '#ffffff'],
      [3, 7, 2, 2, '#8b5a2b'],
      [7, 11, 2, 2, '#8b5a2b'],
      [4, 10, 3, 2, '#8b5a2b'],
      [2, 12, 2, 2, '#6b3e1b'],
      [1, 13, 2, 2, '#8b5a2b'],
    ],
  },
  sword_legend: {
    name: '圣辉圣剑 (Legendary Sword)',
    category: 'equipment',
    rects: [
      [11, 2, 3, 3, '#ffdd55'],
      [9, 4, 3, 3, '#ffdd55'],
      [7, 6, 3, 3, '#ffdd55'],
      [5, 8, 3, 3, '#ffdd55'],
      [12, 2, 2, 2, '#ffffff'],
      [3, 7, 2, 2, '#d4a64a'],
      [7, 11, 2, 2, '#d4a64a'],
      [4, 10, 3, 2, '#d4a64a'],
      [2, 12, 2, 2, '#6b3e1b'],
      [1, 13, 2, 2, '#d4a64a'],
    ],
  },
  sword_mythic: {
    name: '弑神灭尽剑 (Mythic Sword)',
    category: 'equipment',
    rects: [
      [11, 2, 3, 3, '#ff5555'],
      [9, 4, 3, 3, '#ff5555'],
      [7, 6, 3, 3, '#ff5555'],
      [5, 8, 3, 3, '#ff5555'],
      [12, 2, 2, 2, '#ffffff'],
      [3, 7, 2, 2, '#d4a64a'],
      [7, 11, 2, 2, '#d4a64a'],
      [4, 10, 3, 2, '#d4a64a'],
      [2, 12, 2, 2, '#6b3e1b'],
      [1, 13, 2, 2, '#d4a64a'],
    ],
  },
  helmet_iron: {
    name: '铁卫战盔 (Iron Helmet)',
    category: 'equipment',
    rects: [
      [4, 2, 8, 2, '#dde6f2'],
      [3, 4, 10, 8, '#aab6c8'],
      [5, 7, 6, 5, '#181a26'],
      [7, 6, 2, 4, '#dde6f2'],
      [2, 3, 1, 4, '#55ffff'],
      [13, 3, 1, 4, '#55ffff'],
    ],
  },
  helmet_gold: {
    name: '瓦尔基里圣冠 (Gold Helmet)',
    category: 'equipment',
    rects: [
      [4, 2, 8, 2, '#fff1a8'],
      [3, 4, 10, 8, '#f5b942'],
      [5, 7, 6, 5, '#181a26'],
      [7, 6, 2, 4, '#fff1a8'],
      [2, 3, 1, 4, '#55ffff'],
      [13, 3, 1, 4, '#55ffff'],
    ],
  },
  chest_plate: {
    name: '重装护胸胸甲 (Chestplate)',
    category: 'equipment',
    rects: [
      [2, 3, 4, 4, '#7c8aa6'],
      [10, 3, 4, 4, '#7c8aa6'],
      [4, 4, 8, 10, '#9eb0cf'],
      [6, 5, 4, 4, '#d4a64a'],
      [7, 6, 2, 2, '#55ffff'],
      [5, 11, 6, 2, '#5b6882'],
    ],
  },
  leggings: {
    name: '精钢战裙护腿 (Leggings)',
    category: 'equipment',
    rects: [
      [4, 2, 8, 3, '#d4a64a'],
      [4, 5, 3, 9, '#8898b5'],
      [9, 5, 3, 9, '#8898b5'],
      [4, 11, 3, 2, '#c0cee6'],
      [9, 11, 3, 2, '#c0cee6'],
    ],
  },
  boots: {
    name: '逐风战靴 (Boots)',
    category: 'equipment',
    rects: [
      [3, 5, 4, 6, '#8898b5'],
      [9, 5, 4, 6, '#8898b5'],
      [2, 11, 5, 3, '#d4a64a'],
      [9, 11, 5, 3, '#d4a64a'],
    ],
  },
  shield: {
    name: '骑士鸢盾 (Shield)',
    category: 'equipment',
    rects: [
      [3, 2, 10, 9, '#d4a64a'],
      [5, 11, 6, 2, '#d4a64a'],
      [7, 13, 2, 2, '#d4a64a'],
      [4, 3, 8, 7, '#2c4a7c'],
      [7, 4, 2, 6, '#ffd369'],
      [5, 6, 6, 2, '#ffd369'],
    ],
  },

  // === 饰品与宝物 ===
  necklace: {
    name: '蓝晶天界项链 (Necklace)',
    category: 'equipment',
    rects: [
      [4, 2, 8, 2, '#d4a64a'],
      [3, 4, 2, 5, '#d4a64a'],
      [11, 4, 2, 5, '#d4a64a'],
      [5, 9, 6, 2, '#d4a64a'],
      [6, 10, 4, 4, '#55ffff'],
      [7, 11, 2, 2, '#ffffff'],
    ],
  },
  ring_ruby: {
    name: '绯红血玉戒 (Ruby Ring)',
    category: 'equipment',
    rects: [
      [6, 2, 4, 3, '#ff4466'],
      [7, 2, 2, 1, '#ffffff'],
      [4, 5, 8, 8, '#f5b942'],
      [6, 7, 4, 4, '#1e202d'],
    ],
  },
  ring_sapphire: {
    name: '群星深蓝戒 (Sapphire Ring)',
    category: 'equipment',
    rects: [
      [6, 2, 4, 3, '#44ccff'],
      [7, 2, 2, 1, '#ffffff'],
      [4, 5, 8, 8, '#f5b942'],
      [6, 7, 4, 4, '#1e202d'],
    ],
  },
  talisman: {
    name: '远古虚空护符 (Talisman)',
    category: 'equipment',
    rects: [
      [4, 2, 8, 12, '#7a2899'],
      [5, 3, 6, 10, '#aa44dd'],
      [7, 4, 2, 8, '#ffd369'],
      [6, 6, 4, 2, '#55ffff'],
    ],
  },

  // === 消耗药剂 ===
  potion_hp: {
    name: '强效生命药剂 (HP Potion)',
    category: 'consumable',
    rects: [
      [6, 2, 4, 2, '#c28d53'],
      [5, 4, 6, 2, '#a8c0d8'],
      [3, 6, 10, 8, '#a8c0d8'],
      [4, 7, 8, 6, '#ff4455'],
      [5, 8, 2, 2, '#ffffff'],
    ],
  },
  potion_mana: {
    name: '秘术魔力药剂 (Mana Potion)',
    category: 'consumable',
    rects: [
      [6, 2, 4, 2, '#c28d53'],
      [5, 4, 6, 2, '#a8c0d8'],
      [3, 6, 10, 8, '#a8c0d8'],
      [4, 7, 8, 6, '#44aaff'],
      [5, 8, 2, 2, '#ffffff'],
    ],
  },
  potion_exp: {
    name: '智慧经验琼浆 (EXP Potion)',
    category: 'consumable',
    rects: [
      [6, 2, 4, 2, '#c28d53'],
      [5, 4, 6, 2, '#a8c0d8'],
      [3, 6, 10, 8, '#a8c0d8'],
      [4, 7, 8, 6, '#55ff66'],
      [5, 8, 2, 2, '#ffffff'],
    ],
  },

  // === 材料与杂项 ===
  gem_star: {
    name: '星辰原石结晶 (Star Gem)',
    category: 'material',
    rects: [
      [7, 2, 2, 12, '#d066ff'],
      [2, 7, 12, 2, '#d066ff'],
      [4, 4, 8, 8, '#d066ff'],
      [6, 6, 4, 4, '#ffffff'],
    ],
  },
  ore_mythril: {
    name: '永恒秘银矿石 (Mythril Ore)',
    category: 'material',
    rects: [
      [7, 2, 2, 12, '#44ddff'],
      [2, 7, 12, 2, '#44ddff'],
      [4, 4, 8, 8, '#44ddff'],
      [6, 6, 4, 4, '#ffffff'],
    ],
  },
  scroll_quest: {
    name: '冒险委托卷轴 (Quest Scroll)',
    category: 'quest',
    rects: [
      [3, 2, 10, 12, '#e8d4a2'],
      [2, 2, 2, 12, '#b87d3b'],
      [12, 2, 2, 12, '#b87d3b'],
      [5, 5, 6, 1, '#6e4e2e'],
      [5, 7, 6, 1, '#6e4e2e'],
      [5, 9, 4, 1, '#c83e3e'],
    ],
  },
  book: {
    name: '附魔史诗魔导书 (Spell Book)',
    category: 'quest',
    rects: [
      [3, 2, 10, 12, '#e8d4a2'],
      [2, 2, 2, 12, '#b87d3b'],
      [12, 2, 2, 12, '#b87d3b'],
      [5, 5, 6, 1, '#6e4e2e'],
      [5, 7, 6, 1, '#6e4e2e'],
      [5, 9, 4, 1, '#c83e3e'],
    ],
  },

  // === 灵宠与坐骑 ===
  pet_dragon: {
    name: '赤炎幼龙 (Red Dragon)',
    category: 'companion',
    rects: [
      [3, 2, 2, 3, '#ffd369'],
      [11, 2, 2, 3, '#ffd369'],
      [3, 5, 10, 8, '#ff5555'],
      [5, 7, 2, 2, '#11131c'],
      [9, 7, 2, 2, '#11131c'],
      [5, 7, 1, 1, '#ffffff'],
      [9, 7, 1, 1, '#ffffff'],
      [6, 10, 4, 3, '#fff0c2'],
    ],
  },
  pet_fox: {
    name: '幻尾灵狐 (Spirit Fox)',
    category: 'companion',
    rects: [
      [3, 2, 2, 3, '#ffd369'],
      [11, 2, 2, 3, '#ffd369'],
      [3, 5, 10, 8, '#ff9933'],
      [5, 7, 2, 2, '#11131c'],
      [9, 7, 2, 2, '#11131c'],
      [5, 7, 1, 1, '#ffffff'],
      [9, 7, 1, 1, '#ffffff'],
      [6, 10, 4, 3, '#fff0c2'],
    ],
  },
  pet_slime: {
    name: '碧翠史莱姆 (Jade Slime)',
    category: 'companion',
    rects: [
      [3, 2, 2, 3, '#ffd369'],
      [11, 2, 2, 3, '#ffd369'],
      [3, 5, 10, 8, '#55ee88'],
      [5, 7, 2, 2, '#11131c'],
      [9, 7, 2, 2, '#11131c'],
      [5, 7, 1, 1, '#ffffff'],
      [9, 7, 1, 1, '#ffffff'],
      [6, 10, 4, 3, '#fff0c2'],
    ],
  },
  pet_owl: {
    name: '智慧渡鸦鸮 (Night Owl)',
    category: 'companion',
    rects: [
      [3, 2, 2, 3, '#ffd369'],
      [11, 2, 2, 3, '#ffd369'],
      [3, 5, 10, 8, '#9988cc'],
      [5, 7, 2, 2, '#11131c'],
      [9, 7, 2, 2, '#11131c'],
      [5, 7, 1, 1, '#ffffff'],
      [9, 7, 1, 1, '#ffffff'],
      [6, 10, 4, 3, '#fff0c2'],
    ],
  },
  mount_griffin: {
    name: '金辉狮鹫兽 (Golden Griffin)',
    category: 'companion',
    rects: [
      [9, 2, 4, 6, '#ffd369'],
      [11, 4, 3, 2, '#ff9933'],
      [3, 7, 9, 5, '#7c5836'],
      [5, 6, 4, 3, '#d43f3f'],
      [3, 12, 2, 3, '#e2e6f5'],
      [9, 12, 2, 3, '#e2e6f5'],
    ],
  },
  mount_wolf: {
    name: '霜狼战兽 (Frost Wolf)',
    category: 'companion',
    rects: [
      [9, 2, 4, 6, '#66ccff'],
      [11, 4, 3, 2, '#ff9933'],
      [3, 7, 9, 5, '#7c5836'],
      [5, 6, 4, 3, '#d43f3f'],
      [3, 12, 2, 3, '#e2e6f5'],
      [9, 12, 2, 3, '#e2e6f5'],
    ],
  },
  mount_steed: {
    name: '王国纯血战马 (Royal Steed)',
    category: 'companion',
    rects: [
      [9, 2, 4, 6, '#e2e6f5'],
      [11, 4, 3, 2, '#ff9933'],
      [3, 7, 9, 5, '#7c5836'],
      [5, 6, 4, 3, '#d43f3f'],
      [3, 12, 2, 3, '#e2e6f5'],
      [9, 12, 2, 3, '#e2e6f5'],
    ],
  },

  // === 随从装备 ===
  pet_collar: {
    name: '灵宠符文项圈 (Pet Collar)',
    category: 'equipment',
    rects: [
      [3, 4, 10, 8, '#8b5a2b'],
      [5, 6, 6, 4, '#ff77ff'],
      [7, 7, 2, 2, '#ffffff'],
      [6, 2, 4, 2, '#ffd369'],
    ],
  },
  pet_claw: {
    name: '灵宠合金锐爪 (Pet Claw)',
    category: 'equipment',
    rects: [
      [3, 4, 10, 8, '#8b5a2b'],
      [5, 6, 6, 4, '#ff77ff'],
      [7, 7, 2, 2, '#ffffff'],
      [6, 2, 4, 2, '#ffd369'],
    ],
  },
  pet_charm: {
    name: '灵宠护灵符石 (Pet Charm)',
    category: 'equipment',
    rects: [
      [3, 4, 10, 8, '#8b5a2b'],
      [5, 6, 6, 4, '#ff77ff'],
      [7, 7, 2, 2, '#ffffff'],
      [6, 2, 4, 2, '#ffd369'],
    ],
  },
  mount_saddle: {
    name: '坚韧皮革战鞍 (Mount Saddle)',
    category: 'equipment',
    rects: [
      [3, 4, 10, 8, '#8b5a2b'],
      [5, 6, 6, 4, '#55ffff'],
      [7, 7, 2, 2, '#ffffff'],
      [6, 2, 4, 2, '#ffd369'],
    ],
  },
  mount_barding: {
    name: '镀金重装马铠 (Mount Barding)',
    category: 'equipment',
    rects: [
      [3, 4, 10, 8, '#8b5a2b'],
      [5, 6, 6, 4, '#55ffff'],
      [7, 7, 2, 2, '#ffffff'],
      [6, 2, 4, 2, '#ffd369'],
    ],
  },
  mount_spurs: {
    name: '秘银精钢马刺 (Mount Spurs)',
    category: 'equipment',
    rects: [
      [3, 4, 10, 8, '#8b5a2b'],
      [5, 6, 6, 4, '#55ffff'],
      [7, 7, 2, 2, '#ffffff'],
      [6, 2, 4, 2, '#ffd369'],
    ],
  },

  // === 系统控件与状态图标 ===
  lock: {
    name: '槽位上锁状态 (Slot Locked)',
    category: 'control',
    rects: [
      [5, 3, 6, 4, '#8b93af'],
      [6, 4, 4, 3, '#191520'],
      [4, 7, 8, 7, '#d45555'],
      [7, 9, 2, 3, '#ffd369'],
    ],
  },
  unlock_plus: {
    name: '按序解锁槽位 (Unlock Plus)',
    category: 'control',
    rects: [
      [7, 3, 2, 10, '#55ff55'],
      [3, 7, 10, 2, '#55ff55'],
      [6, 6, 4, 4, '#ffffff'],
    ],
  },
  search: {
    name: '放大镜搜索 (Search Glass)',
    category: 'control',
    rects: [
      [4, 3, 6, 6, '#55ffff'],
      [5, 4, 4, 4, '#1e202d'],
      [9, 9, 2, 2, '#d4a64a'],
      [11, 11, 3, 3, '#d4a64a'],
    ],
  },
  sort: {
    name: '一键整理排序 (Sort Lines)',
    category: 'control',
    rects: [
      [3, 3, 10, 2, '#d066ff'],
      [3, 7, 7, 2, '#55ffff'],
      [3, 11, 4, 2, '#ffd369'],
    ],
  },
  arrow_left: {
    name: '翻页上一页 (Prev Arrow)',
    category: 'control',
    rects: [
      [8, 3, 2, 10, '#ffd369'],
      [6, 5, 2, 6, '#ffd369'],
      [4, 7, 2, 2, '#ffd369'],
    ],
  },
  arrow_right: {
    name: '翻页下一页 (Next Arrow)',
    category: 'control',
    rects: [
      [6, 3, 2, 10, '#ffd369'],
      [8, 5, 2, 6, '#ffd369'],
      [10, 7, 2, 2, '#ffd369'],
    ],
  },
  mail_unread: {
    name: '未读邮件红点 (Unread Mail)',
    category: 'control',
    rects: [
      [2, 4, 12, 9, '#ffd369'],
      [3, 5, 10, 2, '#ffffff'],
      [11, 2, 3, 3, '#ff4444'],
    ],
  },
  mail_read: {
    name: '已读邮件信封 (Read Mail)',
    category: 'control',
    rects: [
      [2, 4, 12, 9, '#7b829e'],
      [3, 5, 10, 2, '#ffffff'],
    ],
  },
  coin_gold: {
    name: '金币钱币 (Gold Coin)',
    category: 'currency',
    rects: [
      [4, 2, 8, 12, '#ffaa00'],
      [2, 4, 12, 8, '#ffaa00'],
      [5, 4, 6, 8, '#ffd866'],
      [7, 5, 2, 6, '#b87300'],
    ],
  },
  emerald: {
    name: '绿宝石结晶 (Emerald)',
    category: 'currency',
    rects: [
      [6, 1, 4, 2, '#55ff55'],
      [4, 3, 8, 2, '#22dd44'],
      [3, 5, 10, 6, '#17b037'],
      [5, 4, 3, 3, '#aaffaa'],
      [5, 7, 6, 3, '#0d8525'],
      [4, 11, 8, 2, '#17b037'],
      [6, 13, 4, 2, '#0b5e1b'],
    ],
  },
  warehouse: {
    name: '私人金库宝箱 (Warehouse Box)',
    category: 'control',
    rects: [
      [2, 3, 12, 10, '#9c632d'],
      [2, 7, 12, 2, '#231c16'],
      [7, 6, 2, 4, '#ffd369'],
    ],
  },
  chest_guild: {
    name: '公会储物大箱 (Guild Chest)',
    category: 'control',
    rects: [
      [2, 3, 12, 10, '#9c632d'],
      [2, 7, 12, 2, '#231c16'],
      [7, 6, 2, 4, '#ffd369'],
    ],
  },
  banner_guild: {
    name: '公会战旗勋标 (Guild Banner)',
    category: 'control',
    rects: [
      [3, 2, 10, 2, '#d4a64a'],
      [4, 4, 8, 9, '#b8324f'],
      [7, 5, 2, 5, '#ffd369'],
      [6, 7, 4, 2, '#ffd369'],
    ],
  },
  check_green: {
    name: '绿色确认对勾 (Check Green)',
    category: 'control',
    rects: [
      [3, 8, 2, 3, '#55ff55'],
      [5, 10, 3, 3, '#55ff55'],
      [8, 6, 3, 4, '#55ff55'],
      [11, 3, 2, 4, '#55ff55'],
    ],
  },
  cross_red: {
    name: '红色取消叉号 (Cross Red)',
    category: 'control',
    rects: [
      [3, 3, 3, 3, '#ff5555'],
      [10, 3, 3, 3, '#ff5555'],
      [6, 6, 4, 4, '#ff5555'],
      [3, 10, 3, 3, '#ff5555'],
      [10, 10, 3, 3, '#ff5555'],
    ],
  },
  chest_shop: {
    name: '箱子商店木箱 (Chest Shop)',
    category: 'control',
    rects: [
      [2, 3, 12, 10, '#a46628'],
      [3, 2, 10, 2, '#ffd369'],
      [2, 6, 12, 1, '#4a2e13'],
      [7, 5, 2, 3, '#ffffff'],
      [7, 6, 2, 2, '#d4a64a'],
      [3, 12, 10, 1, '#4a2e13'],
      [4, 8, 2, 2, '#ffd369'],
      [10, 8, 2, 2, '#ffd369'],
    ],
  },
  chest_gold: {
    name: '镀金宝箱 (Gold Chest)',
    category: 'control',
    rects: [
      [2, 3, 12, 10, '#a46628'],
      [3, 2, 10, 2, '#ffd369'],
      [2, 6, 12, 1, '#4a2e13'],
      [7, 5, 2, 3, '#ffffff'],
      [7, 6, 2, 2, '#d4a64a'],
      [3, 12, 10, 1, '#4a2e13'],
      [4, 8, 2, 2, '#ffd369'],
      [10, 8, 2, 2, '#ffd369'],
    ],
  },
  cart_buy: {
    name: '购物车选购 (Cart Buy)',
    category: 'control',
    rects: [
      [2, 3, 3, 2, '#55ffff'],
      [4, 5, 9, 5, '#2d7fc7'],
      [5, 6, 7, 3, '#ffd369'],
      [4, 10, 8, 2, '#184a75'],
      [5, 12, 2, 2, '#ffffff'],
      [10, 12, 2, 2, '#ffffff'],
    ],
  },
  price_tag: {
    name: '商品标价格签 (Price Tag)',
    category: 'control',
    rects: [
      [4, 3, 8, 9, '#e6b422'],
      [5, 4, 6, 7, '#ffd369'],
      [7, 5, 2, 2, '#181a26'],
      [6, 8, 4, 2, '#884400'],
      [3, 2, 3, 2, '#ff5555'],
    ],
  },
  plus_qty: {
    name: '加量按钮图标 (+Qty)',
    category: 'control',
    rects: [
      [3, 3, 10, 10, '#1a3d24'],
      [7, 4, 2, 8, '#55ff55'],
      [4, 7, 8, 2, '#55ff55'],
    ],
  },
  minus_qty: {
    name: '减量按钮图标 (-Qty)',
    category: 'control',
    rects: [
      [3, 3, 10, 10, '#3d1a1a'],
      [4, 7, 8, 2, '#ff5555'],
    ],
  },
  empty_slot: {
    name: '空槽占位禁止 (Barrier)',
    category: 'control',
    rects: [
      [3, 3, 10, 1, '#ff5555'],
      [3, 12, 10, 1, '#ff5555'],
      [3, 3, 1, 10, '#ff5555'],
      [12, 3, 1, 10, '#ff5555'],
      [5, 5, 6, 6, 'rgba(170,0,0,0.5)'],
      [7, 5, 2, 6, '#ffffff'],
      [5, 7, 6, 2, '#ffffff'],
    ],
  },
  barrier: {
    name: '屏障结界 (Barrier)',
    category: 'control',
    rects: [
      [3, 3, 10, 1, '#ff5555'],
      [3, 12, 10, 1, '#ff5555'],
      [3, 3, 1, 10, '#ff5555'],
      [12, 3, 1, 10, '#ff5555'],
      [5, 5, 6, 6, 'rgba(170,0,0,0.5)'],
      [7, 5, 2, 6, '#ffffff'],
      [5, 7, 6, 2, '#ffffff'],
    ],
  },
  pane_gray: {
    name: '灰色玻璃板填格 (Stained Glass Pane)',
    category: 'control',
    rects: [
      [2, 2, 12, 12, '#2c3144'],
      [4, 4, 8, 8, '#1c1f2e'],
      [3, 3, 2, 2, '#50587a'],
      [11, 11, 2, 2, '#50587a'],
    ],
  },
};
