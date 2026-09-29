import { Item, ScreenId, ServerState } from '../../types';
import { INITIAL_MOUNTS, INITIAL_PETS } from '../data/companions';
import { INITIAL_GUILD_DATA, INITIAL_GUILD_LIST } from '../data/guilds';
import { cloneItem } from '../data/items';
import { INITIAL_MAILS } from '../data/mails';
import { INITIAL_QUESTS } from '../data/quests';

export type ScenarioKey =
  | 'normal'
  | 'empty'
  | 'full_multipage'
  | 'boundary_bag_full'
  | 'boundary_low_perm';

export interface ScenarioMeta {
  key: ScenarioKey;
  label: string;
  tag: string;
  description: string;
}

export const SCENARIO_LIST: ScenarioMeta[] = [
  {
    key: 'normal',
    label: '标准演示场景 (Normal)',
    tag: '默认',
    description: '各界面包含丰富的代表性数据，适合常规交互与穿戴/存取验证。',
  },
  {
    key: 'empty',
    label: '空数据状态 (Empty)',
    tag: '空态',
    description: '空仓库、无宠物/坐骑、未加入公会（展示公会列表与创建）、空邮箱。',
  },
  {
    key: 'full_multipage',
    label: '多页与高负载 (Multi-page)',
    tag: '多页',
    description: '仓库跨 3 页共 81 格、任务/宠物/邮件列表多页分页展示。',
  },
  {
    key: 'boundary_bag_full',
    label: '边界：背包已满 & 仓库上限',
    tag: '边界A',
    description: '玩家 36 格背包全满，仓库堆叠接近上限（测试附件领取拦截与仓库超量部分放入）。',
  },
  {
    key: 'boundary_low_perm',
    label: '边界：普通成员权限 & 过期邮件',
    tag: '边界B',
    description: '公会处于「普通成员」职位（按权限矩阵隐藏管理按钮并禁止仓库取出），选中已过期邮件。',
  },
];

export function calculateWarehouseTotalAmount(
  slots: (Item | null)[],
  mode: 'stack_sum' | 'slot_count' = 'stack_sum'
): number {
  if (mode === 'slot_count') {
    return slots.filter(Boolean).length;
  }
  return slots.reduce((sum, item) => sum + (item ? item.amount : 0), 0);
}

