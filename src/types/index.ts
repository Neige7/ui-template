export type ScreenId =
  | 'inventory'
  | 'warehouse'
  | 'quest'
  | 'pet'
  | 'mount'
  | 'guild'
  | 'mail';

export type ClickType =
  | 'left'
  | 'right'
  | 'shift_left'
  | 'shift_right'
  | 'number_key'
  | 'drop';

export type SlotVisualState =
  | 'normal'
  | 'hover'
  | 'selected'
  | 'disabled'
  | 'locked'
  | 'hidden';

/**
 * 3.3 交互抽象（所有用户操作统一抽象为 GuiAction）
 */
export interface GuiAction {
  screen: ScreenId;
  slot: number | string; // 容器槽位 0~53 或 玩家背包 P0~P35
  click: ClickType;
  payload?: unknown; // 如输入文本、数字键编号(1-9)、确认弹窗回调动作
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ItemCategory =
  | 'equipment'
  | 'material'
  | 'consumable'
  | 'quest'
  | 'other';

export type EquipmentSlotType =
  | 'helmet'
  | 'chestplate'
  | 'leggings'
  | 'boots'
  | 'offhand'
  | 'necklace'
  | 'ring'
  | 'talisman'
  | 'pet_collar'
  | 'pet_claw'
  | 'pet_charm'
  | 'mount_saddle'
  | 'mount_barding'
  | 'mount_spurs'
  | 'weapon';

/**
 * 5. 数据模型 - Item
 */
export interface Item {
  id: string;
  name: string; // 支持 § 颜色码
  icon: string; // 像素图标标识
  rarity: ItemRarity;
  category: ItemCategory;
  amount: number;
  maxStack: number;
  lore: string[];
  bindType?: 'none' | 'bind_on_pickup' | 'bind_on_equip';
  equipType?: EquipmentSlotType;
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    speed?: number;
  };
}

/**
 * 5. 数据模型 - Quest
 */
export type QuestCategory = 'main' | 'side' | 'daily' | 'weekly' | 'event';
export type QuestStatus = 'available' | 'in_progress' | 'claimable' | 'completed';

export interface QuestObjective {
  text: string;
  current: number;
  target: number;
}

export interface Quest {
  id: string;
  category: QuestCategory;
  name: string;
  status: QuestStatus;
  level: number;
  description: string[];
  objectives: QuestObjective[];
  rewards: Item[];
  rewardGold?: number;
  rewardExp?: number;
  trackable: boolean;
  isTracked?: boolean;
}

/**
 * 5. 数据模型 - Companion（宠物、坐骑共用）
 */
export interface CompanionAttribute {
  key: string;
  label: string;
  value: string;
}

export interface Companion {
  id: string;
  type: 'pet' | 'mount';
  name: string;
  icon: string;
  rarity: ItemRarity;
  level: number;
  exp: number;
  expToNext: number;
  attributes: CompanionAttribute[];
  equipmentSlots: (Item | null)[]; // 默认 1 个（可配置切换 1 或 3 个）
  isActive: boolean;
  // 坐骑额外字段
  speed?: number; // 如 +145% 移速
  appearance?: string;
  unlockedSkins?: string[];
}

/**
 * 5. 数据模型 - Guild & GuildMember
 */
export type GuildRole = 'leader' | 'vice_leader' | 'elite' | 'member';
export type GuildJoinMode = 'free' | 'approval' | 'closed';
export type GuildTab =
  | 'overview'
  | 'members'
  | 'applications'
  | 'donate'
  | 'warehouse'
  | 'logs'
  | 'settings';

export interface GuildMember {
  uuid: string;
  name: string;
  role: GuildRole;
  level: number;
  contribution: number;
  online: boolean;
  lastOnline: string;
}

export interface GuildApplication {
  uuid: string;
  name: string;
  level: number;
  combatPower: number;
  appliedAt: string;
  message: string;
}

export interface GuildLog {
  id: string;
  time: string;
  type: 'join' | 'leave' | 'donate' | 'promote' | 'warehouse';
  text: string;
}

export interface GuildSummary {
  id: string;
  name: string;
  tag: string;
  level: number;
  leaderName: string;
  memberCount: number;
  maxMembers: number;
  joinMode: GuildJoinMode;
  minLevel: number;
  notice: string;
  applied?: boolean;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  level: number;
  exp: number;
  expToNext: number;
  funds: number;
  notice: string;
  joinMode: GuildJoinMode;
  minLevel: number;
  maxMembers: number;
  members: GuildMember[];
  applications: GuildApplication[];
  logs: GuildLog[];
  warehouse: Warehouse;
}

/**
 * 5. 数据模型 - Mail
 */
export type MailTab = 'system' | 'player' | 'cdk' | 'send';
export type CdkResultStatus = 'idle' | 'success' | 'invalid' | 'used' | 'expired';