export function createBaseServerState(activeScreen: ScreenId = 'warehouse'): ServerState {
  // 玩家背包 P0~P35 (36 格)
  const inventory: (Item | null)[] = Array.from({ length: 36 }, () => null);
  inventory[0] = cloneItem('helm_iron', 1);
  inventory[1] = cloneItem('ring_frost', 1);
  inventory[2] = cloneItem('pet_claw_flame', 1);
  inventory[3] = cloneItem('mount_saddle_royal', 1);
  inventory[4] = cloneItem('ore_mythril', 24);
  inventory[5] = cloneItem('gem_void', 12);
  inventory[6] = cloneItem('potion_pet_exp', 15);
  inventory[7] = cloneItem('coin_guild_token', 30);
  // 快捷栏 P27~P35
  inventory[27] = cloneItem('sword_dawnbreaker', 1);
  inventory[28] = cloneItem('potion_heal', 20);
  inventory[29] = cloneItem('scroll_ancient', 1);

  // 私人仓库 3页 × 27格 = 81格上限，默认解锁 45 格（跨 2 页）
  const warehouseSlots: (Item | null)[] = Array.from({ length: 81 }, () => null);
  warehouseSlots[0] = cloneItem('ore_mythril', 50);
  warehouseSlots[1] = cloneItem('gem_void', 30);
  warehouseSlots[2] = cloneItem('potion_heal', 40);
  warehouseSlots[3] = cloneItem('potion_pet_exp', 20);
  warehouseSlots[4] = cloneItem('helm_valkyrie', 1);
  warehouseSlots[5] = cloneItem('boots_wind', 1);
  warehouseSlots[6] = cloneItem('ring_crimson', 1);
  warehouseSlots[7] = cloneItem('pet_collar_spirit', 1);
  warehouseSlots[8] = cloneItem('scroll_ancient', 2);
  warehouseSlots[9] = cloneItem('coin_guild_token', 40);
  // 第 2 页放入一些物品（槽位 27, 28）
  warehouseSlots[27] = cloneItem('legs_shadow', 1);
  warehouseSlots[28] = cloneItem('ore_mythril', 32);

  const totalAmount = calculateWarehouseTotalAmount(warehouseSlots, 'stack_sum');

  return {
    currentScreen: activeScreen,
    scenarioName: 'normal',
    player: {
      name: 'Arthur_Pendragon',
      level: 58,
      combatPower: 26840,
      gold: 128500,
      gems: 3680,
      baseStats: {
        attack: 320,
        defense: 180,
        hp: 3500,
        critRate: 15,
        speed: 100,
      },
      equipment: {
        helmet: cloneItem('helm_valkyrie', 1),
        chestplate: cloneItem('chest_dragonscale', 1),
        leggings: cloneItem('legs_shadow', 1),
        boots: cloneItem('boots_wind', 1),
        offhand: cloneItem('shield_aegis', 1),
        necklace: cloneItem('neck_starlight', 1),
        ring1: cloneItem('ring_crimson', 1),
        ring2: null,
        talisman: cloneItem('talisman_void', 1),
      },
      inventory,
      cursorItem: null,
    },
    warehouse: {
      slots: warehouseSlots,
      unlockedCount: 42, // 第1页27格全开 + 第2页前15格已开，剩余可按序解锁
      maxSlots: 81,
      totalAmount,
      maxTotalAmount: 300,
      categories: ['all', 'equipment', 'material', 'consumable', 'quest', 'other'],
      unlockCostGold: 2000,
      canUnlockPermissions: true,
      currentPage: 1,
      selectedCategory: 'all',
      searchQuery: '',
      capacityMode: 'stack_sum',
    },
    quest: {
      selectedCategory: 'main',
      currentPage: 1,
      selectedQuestId: 'q_main_01',
      quests: INITIAL_QUESTS.map((q) => ({
        ...q,
        objectives: q.objectives.map((o) => ({ ...o })),
        rewards: q.rewards.map((r) => ({ ...r })),
      })),
    },
    pet: {
      currentPage: 1,
      selectedPetId: 'pet_01',
      maxActivePets: 1,
      equipSlotCount: 1,
      pets: INITIAL_PETS.map((p) => ({
        ...p,
        attributes: [...p.attributes],
        equipmentSlots: [...p.equipmentSlots],
      })),
    },
    mount: {
      currentPage: 1,
      selectedMountId: 'mount_01',
      equipSlotCount: 1,
      mounts: INITIAL_MOUNTS.map((m) => ({
        ...m,
        attributes: [...m.attributes],
        equipmentSlots: [...m.equipmentSlots],
      })),
    },
    guild: {
      joined: true,
      playerRole: 'leader',
      activeTab: 'overview',
      currentPage: 1,
      searchQuery: '',
      selectedMemberUuid: 'u_02',
      guildData: JSON.parse(JSON.stringify(INITIAL_GUILD_DATA)),
      guildList: JSON.parse(JSON.stringify(INITIAL_GUILD_LIST)),
      warehousePage: 1,
      warehouseCategory: 'all',
    },
    mail: {
      activeTab: 'system',
      currentPage: 1,
      selectedMailId: 'mail_sys_01',
      mails: JSON.parse(JSON.stringify(INITIAL_MAILS)),
      cdkInput: 'RPG-2026-STAR',
      cdkStatus: 'idle',
      cdkRewardItems: [],
      cdkMessage: '§7请点击左侧铁砧输入槽输入 CDK 礼包码进行兑换',
      draft: {
        recipient: 'Lyra_Starweaver',
        title: '团本战利品分红',
        content: '辛苦啦，这是今晚深渊团本掉落的秘银矿与药水！',
        attachments: [cloneItem('ore_mythril', 8), null, null, null],
        postage: 100,
      },
    },
    chestShop: {
      targetItem: null, // 编辑界面初始为空，显示待上架
      currency: 'gold',
      unitPrice: 50,
      stock: 0,
      maxStock: 5000,
      buyAmount: 1,
      shopTitle: '§6星辰私人箱子商店',
      ownerName: 'Arthur_Pendragon',
    },
    ui: {
      confirmDialog: null,
      textInputModal: null,
      lastToast: null,
    },
  };
}

export function buildScenarioState(
  scenario: ScenarioKey,
  keepScreen: ScreenId
): ServerState {
  const base = createBaseServerState(keepScreen);
  base.scenarioName = scenario;

  if (scenario === 'empty') {
    base.warehouse.slots = Array.from({ length: 81 }, () => null);
    base.warehouse.unlockedCount = 27;
    base.warehouse.totalAmount = 0;
    base.quest.quests = [];
    base.quest.selectedQuestId = null;
    base.pet.pets = [];
    base.pet.selectedPetId = null;
    base.mount.mounts = [];
    base.mount.selectedMountId = null;
    base.guild.joined = false; // 展示无公会列表、搜索与创建界面
    base.mail.mails = [];
    base.mail.selectedMailId = null;
    return base;
  }

  if (scenario === 'full_multipage') {
    // 填充 65 格仓库物品，跨 3 页
    const fullSlots: (Item | null)[] = Array.from({ length: 81 }, (_, idx) => {
      if (idx < 60) {
        const keys = [
          'ore_mythril',
          'gem_void',
          'potion_heal',
          'helm_iron',
          'ring_frost',
          'scroll_ancient',
        ] as const;
        return cloneItem(keys[idx % keys.length], (idx % 5) + 2);
      }
      return null;
    });
    base.warehouse.slots = fullSlots;
    base.warehouse.unlockedCount = 72;
    base.warehouse.maxTotalAmount = 500;
    base.warehouse.totalAmount = calculateWarehouseTotalAmount(fullSlots, 'stack_sum');

    // 扩充宠物和任务以产生多页
    const extraPets = Array.from({ length: 9 }, (_, i) => ({
      ...base.pet.pets[i % base.pet.pets.length],
      id: `pet_multi_${i + 1}`,
      name: `§b契约灵兽 #${i + 1}`,
      isActive: i === 0,
    }));
    base.pet.pets = extraPets;
    base.pet.selectedPetId = extraPets[0].id;

    const extraQuests = Array.from({ length: 12 }, (_, i) => ({
      ...base.quest.quests[i % base.quest.quests.length],
      id: `q_multi_${i + 1}`,
      category: 'main' as const,
      name: `§6[史诗卷章 ${i + 1}] 星界远征第 ${i + 1} 幕`,
    }));
    base.quest.quests = extraQuests;
    base.quest.selectedQuestId = extraQuests[0].id;
    return base;
  }

  if (scenario === 'boundary_bag_full') {
    // 玩家背包 36 格全部塞满不可叠加的单件头盔
    base.player.inventory = Array.from({ length: 36 }, (_, idx) => ({
      ...cloneItem('helm_iron', 1),
      id: `full_helm_${idx}`,
      name: `§a备用卫士铁盔 #${idx + 1}`,
    }));
    // 仓库容量设置为 215 / 220（只剩 5 个堆叠余量）
    base.warehouse.maxTotalAmount = totalAmountPlusMargin(base.warehouse.totalAmount, 5);
    return base;
  }

  if (scenario === 'boundary_low_perm') {
    // 公会设为普通成员（无权踢人/审批/仓库取出/修改设置）
    base.guild.joined = true;
    base.guild.playerRole = 'member';
    base.guild.activeTab = 'members';
    // 邮箱默认选中已过期邮件
    base.mail.selectedMailId = 'mail_sys_04';
    base.mail.cdkInput = 'OLD-2024-GIFT';
    base.mail.cdkStatus = 'expired';
    base.mail.cdkMessage = '§c✖ 兑换失败：该 CDK 礼包码已超过有效期！';
    return base;
  }

  return base;
}

function totalAmountPlusMargin(current: number, margin: number): number {
  return current + margin;
}