export interface Mail {
  id: string;
  type: 'system' | 'player';
  sender: string;
  title: string;
  content: string[];
  attachments: Item[];
  attachedGold?: number;
  read: boolean;
  claimed: boolean;
  expireAt: string; // 如 "6天 14小时" 或 "已过期"
  expired?: boolean;
}

/**
 * 5. 数据模型 - Warehouse
 */
export type WarehouseFilterCategory = 'all' | ItemCategory;

export interface Warehouse {
  slots: (Item | null)[];
  unlockedCount: number;
  maxSlots: number;
  totalAmount: number; // 按物品堆叠总数统计
  maxTotalAmount: number;
  categories: WarehouseFilterCategory[];
  unlockCostGold: number;
  canUnlockPermissions: boolean;
}

/**
 * 布局配置 JSON Schema (3.2)
 */
export interface SlotConfigEntry {
  type:
    | 'button'
    | 'storage'
    | 'equipment'
    | 'display'
    | 'pager'
    | 'progress_bar'
    | 'tab'
    | 'list_item'
    | 'reward'
    | 'attachment'
    | 'hub_nav';
  action?: string;
  label?: string;
  visibleWhen?: string;
  mcInputSource?: 'anvil' | 'sign' | 'chat' | 'mod_textfield';
  equipType?: EquipmentSlotType;
}

export interface LayoutConfig {
  screen: ScreenId;
  rows: number;
  title: string;
  clientMode: 'mod_client_and_container_hybrid';
  slots: Record<string, SlotConfigEntry>;
  layers: ('background' | 'dynamic_text' | 'items')[];
  notes?: string[];
}

/**
 * 角色穿戴装备栏
 */
export interface PlayerEquipment {
  helmet: Item | null;
  chestplate: Item | null;
  leggings: Item | null;
  boots: Item | null;
  offhand: Item | null;
  necklace: Item | null;
  ring1: Item | null;
  ring2: Item | null;
  talisman: Item | null;
}

/**
 * 二次确认弹窗状态
 */
export interface PendingConfirm {
  title: string;
  description: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirmAction: GuiAction;
}

/**
 * 文本输入弹窗状态（标注 MC 输入来源）
 */
export interface PendingTextInput {
  title: string;
  placeholder: string;
  defaultValue?: string;
  mcSource: 'anvil' | 'sign' | 'chat' | 'mod_textfield';
  maxLength: number;
  targetAction: GuiAction;
}

/**
 * 全局 Mock Server 状态
 */
export interface ServerState {
  currentScreen: ScreenId;
  scenarioName: string;
  player: {
    name: string;
    level: number;
    combatPower: number;
    gold: number;
    gems: number; // 点券/晶石
    baseStats: {
      attack: number;
      defense: number;
      hp: number;
      critRate: number;
      speed: number;
    };
    equipment: PlayerEquipment;
    inventory: (Item | null)[]; // P0 ~ P35 (P0~P26 主背包 27格, P27~P35 快捷栏 9格)
    cursorItem: Item | null; // 鼠标上拿起的物品
  };
  warehouse: Warehouse & {
    currentPage: number;
    selectedCategory: WarehouseFilterCategory;
    searchQuery: string;
    capacityMode: 'stack_sum' | 'slot_count'; // 默认 stack_sum (用户确认1)
  };
  quest: {
    selectedCategory: QuestCategory;
    currentPage: number;
    selectedQuestId: string | null;
    quests: Quest[];
  };
  pet: {
    currentPage: number;
    selectedPetId: string | null;
    maxActivePets: number; // 默认 1 (用户确认3)
    equipSlotCount: 1 | 3; // 默认 1，支持切换演示 3 (用户确认3)
    pets: Companion[];
  };
  mount: {
    currentPage: number;
    selectedMountId: string | null;
    equipSlotCount: 1 | 3;
    mounts: Companion[];
  };
  guild: {
    joined: boolean;
    playerRole: GuildRole; // 用于模拟不同职位权限
    activeTab: GuildTab;
    currentPage: number;
    searchQuery: string;
    selectedMemberUuid: string | null;
    guildData: Guild | null;
    guildList: GuildSummary[];
    warehousePage: number;
    warehouseCategory: WarehouseFilterCategory;
  };
  mail: {
    activeTab: MailTab;
    currentPage: number;
    selectedMailId: string | null;
    mails: Mail[];
    cdkInput: string;
    cdkStatus: CdkResultStatus;
    cdkRewardItems: Item[];
    cdkMessage: string;
    draft: {
      recipient: string;
      title: string;
      content: string;
      attachments: (Item | null)[]; // 最多 4 个附件槽
      postage: number;
    };
  };
  ui: {
    confirmDialog: PendingConfirm | null;
    textInputModal: PendingTextInput | null;
    lastToast: {
      id: number;
      type: 'info' | 'success' | 'warning' | 'error';
      message: string;
    } | null;
  };
}

export interface ActionLogEntry {
  id: number;
  timestamp: string;
  action: GuiAction;
  summary: string;
}
