import { hasGuildPermission } from '../screens/guild/permissionMatrix';
import {
  EquipmentSlotType,
  GuiAction,
  GuildJoinMode,
  GuildRole,
   GuildTab,
  Item,
  MailTab,
  QuestCategory,
  ScreenId,
  ServerState,
  WarehouseFilterCategory,
} from '../types';
import { CDK_DATABASE } from './data/mails';
import { calculateWarehouseTotalAmount } from './scenarios';

export interface ServerHandleResult {
  state: ServerState;
  summary: string;
}

let toastSequence = 1;

function withToast(
  state: ServerState,
  type: 'info' | 'success' | 'warning' | 'error',
  message: string
): ServerState {
  return {
    ...state,
    ui: {
      ...state.ui,
      lastToast: {
        id: toastSequence++,
        type,
        message,
      },
    },
  };
}

/**
 * 判断两个物品是否属于同类可堆叠物品
 */
export function canStackItems(a: Item, b: Item): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.rarity === b.rarity &&
    a.bindType === b.bindType &&
    a.maxStack > 1
  );
}

/**
 * 尝试向目标槽位数组放入物品（自动先叠加同类，再找空位）
 * 返回剩余未能放入的数量
 */
export function insertItemIntoSlots(
  slots: (Item | null)[],
  itemToInsert: Item,
  maxSlotLimit?: number
): { nextSlots: (Item | null)[]; remainingAmount: number } {
  const limit = maxSlotLimit ?? slots.length;
  const next = slots.map((s) => (s ? { ...s } : null));
  let remaining = itemToInsert.amount;

  // 1. 优先堆叠到已有同类物品
  for (let i = 0; i < limit && remaining > 0; i++) {
    const existing = next[i];
    if (existing && canStackItems(existing, itemToInsert) && existing.amount < existing.maxStack) {
      const space = existing.maxStack - existing.amount;
      const add = Math.min(space, remaining);
      existing.amount += add;
      remaining -= add;
    }
  }

  // 2. 放入空槽位
  for (let i = 0; i < limit && remaining > 0; i++) {
    if (!next[i]) {
      const put = Math.min(itemToInsert.maxStack, remaining);
      next[i] = { ...itemToInsert, amount: put };
      remaining -= put;
    }
  }

  return { nextSlots: next, remainingAmount: remaining };
}

/**
 * 校验角色装备部位与物品 equipType 是否匹配
 */
export function isPlayerEquipSlotMatch(
  slotKey: keyof ServerState['player']['equipment'],
  equipType?: EquipmentSlotType
): boolean {
  if (!equipType) return false;
  if (slotKey === 'ring1' || slotKey === 'ring2') {
    return equipType === 'ring';
  }
  return slotKey === equipType;
}

/**
 * 校验伙伴（宠物/坐骑）装备槽是否匹配
 */
export function isCompanionEquipMatch(
  companionType: 'pet' | 'mount',
  equipType?: EquipmentSlotType
): boolean {
  if (!equipType) return false;
  if (companionType === 'pet') {
    return (
      equipType === 'pet_collar' ||
      equipType === 'pet_claw' ||
      equipType === 'pet_charm'
    );
  }
  return (
    equipType === 'mount_saddle' ||
    equipType === 'mount_barding' ||
    equipType === 'mount_spurs'
  );
}

/**
 * 获取经过分类和搜索过滤后的仓库真实槽位索引列表
 */
export function getFilteredWarehouseIndices(
  slots: (Item | null)[],
  unlockedCount: number,
  maxSlots: number,
  category: WarehouseFilterCategory,
  searchQuery: string
): number[] {
  const q = searchQuery.trim().toLowerCase();
  const isFiltered = category !== 'all' || q.length > 0;

  if (!isFiltered) {
    return Array.from({ length: maxSlots }, (_, i) => i);
  }

  const matched: number[] = [];
  for (let i = 0; i < unlockedCount; i++) {
    const item = slots[i];
    if (!item) continue;
    if (category !== 'all' && item.category !== category) continue;
    if (q.length > 0) {
      const inName = item.name.toLowerCase().includes(q);
      const inLore = item.lore.some((l) => l.toLowerCase().includes(q));
      if (!inName && !inLore) continue;
    }
    matched.push(i);
  }
  return matched;
}

/**
 * Mock Server 核心入口：接收 GuiAction，返回新状态与日志摘要
 */
export const mockServer = {
  handle(prevState: ServerState, action: GuiAction): ServerHandleResult {
    // 深拷贝保证状态不可变性
    const state: ServerState = JSON.parse(JSON.stringify(prevState));
    const payload = (action.payload || {}) as Record<string, unknown>;
    const payloadAction = typeof payload.action === 'string' ? payload.action : '';

    // ==================== 0. 全局二次确认与文本输入弹窗处理 ====================
    if (payloadAction === 'confirm_dialog_cancel') {
      state.ui.confirmDialog = null;
      return {
        state: withToast(state, 'info', '已取消该操作'),
        summary: '取消二次确认弹窗',
      };
    }

    if (payloadAction === 'confirm_dialog_accept' && payload.forwardedAction) {
      state.ui.confirmDialog = null;
      const forwarded = payload.forwardedAction as GuiAction;
      return mockServer.handle(state, {
        ...forwarded,
        payload: {
          ...(typeof forwarded.payload === 'object' && forwarded.payload
            ? forwarded.payload
            : {}),
          confirmed: true,
        },
      });
    }

    if (payloadAction === 'text_input_cancel') {
      state.ui.textInputModal = null;
      return {
        state: withToast(state, 'info', '已关闭文本输入'),
        summary: '关闭文本输入框',
      };
    }

    // 全局界面跳转动作
    if (payloadAction.startsWith('nav_screen:')) {
      const targetScreen = payloadAction.split(':')[1] as ScreenId;
      state.currentScreen = targetScreen;
      return {
        state: withToast(state, 'info', `已切换至界面: ${targetScreen}`),
        summary: `打开界面 [${targetScreen}]`,
      };
    }

    // ==================== 1. 玩家背包槽位 P0~P35 通用交互 ====================
    if (typeof action.slot === 'string' && /^P\d+$/.test(action.slot)) {
      const pIdx = Number(action.slot.slice(1));
      return handlePlayerInventoryClick(state, pIdx, action);
    }

    // ==================== 2. 按当前界面路由处理容器槽位 ====================
    switch (action.screen) {
      case 'warehouse':
        return handleWarehouseAction(state, action);
      case 'inventory':
        return handleInventoryHubAction(state, action);
      case 'quest':
        return handleQuestAction(state, action);
      case 'pet':
        return handleCompanionAction(state, action, 'pet');
      case 'mount':
        return handleCompanionAction(state, action, 'mount');
      case 'mail':
        return handleMailAction(state, action);
      case 'guild':
        return handleGuildAction(state, action);
      case 'shop_edit':
        return handleShopEditAction(state, action);
      case 'shop_buy':
        return handleShopBuyAction(state, action);
      default:
        return { state, summary: '未定义界面动作' };
    }
  },
};

/**
 * 处理玩家背包 P0~P35 的点击、拆分、数字键与 Shift 快速转移
 */
function handlePlayerInventoryClick(
  state: ServerState,
  pIdx: number,
  action: GuiAction
): ServerHandleResult {
  const inv = state.player.inventory;
  const clickedItem = inv[pIdx];
  const cursor = state.player.cursorItem;

  // 箱子商店编辑界面：点击背包槽位进行商品上架或存入库存 (新需求)
  if (action.screen === 'shop_edit') {
    return handleShopEditInventoryClick(state, pIdx, action);
  }

  // 箱子商店购买界面：点击背包槽位提示剩余空间与信息
  if (action.screen === 'shop_buy') {
    if (!clickedItem) {
      return {
        state: withToast(state, 'info', '空闲背包槽位，购买后的商品将优先放入此处'),
        summary: `查看空闲背包槽位 P${pIdx}`,
      };
    }
    return {
      state: withToast(state, 'info', `背包物品: ${clickedItem.name} (${clickedItem.amount}/${clickedItem.maxStack})`),
      summary: `查看背包槽位 P${pIdx} 物品 [${clickedItem.name}]`,
    };
  }

  // 数字键 1~9 与快捷栏 P27~P35 交换
  if (action.click === 'number_key') {
    const hotbarOffset = typeof action.payload === 'number' ? action.payload : 0;
    const hotbarIdx = 27 + Math.min(8, Math.max(0, hotbarOffset));
    const temp = inv[hotbarIdx];
    inv[hotbarIdx] = clickedItem;
    inv[pIdx] = temp;
    return {
      state: withToast(state, 'info', `已与快捷栏 #${hotbarOffset + 1} 交换物品`),
      summary: `背包槽位 P${pIdx} ⇄ 快捷栏 P${hotbarIdx} 数字键交换`,
    };
  }

  // Q 键丢弃
  if (action.click === 'drop') {
    if (!clickedItem) {
      return { state, summary: `P${pIdx} 为空，无物品可丢弃` };
    }
    const droppedName = clickedItem.name;
    inv[pIdx] = null;
    return {
      state: withToast(state, 'warning', `已丢弃物品: ${droppedName}`),
      summary: `丢弃背包 P${pIdx} 物品 ${droppedName}`,
    };
  }

  // Shift+左键：根据当前打开的容器执行快速转移或快速穿戴
  if (action.click === 'shift_left' || action.click === 'shift_right') {
    if (!clickedItem) {
      return { state, summary: `Shift 点击空背包槽位 P${pIdx}` };
    }

    // 2.1 在私人仓库界面：快速存入仓库（遵守 unlockedCount 与 maxTotalAmount）
    if (action.screen === 'warehouse') {
      return shiftDepositToWarehouse(state, pIdx, state.warehouse, '私人仓库');
    }

    // 2.2 在公会仓库界面：校验存入权限后快速存入公会仓库
    if (
      action.screen === 'guild' &&
      state.guild.joined &&
      state.guild.activeTab === 'warehouse' &&
      state.guild.guildData
    ) {
      if (!hasGuildPermission(state.guild.playerRole, 'warehouse_deposit')) {
        return {
          state: withToast(state, 'error', '权限不足：当前职位无权向公会仓库存入物品'),
          summary: '公会仓库存入被权限矩阵拦截',
        };
      }
      const res = shiftDepositToWarehouse(
        state,
        pIdx,
        state.guild.guildData.warehouse,
        '公会仓库'
      );
      res.state.guild.guildData?.logs.unshift({
        id: `log_${Date.now()}`,
        time: '刚刚',
        type: 'warehouse',
        text: `§a${state.player.name} §7向公会仓库存入了 ${clickedItem.name}`,
      });
      return res;
    }

    // 2.3 在角色背包界面：Shift 快速穿戴装备
    if (action.screen === 'inventory') {
      const equipType = clickedItem.equipType;
      if (!equipType) {
        return {
          state: withToast(state, 'warning', '该物品不是可穿戴的角色装备！'),
          summary: `P${pIdx} 物品无角色装备部位，不可穿戴`,
        };
      }
      const equip = state.player.equipment;
      let targetKey: keyof typeof equip | null = null;
      if (equipType === 'ring') {
        targetKey = !equip.ring1 ? 'ring1' : 'ring2';
      } else if (equipType in equip) {
        targetKey = equipType as keyof typeof equip;
      }
      if (!targetKey) {
        return {
          state: withToast(
            state,
            'warning',
            '该装备属于宠物/坐骑或主手武器，无法放入角色防具饰品槽！'
          ),
          summary: `P${pIdx} 装备类型 (${equipType}) 不属于角色防具饰品栏`,
        };
      }
      const previousEquip = equip[targetKey];
      equip[targetKey] = { ...clickedItem, amount: 1 };
      inv[pIdx] = previousEquip;
      return {
        state: withToast(state, 'success', `已快速穿戴装备: ${clickedItem.name}`),
        summary: `Shift 快速穿戴 P${pIdx} -> 装备槽 [${targetKey}]`,
      };
    }

    // 2.4 在宠物或坐骑界面：Shift 快速穿戴伙伴护具
    if (action.screen === 'pet' || action.screen === 'mount') {
      const isPet = action.screen === 'pet';
      const list = isPet ? state.pet.pets : state.mount.mounts;
      const selectedId = isPet ? state.pet.selectedPetId : state.mount.selectedMountId;
      const companion = list.find((c) => c.id === selectedId);
      if (!companion) {
        return {
          state: withToast(state, 'warning', '请先选择一只伙伴！'),
          summary: '未选中伙伴，无法快速穿戴护具',
        };
      }
      if (!isCompanionEquipMatch(action.screen, clickedItem.equipType)) {
        return {
          state: withToast(
            state,
            'error',
            `类型不匹配：该物品不能装配在${isPet ? '宠物' : '坐骑'}装备槽！`
          ),
          summary: `伙伴护具类型校验未通过 (${clickedItem.equipType || 'none'})`,
        };
      }
      const maxEquipSlots = isPet ? state.pet.equipSlotCount : state.mount.equipSlotCount;
      let targetIdx = companion.equipmentSlots
        .slice(0, maxEquipSlots)
        .findIndex((s) => s === null);
      if (targetIdx === -1) targetIdx = 0;
      const oldGear = companion.equipmentSlots[targetIdx];
      companion.equipmentSlots[targetIdx] = { ...clickedItem, amount: 1 };
      inv[pIdx] = oldGear;
      return {
        state: withToast(
          state,
          'success',
          `已为 ${companion.name} 装配 ${clickedItem.name}`
        ),
        summary: `Shift 穿戴伙伴护具 P${pIdx} -> 槽位 #${targetIdx + 1}`,
      };
    }

    // 2.5 在发件箱界面：Shift 快速添加为邮件附件
    if (action.screen === 'mail' && state.mail.activeTab === 'send') {
      const emptyIdx = state.mail.draft.attachments.findIndex((a) => a === null);
      if (emptyIdx === -1) {
        return {
          state: withToast(state, 'warning', '邮件附件槽已满（最多 4 个附件）'),
          summary: '邮件附件槽已满',
        };
      }
      state.mail.draft.attachments[emptyIdx] = clickedItem;
      inv[pIdx] = null;
      return {
        state: withToast(state, 'success', `已添加附件: ${clickedItem.name}`),
        summary: `P${pIdx} 添加至邮件附件槽 #${emptyIdx + 1}`,
      };
    }
  }

  // 左键常规拿放/堆叠/交换
  if (action.click === 'left') {
    if (!cursor && clickedItem) {
      state.player.cursorItem = clickedItem;
      inv[pIdx] = null;
      return { state, summary: `拿起背包 P${pIdx} 物品 ${clickedItem.name}` };
    }
    if (cursor && !clickedItem) {
      inv[pIdx] = cursor;
      state.player.cursorItem = null;
      return { state, summary: `将物品放入背包 P${pIdx}` };
    }
    if (cursor && clickedItem) {
      if (canStackItems(cursor, clickedItem) && clickedItem.amount < clickedItem.maxStack) {
        const space = clickedItem.maxStack - clickedItem.amount;
        const move = Math.min(space, cursor.amount);
        clickedItem.amount += move;
        cursor.amount -= move;
        if (cursor.amount <= 0) state.player.cursorItem = null;
        return { state, summary: `在背包 P${pIdx} 合并堆叠 +${move}` };
      }
      inv[pIdx] = cursor;
      state.player.cursorItem = clickedItem;
      return { state, summary: `交换鼠标物品与背包 P${pIdx}` };
    }
  }

  // 右键拿一半 / 放一个
  if (action.click === 'right') {
    if (!cursor && clickedItem) {
      const half = Math.ceil(clickedItem.amount / 2);
      const remain = clickedItem.amount - half;
      state.player.cursorItem = { ...clickedItem, amount: half };
      inv[pIdx] = remain > 0 ? { ...clickedItem, amount: remain } : null;
      return { state, summary: `右键拆分背包 P${pIdx} 拿起 ${half} 个` };
    }
    if (cursor) {
      if (!clickedItem) {
        inv[pIdx] = { ...cursor, amount: 1 };
        cursor.amount -= 1;
        if (cursor.amount <= 0) state.player.cursorItem = null;
        return { state, summary: `右键向背包 P${pIdx} 放置 1 个物品` };
      }
      if (canStackItems(cursor, clickedItem) && clickedItem.amount < clickedItem.maxStack) {
        clickedItem.amount += 1;
        cursor.amount -= 1;
        if (cursor.amount <= 0) state.player.cursorItem = null;
        return { state, summary: `右键向背包 P${pIdx} 叠加 1 个物品` };
      }
    }
  }

  return { state, summary: `点击背包槽位 P${pIdx}` };
}

/**
 * 辅助：从背包 P0~P35 Shift 快速存入目标仓库（遵守解锁槽位数与总量上限）
 */
function shiftDepositToWarehouse(
  state: ServerState,
  pIdx: number,
  warehouse: ServerState['warehouse'] | NonNullable<ServerState['guild']['guildData']>['warehouse'],
  label: string
): ServerHandleResult {
  const item = state.player.inventory[pIdx];
  if (!item) return { state, summary: '空槽位' };

  const currentStackSum = calculateWarehouseTotalAmount(warehouse.slots, 'stack_sum');
  const availableCap = Math.max(0, warehouse.maxTotalAmount - currentStackSum);
  if (availableCap <= 0) {
    return {
      state: withToast(
        state,
        'error',
        `${label}总数量已达上限 (${warehouse.maxTotalAmount})，无法继续存入！`
      ),
      summary: `${label}超过总数量上限，拒绝放入`,
    };
  }

  const allowedMoveAmount = Math.min(item.amount, availableCap);
  const itemToMove: Item = { ...item, amount: allowedMoveAmount };

  const { nextSlots, remainingAmount } = insertItemIntoSlots(
    warehouse.slots,
    itemToMove,
    warehouse.unlockedCount
  );

  const actuallyMoved = allowedMoveAmount - remainingAmount;
  if (actuallyMoved <= 0) {
    return {
      state: withToast(state, 'error', `${label}已解锁槽位已满，请先解锁更多槽位！`),
      summary: `${label}无可用解锁槽位`,
    };
  }

  warehouse.slots = nextSlots;
  warehouse.totalAmount = calculateWarehouseTotalAmount(nextSlots, 'stack_sum');

  const leftInBag = item.amount - actuallyMoved;
  state.player.inventory[pIdx] =
    leftInBag > 0 ? { ...item, amount: leftInBag } : null;

  if (leftInBag > 0) {
    return {
      state: withToast(
        state,
        'warning',
        `受限于${label}总量上限，已部分存入 ${actuallyMoved} 个，剩余 ${leftInBag} 个留在背包`
      ),
      summary: `Shift 部分存入${label} (${actuallyMoved}/${item.amount})`,
    };
  }

  return {
    state: withToast(state, 'success', `已快速存入${label}: ${item.name} ×${actuallyMoved}`),
    summary: `Shift 快速存入${label} ×${actuallyMoved}`,
  };
}

/**
 * 6.7 玩家仓库交互处理
 */
function handleWarehouseAction(
  state: ServerState,
  action: GuiAction
): ServerHandleResult {
  const wh = state.warehouse;
  const slotNum = typeof action.slot === 'number' ? action.slot : -1;
  const payload = (action.payload || {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  // 1. 第 1 行 (0~6): 分类筛选按钮
  if (slotNum >= 0 && slotNum <= 6) {
    const categories: WarehouseFilterCategory[] = [
      'all',
      'equipment',
      'material',
      'consumable',
      'quest',
      'other',
    ];
    const picked = categories[slotNum] || 'all';
    wh.selectedCategory = picked;
    wh.currentPage = 1;
    return {
      state: withToast(state, 'info', `已筛选仓库分类: ${picked} (页码已重置为 1)`),
      summary: `仓库切换分类 [${picked}]`,
    };
  }

  // 槽位 7: 排序整理
  if (slotNum === 7) {
    const rarityOrder: Record<string, number> = {
      mythic: 6,
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };
    const unlockedItems = wh.slots
      .slice(0, wh.unlockedCount)
      .filter((x): x is Item => x !== null);
    unlockedItems.sort((a, b) => {
      const rDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      if (rDiff !== 0) return rDiff;
      return a.name.localeCompare(b.name);
    });
    const nextSlots: (Item | null)[] = Array.from(
      { length: wh.maxSlots },
      (_, idx) => unlockedItems[idx] || null
    );
    wh.slots = nextSlots;
    wh.currentPage = 1;
    return {
      state: withToast(state, 'success', '已按品质与名称整理已解锁仓库槽位！'),
      summary: '仓库执行排序整理',
    };
  }

  // 槽位 8: 搜索按钮（左键打开输入框，右键清除搜索词）
  if (slotNum === 8) {
    if (action.click === 'right') {
      wh.searchQuery = '';
      wh.currentPage = 1;
      return {
        state: withToast(state, 'info', '已清除仓库搜索关键字'),
        summary: '右键清除仓库搜索词',
      };
    }
    if (typeof payload.inputText === 'string') {
      wh.searchQuery = payload.inputText;
      wh.currentPage = 1;
      state.ui.textInputModal = null;
      return {
        state: withToast(
          state,
          'success',
          wh.searchQuery
            ? `正在搜索包含「${wh.searchQuery}」的仓库物品`
            : '已重置搜索条件'
        ),
        summary: `仓库搜索关键字: "${wh.searchQuery}"`,
      };
    }
    state.ui.textInputModal = {
      title: '§b🔍 搜索仓库物品',
      placeholder: '输入物品名称或 Lore 关键词（如：秘银、龙、圣水）...',
      defaultValue: wh.searchQuery,
      mcSource: 'anvil',
      maxLength: 20,
      targetAction: {
        screen: 'warehouse',
        slot: 8,
        click: 'left',
        payload: { action: 'warehouse_search_submit' },
      },
    };
    return { state, summary: '打开仓库搜索输入框 (AnvilGUI)' };
  }

  // 第 5 行 (36: 上一页, 37: 页码/统计模式切换, 43: 解锁下一槽位, 44: 下一页)
  if (slotNum === 36) {
    if (wh.currentPage > 1) wh.currentPage -= 1;
    return { state, summary: `仓库翻至上一页 (第 ${wh.currentPage} 页)` };
  }

  if (slotNum === 44) {
    const totalPages = Math.max(1, Math.ceil(wh.maxSlots / 27));
    if (wh.currentPage < totalPages) wh.currentPage += 1;
    return { state, summary: `仓库翻至下一页 (第 ${wh.currentPage} 页)` };
  }

  if (slotNum === 37 || payloadAction === 'toggle_capacity_mode') {
    wh.capacityMode = wh.capacityMode === 'stack_sum' ? 'slot_count' : 'stack_sum';
    return {
      state: withToast(
        state,
        'info',
        wh.capacityMode === 'stack_sum'
          ? '已切换为「按物品堆叠总数」统计 (用户确认默认)'
          : '已切换为「按已占用槽位数 / 已解锁槽位」统计'
      ),
      summary: `切换仓库容量统计模式 -> ${wh.capacityMode}`,
    };
  }

  if (slotNum === 43) {
    if (wh.unlockedCount >= wh.maxSlots || !wh.canUnlockPermissions) {
      return {
        state: withToast(state, 'warning', '当前已达最大可解锁槽位上限！'),
        summary: '槽位已满，无法继续解锁',
      };
    }
    if (state.player.gold < wh.unlockCostGold) {
      return {
        state: withToast(
          state,
          'error',
          `金币不足！解锁下一格需要 ${wh.unlockCostGold} 金币`
        ),
        summary: '金币不足无法解锁槽位',
      };
    }
    state.player.gold -= wh.unlockCostGold;
    wh.unlockedCount += 1;
    return {
      state: withToast(
        state,
        'success',
        `消耗 ${wh.unlockCostGold} 金币，成功解锁第 #${wh.unlockedCount} 号仓库槽位！`
      ),
      summary: `解锁仓库槽位 -> ${wh.unlockedCount}/${wh.maxSlots}`,
    };
  }

  // 第 2~4 行 (9~35): 27 个仓库存储槽位
  if (slotNum >= 9 && slotNum <= 35) {
    return handleStorageGridSlotClick(state, wh, slotNum - 9, action, '私人仓库');
  }

  return { state, summary: `点击仓库槽位 ${String(action.slot)}` };
}

/**
 * 通用仓库网格槽位 (0~26 对应容器 9~35) 交互：被玩家仓库与公会仓库共同复用
 */
function handleStorageGridSlotClick(
  state: ServerState,
  wh: ServerState['warehouse'] | NonNullable<ServerState['guild']['guildData']>['warehouse'],
  localIdx: number, // 0 ~ 26
  action: GuiAction,
  label: string,
  pageOverride?: number,
  categoryOverride?: WarehouseFilterCategory,
  searchOverride?: string
): ServerHandleResult {
  const page = pageOverride ?? ('currentPage' in wh ? wh.currentPage : 1);
  const category =
    categoryOverride ?? ('selectedCategory' in wh ? wh.selectedCategory : 'all');
  const searchQuery =
    searchOverride ?? ('searchQuery' in wh ? wh.searchQuery : '');

  const isFiltered = category !== 'all' || searchQuery.trim().length > 0;
  const filteredIndices = getFilteredWarehouseIndices(
    wh.slots,
    wh.unlockedCount,
    wh.maxSlots,
    category,
    searchQuery
  );

  const pageOffset = (page - 1) * 27 + localIdx;
  // 在筛选或搜索状态下：如果有对应筛选结果则指向真实存储索引，否则放入首个空闲已解锁槽位（遵循 6.7 放入规则：放入后仍按真实存储位置保存）
  let realStorageIdx = isFiltered ? filteredIndices[pageOffset] : pageOffset;

  if (realStorageIdx === undefined) {
    // 筛选视图下的空白槽位：若玩家手持物品点击放入，则存入真实仓库第一个空闲已解锁槽位
    const firstEmpty = wh.slots
      .slice(0, wh.unlockedCount)
      .findIndex((s) => s === null);
    if (firstEmpty !== -1 && state.player.cursorItem) {
      realStorageIdx = firstEmpty;
    } else {
      return { state, summary: `${label}筛选视图空槽位` };
    }
  }

  if (realStorageIdx >= wh.unlockedCount) {
    return {
      state: withToast(state, 'error', '该仓库槽位尚未解锁！'),
      summary: `点击未解锁槽位 #${realStorageIdx}`,
    };
  }

  const slotItem = wh.slots[realStorageIdx];
  const cursor = state.player.cursorItem;

  // 数字键 1~9 与玩家快捷栏 P27~P35 交换
  if (action.click === 'number_key') {
    const hotbarOffset = typeof action.payload === 'number' ? action.payload : 0;
    const hotbarIdx = 27 + Math.min(8, Math.max(0, hotbarOffset));
    const hotbarItem = state.player.inventory[hotbarIdx];

    const currentTotal = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
    const netDelta = (hotbarItem?.amount || 0) - (slotItem?.amount || 0);
    if (currentTotal + netDelta > wh.maxTotalAmount) {
      return {
        state: withToast(
          state,
          'error',
          `交换后将超出${label}总量上限 (${wh.maxTotalAmount})，操作已拦截！`
        ),
        summary: `${label}数字键交换超上限拦截`,
      };
    }

    state.player.inventory[hotbarIdx] = slotItem;
    wh.slots[realStorageIdx] = hotbarItem;
    wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
    return {
      state: withToast(state, 'info', `已与快捷栏 #${hotbarOffset + 1} 交换`),
      summary: `${label} #${realStorageIdx} ⇄ 快捷栏 P${hotbarIdx}`,
    };
  }

  // Shift+左键：快速从仓库转移至玩家背包 P0~P35
  if (action.click === 'shift_left' || action.click === 'shift_right') {
    if (!slotItem) return { state, summary: '空仓库槽位' };
    const { nextSlots, remainingAmount } = insertItemIntoSlots(
      state.player.inventory,
      slotItem,
      36
    );
    const moved = slotItem.amount - remainingAmount;
    if (moved <= 0) {
      return {
        state: withToast(state, 'error', '玩家背包已满，无法取出物品！'),
        summary: '玩家背包已满，Shift 取出失败',
      };
    }
    state.player.inventory = nextSlots;
    wh.slots[realStorageIdx] =
      remainingAmount > 0 ? { ...slotItem, amount: remainingAmount } : null;
    wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
    return {
      state: withToast(state, 'success', `已取出至背包: ${slotItem.name} ×${moved}`),
      summary: `Shift 从${label}取出 ${slotItem.name} ×${moved}`,
    };
  }

  // 左键点击仓库槽位
  if (action.click === 'left') {
    if (!cursor && slotItem) {
      state.player.cursorItem = slotItem;
      wh.slots[realStorageIdx] = null;
      wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      return { state, summary: `从${label}拿起 ${slotItem.name}` };
    }
    if (cursor && !slotItem) {
      const currentTotal = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      const availableCap = Math.max(0, wh.maxTotalAmount - currentTotal);
      if (availableCap <= 0) {
        return {
          state: withToast(
            state,
            'error',
            `${label}总数量已达上限 (${wh.maxTotalAmount})，无法放入！`
          ),
          summary: `${label}超总量上限拒绝放入`,
        };
      }
      const putAmount = Math.min(cursor.amount, availableCap);
      wh.slots[realStorageIdx] = { ...cursor, amount: putAmount };
      const left = cursor.amount - putAmount;
      state.player.cursorItem = left > 0 ? { ...cursor, amount: left } : null;
      wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      return {
        state:
          left > 0
            ? withToast(
                state,
                'warning',
                `触发总量上限，已部分放入 ${putAmount} 个，剩余 ${left} 个在鼠标上`
              )
            : state,
        summary: `放入${label}槽位 #${realStorageIdx} (${putAmount}个)`,
      };
    }
    if (cursor && slotItem) {
      if (canStackItems(cursor, slotItem) && slotItem.amount < slotItem.maxStack) {
        const currentTotal = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
        const availableCap = Math.max(0, wh.maxTotalAmount - currentTotal);
        const space = Math.min(slotItem.maxStack - slotItem.amount, availableCap);
        if (space <= 0) {
          return {
            state: withToast(state, 'warning', '已达单格堆叠或仓库总数量上限！'),
            summary: '堆叠受限于上限',
          };
        }
        const add = Math.min(space, cursor.amount);
        slotItem.amount += add;
        cursor.amount -= add;
        if (cursor.amount <= 0) state.player.cursorItem = null;
        wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
        return { state, summary: `${label}槽位 #${realStorageIdx} 合并堆叠 +${add}` };
      }
      // 交换
      const currentTotal = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      const netDelta = cursor.amount - slotItem.amount;
      if (currentTotal + netDelta > wh.maxTotalAmount) {
        return {
          state: withToast(
            state,
            'error',
            `交换后将超过${label}总数量上限 (${wh.maxTotalAmount})！`
          ),
          summary: `${label}交换超量拦截`,
        };
      }
      wh.slots[realStorageIdx] = cursor;
      state.player.cursorItem = slotItem;
      wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      return { state, summary: `交换鼠标物品与${label} #${realStorageIdx}` };
    }
  }

  // 右键点击仓库槽位（拿一半 / 放一个）
  if (action.click === 'right') {
    if (!cursor && slotItem) {
      const half = Math.ceil(slotItem.amount / 2);
      const remain = slotItem.amount - half;
      state.player.cursorItem = { ...slotItem, amount: half };
      wh.slots[realStorageIdx] =
        remain > 0 ? { ...slotItem, amount: remain } : null;
      wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      return { state, summary: `右键从${label}拿起一半 (${half}个)` };
    }
    if (cursor) {
      const currentTotal = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
      if (currentTotal + 1 > wh.maxTotalAmount) {
        return {
          state: withToast(
            state,
            'error',
            `${label}总数量已满 (${wh.maxTotalAmount})，无法放入！`
          ),
          summary: `${label}右键单放超上限拦截`,
        };
      }
      if (!slotItem) {
        wh.slots[realStorageIdx] = { ...cursor, amount: 1 };
        cursor.amount -= 1;
        if (cursor.amount <= 0) state.player.cursorItem = null;
        wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
        return { state, summary: `右键向${label}放置 1 个物品` };
      }
      if (canStackItems(cursor, slotItem) && slotItem.amount < slotItem.maxStack) {
        slotItem.amount += 1;
        cursor.amount -= 1;
        if (cursor.amount <= 0) state.player.cursorItem = null;
        wh.totalAmount = calculateWarehouseTotalAmount(wh.slots, 'stack_sum');
        return { state, summary: `右键向${label}叠加 1 个物品` };
      }
    }
  }

  return { state, summary: `操作${label}槽位 #${realStorageIdx}` };
}

/**
 * 6.1 角色背包 (修改版 + Hub) 交互处理
 */
function handleInventoryHubAction(
  state: ServerState,
  action: GuiAction
): ServerHandleResult {
  const payload = (action.payload || {}) as Record<string, unknown>;
  const equipSlotKey = payload.equipSlot as
    | keyof ServerState['player']['equipment']
    | undefined;

  if (equipSlotKey) {
    const equip = state.player.equipment;
    const currentEquip = equip[equipSlotKey];
    const cursor = state.player.cursorItem;

    // Shift+左键：快速卸下装备到背包 P0~P35
    if (action.click === 'shift_left' || action.click === 'shift_right') {
      if (!currentEquip) return { state, summary: '空装备槽' };
      const { nextSlots, remainingAmount } = insertItemIntoSlots(
        state.player.inventory,
        currentEquip,
        36
      );
      if (remainingAmount > 0) {
        return {
          state: withToast(state, 'error', '背包空间已满，无法卸下该装备！'),
          summary: '背包已满无法卸下装备',
        };
      }
      state.player.inventory = nextSlots;
      equip[equipSlotKey] = null;
      return {
        state: withToast(state, 'info', `已卸下装备: ${currentEquip.name}`),
        summary: `Shift 卸下装备 [${equipSlotKey}]`,
      };
    }

    // 左键穿戴/卸下
    if (!cursor && currentEquip) {
      state.player.cursorItem = currentEquip;
      equip[equipSlotKey] = null;
      return { state, summary: `拿起角色装备 [${equipSlotKey}]` };
    }

    if (cursor) {
      if (!isPlayerEquipSlotMatch(equipSlotKey, cursor.equipType)) {
        return {
          state: withToast(
            state,
            'error',
            `部位不匹配！「${cursor.name}§r」无法穿戴在 [${equipSlotKey}] 槽位！`
          ),
          summary: `装备部位类型校验拦截 (${cursor.equipType || 'none'} -> ${equipSlotKey})`,
        };
      }
      equip[equipSlotKey] = { ...cursor, amount: 1 };
      state.player.cursorItem = currentEquip || null;
      return {
        state: withToast(state, 'success', `成功穿戴装备: ${cursor.name}`),
        summary: `穿戴装备 [${equipSlotKey}]`,
      };
    }
  }

  return { state, summary: `点击角色行囊槽位 ${String(action.slot)}` };
}

/**
 * 6.2 任务视图交互处理
 */
function handleQuestAction(
  state: ServerState,
  action: GuiAction
): ServerHandleResult {
  const qState = state.quest;
  const payload = (action.payload || {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  // 切换任务大分类：页码重置为 1
  if (payloadAction.startsWith('quest_cat:')) {
    const cat = payloadAction.split(':')[1] as QuestCategory;
    qState.selectedCategory = cat;
    qState.currentPage = 1;
    const firstInCat = qState.quests.find((q) => q.category === cat);
    qState.selectedQuestId = firstInCat ? firstInCat.id : null;
    return {
      state: withToast(state, 'info', `已切换任务分类: ${cat} (页码已重置为 1)`),
      summary: `切换任务分类 [${cat}]，页码重置为 1`,
    };
  }

  if (payloadAction === 'page_prev' && qState.currentPage > 1) {
    qState.currentPage -= 1;
    return { state, summary: `任务列表上一页 (${qState.currentPage})` };
  }

  if (payloadAction === 'page_next') {
    qState.currentPage += 1;
    return { state, summary: `任务列表下一页 (${qState.currentPage})` };
  }

  if (payloadAction === 'select_quest' && typeof payload.questId === 'string') {
    qState.selectedQuestId = payload.questId;
    return { state, summary: `选中任务 [${payload.questId}]` };
  }

  const currentQuest = qState.quests.find((q) => q.id === qState.selectedQuestId);
  if (!currentQuest) return { state, summary: '未选中任务' };

  // 接取任务
  if (payloadAction === 'quest_accept' && currentQuest.status === 'available') {
    currentQuest.status = 'in_progress';
    return {
      state: withToast(state, 'success', `已接取任务: ${currentQuest.name}`),
      summary: `接取任务 [${currentQuest.id}]`,
    };
  }

  // 追踪/取消追踪任务
  if (payloadAction === 'quest_track' && currentQuest.trackable) {
    currentQuest.isTracked = !currentQuest.isTracked;
    return {
      state: withToast(
        state,
        'info',
        currentQuest.isTracked
          ? `已在计分板开启追踪: ${currentQuest.name}`
          : `已取消追踪: ${currentQuest.name}`
      ),
      summary: `切换任务追踪状态 -> ${currentQuest.isTracked}`,
    };
  }

  // 放弃任务（需二次确认）
  if (payloadAction === 'quest_abandon' && currentQuest.status === 'in_progress') {
    if (!payload.confirmed) {
      state.ui.confirmDialog = {
        title: '放弃进行中的任务',
        description: [
          `§7确定要放弃任务 ${currentQuest.name} §7吗？`,
          '§c放弃后当前已积累的任务进度将重置归零！',
        ],
        confirmText: '§c确认放弃任务',
        onConfirmAction: action,
      };
      return { state, summary: '弹出放弃任务二次确认窗口' };
    }
    currentQuest.status = 'available';
    currentQuest.isTracked = false;
    currentQuest.objectives.forEach((o) => {
      o.current = 0;
    });
    return {
      state: withToast(state, 'warning', `已放弃任务: ${currentQuest.name}`),
      summary: `确认放弃任务 [${currentQuest.id}]`,
    };
  }

  // 提交并领取任务奖励
  if (payloadAction === 'quest_submit' && currentQuest.status === 'claimable') {
    let tempInv = state.player.inventory;
    for (const reward of currentQuest.rewards) {
      const res = insertItemIntoSlots(tempInv, reward, 36);
      if (res.remainingAmount > 0) {
        return {
          state: withToast(
            state,
            'error',
            '背包空间不足，请先清理背包后再提交任务领取奖励！'
          ),
          summary: '任务提交被拦截：背包已满',
        };
      }
      tempInv = res.nextSlots;
    }
    state.player.inventory = tempInv;
    state.player.gold += currentQuest.rewardGold || 0;
    currentQuest.status = 'completed';
    currentQuest.isTracked = false;
    return {
      state: withToast(
        state,
        'success',
        `任务完成！已发放奖励物品与 ${currentQuest.rewardGold || 0} 金币！`
      ),
      summary: `完成并提交任务 [${currentQuest.id}]`,
    };
  }

  return { state, summary: `点击任务界面槽位 ${String(action.slot)}` };
}

/**
 * 6.3 & 6.4 宠物与坐骑共享交互处理
 */
function handleCompanionAction(
  state: ServerState,
  action: GuiAction,
  mode: 'pet' | 'mount'
): ServerHandleResult {
  const isPet = mode === 'pet';
  const container = isPet ? state.pet : state.mount;
  const list = isPet ? state.pet.pets : state.mount.mounts;
  const selectedId = isPet ? state.pet.selectedPetId : state.mount.selectedMountId;
  const payload = (action.payload || {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  if (payloadAction === 'page_prev' && container.currentPage > 1) {
    container.currentPage -= 1;
    return { state, summary: `${isPet ? '宠物' : '坐骑'}列表上一页` };
  }

  if (payloadAction === 'page_next') {
    container.currentPage += 1;
    return { state, summary: `${isPet ? '宠物' : '坐骑'}列表下一页` };
  }

  if (payloadAction === 'toggle_equip_slot_count') {
    container.equipSlotCount = container.equipSlotCount === 1 ? 3 : 1;
    return {
      state: withToast(
        state,
        'info',
        `已切换${isPet ? '宠物' : '坐骑'}装备槽数量为: ${container.equipSlotCount} 格`
      ),
      summary: `切换伙伴装备槽数量 -> ${container.equipSlotCount}`,
    };
  }

  if (payloadAction === 'select_companion' && typeof payload.companionId === 'string') {
    if (isPet) state.pet.selectedPetId = payload.companionId;
    else state.mount.selectedMountId = payload.companionId;
    return { state, summary: `选中伙伴 [${payload.companionId}]` };
  }

  const current = list.find((c) => c.id === selectedId);
  if (!current) return { state, summary: '未选中伙伴' };

  // 出战/收回 (宠物同时只能出战 1 只；坐骑同时只能骑乘 1 只)
  if (payloadAction === 'companion_toggle_active') {
    const nextActive = !current.isActive;
    if (nextActive) {
      list.forEach((c) => {
        c.isActive = false;
      });
    }
    current.isActive = nextActive;
    return {
      state: withToast(
        state,
        'success',
        nextActive
          ? `${current.name} §a已设为${isPet ? '出战状态' : '当前骑乘'}！`
          : `${current.name} §e已${isPet ? '收回休息' : '解除骑乘'}。`
      ),
      summary: `${isPet ? '宠物出战切换' : '坐骑骑乘切换'}: ${current.name} -> ${nextActive}`,
    };
  }

  // 伙伴装备槽点击穿戴/卸下（带严格类型校验）
  if (payloadAction === 'companion_equip_slot') {
    const equipIdx = typeof payload.equipIdx === 'number' ? payload.equipIdx : 0;
    const currentGear = current.equipmentSlots[equipIdx];
    const cursor = state.player.cursorItem;

    if (!cursor && currentGear) {
      state.player.cursorItem = currentGear;
      current.equipmentSlots[equipIdx] = null;
      return { state, summary: `卸下伙伴装备槽 #${equipIdx + 1}` };
    }

    if (cursor) {
      if (!isCompanionEquipMatch(mode, cursor.equipType)) {
        return {
          state: withToast(
            state,
            'error',
            `装备类型不符！「${cursor.name}§r」不是有效的${isPet ? '灵宠护具' : '坐骑鞍具'}！`
          ),
          summary: `伙伴装备槽类型校验拒绝 (${cursor.equipType || 'none'})`,
        };
      }
      current.equipmentSlots[equipIdx] = { ...cursor, amount: 1 };
      state.player.cursorItem = currentGear || null;
      return {
        state: withToast(state, 'success', `成功为 ${current.name} 装配 ${cursor.name}`),
        summary: `装配伙伴护具 #${equipIdx + 1}`,
      };
    }
  }

  // 喂养升级（优先消耗背包内的灵宠星魂果露，否则消耗 500 金币）
  if (payloadAction === 'companion_feed') {
    const expPotionIdx = state.player.inventory.findIndex(
      (i) => i && i.id === 'potion_pet_exp'
    );
    if (expPotionIdx !== -1) {
      const pot = state.player.inventory[expPotionIdx]!;
      pot.amount -= 1;
      if (pot.amount <= 0) state.player.inventory[expPotionIdx] = null;
    } else if (state.player.gold >= 500) {
      state.player.gold -= 500;
    } else {
      return {
        state: withToast(state, 'error', '缺少「灵宠星魂果露」且金币不足 500！'),
        summary: '喂养失败：材料不足',
      };
    }

    current.exp += 250;
    let leveledUp = false;
    while (current.exp >= current.expToNext) {
      current.exp -= current.expToNext;
      current.level += 1;
      current.expToNext = Math.round(current.expToNext * 1.15);
      leveledUp = true;
      if (current.speed) current.speed += 5;
    }

    return {
      state: withToast(
        state,
        'success',
        leveledUp
          ? `🎉 ${current.name} 升至 Lv.${current.level}！属性大幅提升！`
          : `喂养成功！${current.name} 经验值 +250 (${current.exp}/${current.expToNext})`
      ),
      summary: `喂养伙伴 ${current.name} (+250 EXP)`,
    };
  }

  // 改名（标注铁砧/告示牌输入来源）
  if (payloadAction === 'companion_rename') {
    if (typeof payload.inputText === 'string' && payload.inputText.length > 0) {
      current.name = payload.inputText.startsWith('§')
        ? payload.inputText
        : `§b${payload.inputText}`;
      state.ui.textInputModal = null;
      return {
        state: withToast(state, 'success', `伙伴已更名为: ${current.name}`),
        summary: `伙伴改名 -> ${current.name}`,
      };
    }
    state.ui.textInputModal = {
      title: `§d✏ 修改${isPet ? '灵宠' : '坐骑'}昵称`,
      placeholder: '输入新的伙伴名称（支持 § 颜色码）...',
      defaultValue: current.name,
      mcSource: 'anvil',
      maxLength: 16,
      targetAction: {
        screen: mode,
        slot: action.slot,
        click: 'left',
        payload: { action: 'companion_rename' },
      },
    };
    return { state, summary: '打开伙伴改名输入框 (AnvilGUI)' };
  }

  // 坐骑外观皮肤切换
  if (payloadAction === 'mount_cycle_skin' && current.unlockedSkins?.length) {
    const idx = current.unlockedSkins.indexOf(current.appearance || '');
    const nextSkin =
      current.unlockedSkins[(idx + 1) % current.unlockedSkins.length];
    current.appearance = nextSkin;
    return {
      state: withToast(state, 'info', `已切换坐骑幻化外观: ${nextSkin}`),
      summary: `切换坐骑外观 -> ${nextSkin}`,
    };
  }

  // 放生（二次确认）
  if (payloadAction === 'companion_release') {
    if (!payload.confirmed) {
      state.ui.confirmDialog = {
        title: `放生${isPet ? '灵宠' : '坐骑'}确认`,
        description: [
          `§7确定要永久放生 ${current.name} §7(Lv.${current.level}) 吗？`,
          '§c放生后伙伴将回归自然，穿戴的护具会自动退回背包！',
        ],
        confirmText: '§c确认永久放生',
        onConfirmAction: action,
      };
      return { state, summary: '弹出放生伙伴二次确认窗口' };
    }
    // 退回已穿戴护具
    for (const gear of current.equipmentSlots) {
      if (gear) {
        const res = insertItemIntoSlots(state.player.inventory, gear, 36);
        state.player.inventory = res.nextSlots;
      }
    }
    const nextList = list.filter((c) => c.id !== current.id);
    if (isPet) {
      state.pet.pets = nextList;
      state.pet.selectedPetId = nextList[0]?.id || null;
    } else {
      state.mount.mounts = nextList;
      state.mount.selectedMountId = nextList[0]?.id || null;
    }
    return {
      state: withToast(state, 'warning', `已放生伙伴: ${current.name}`),
      summary: `确认放生伙伴 [${current.id}]`,
    };
  }

  return { state, summary: `点击伙伴界面槽位 ${String(action.slot)}` };
}

/**
 * 6.6 邮箱界面交互处理
 */
function handleMailAction(
  state: ServerState,
  action: GuiAction
): ServerHandleResult {
  const mState = state.mail;
  const payload = (action.payload || {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  // Tab 切换
  if (payloadAction.startsWith('mail_tab:')) {
    const tab = payloadAction.split(':')[1] as MailTab;
    mState.activeTab = tab;
    mState.currentPage = 1;
    if (tab === 'system' || tab === 'player') {
      const first = mState.mails.find((m) => m.type === tab);
      mState.selectedMailId = first ? first.id : null;
    }
    return {
      state: withToast(state, 'info', `已切换邮箱子页面: ${tab}`),
      summary: `切换邮箱 Tab [${tab}]`,
    };
  }

  // 选择邮件（自动标为已读）
  if (payloadAction === 'select_mail' && typeof payload.mailId === 'string') {
    mState.selectedMailId = payload.mailId;
    const target = mState.mails.find((m) => m.id === payload.mailId);
    if (target && !target.expired) {
      target.read = true;
    }
    return { state, summary: `查看邮件 [${payload.mailId}]` };
  }

  // 领取单封邮件附件
  if (payloadAction === 'mail_claim_single') {
    const mail = mState.mails.find((m) => m.id === mState.selectedMailId);
    if (!mail) return { state, summary: '未选中邮件' };
    if (mail.expired) {
      return {
        state: withToast(state, 'error', '该邮件已过期，附件无法领取！'),
        summary: '过期邮件禁止领取附件',
      };
    }
    if (mail.claimed || (mail.attachments.length === 0 && !mail.attachedGold)) {
      return {
        state: withToast(state, 'info', '该邮件没有待领取的附件。'),
        summary: '邮件附件已领或为空',
      };
    }
    let nextInv = state.player.inventory;
    for (const att of mail.attachments) {
      const res = insertItemIntoSlots(nextInv, att, 36);
      if (res.remainingAmount > 0) {
        return {
          state: withToast(
            state,
            'error',
            '背包空间不足！请先清理至少足够的空格后再领取附件！'
          ),
          summary: '领取邮件附件失败：背包空间不足',
        };
      }
      nextInv = res.nextSlots;
    }
    state.player.inventory = nextInv;
    state.player.gold += mail.attachedGold || 0;
    mail.claimed = true;
    mail.read = true;
    return {
      state: withToast(state, 'success', `成功领取邮件「${mail.title}§r」的全部附件！`),
      summary: `领取邮件 [${mail.id}] 附件`,
    };
  }

  // 一键领取当前分类所有未过期附件
  if (payloadAction === 'mail_claim_all') {
    const targetMails = mState.mails.filter(
      (m) =>
        m.type === mState.activeTab &&
        !m.expired &&
        !m.claimed &&
        (m.attachments.length > 0 || (m.attachedGold || 0) > 0)
    );
    if (targetMails.length === 0) {
      return {
        state: withToast(state, 'info', '当前分类下没有可领取的邮件附件'),
        summary: '无可一键领取的邮件',
      };
    }
    let claimedCount = 0;
    let nextInv = state.player.inventory;
    for (const mail of targetMails) {
      let canFitAll = true;
      let tempInv = nextInv;
      for (const att of mail.attachments) {
        const res = insertItemIntoSlots(tempInv, att, 36);
        if (res.remainingAmount > 0) {
          canFitAll = false;
          break;
        }
        tempInv = res.nextSlots;
      }
      if (!canFitAll) {
        state.player.inventory = nextInv;
        return {
          state: withToast(
            state,
            'warning',
            `背包空间已满！已成功领取 ${claimedCount} 封邮件，剩余邮件请清理背包后再领。`
          ),
          summary: `一键领取部分完成 (${claimedCount}封)，背包已满`,
        };
      }
      nextInv = tempInv;
      state.player.gold += mail.attachedGold || 0;
      mail.claimed = true;
      mail.read = true;
      claimedCount++;
    }
    state.player.inventory = nextInv;
    return {
      state: withToast(state, 'success', `一键领取完成！共收取 ${claimedCount} 封邮件附件！`),
      summary: `一键领取 ${claimedCount} 封邮件附件`,
    };
  }

  // 删除当前邮件
  if (payloadAction === 'mail_delete_single') {
    const mail = mState.mails.find((m) => m.id === mState.selectedMailId);
    if (!mail) return { state, summary: '无选中邮件' };
    if (!mail.expired && !mail.claimed && mail.attachments.length > 0) {
      return {
        state: withToast(state, 'warning', '请先领取邮件附件后再删除！'),
        summary: '未领附件邮件禁止直接删除',
      };
    }
    mState.mails = mState.mails.filter((m) => m.id !== mail.id);
    mState.selectedMailId =
      mState.mails.find((m) => m.type === mState.activeTab)?.id || null;
    return {
      state: withToast(state, 'info', '已删除该邮件'),
      summary: `删除邮件 [${mail.id}]`,
    };
  }

  // 批量删除已读邮件（二次确认）
  if (payloadAction === 'mail_delete_read') {
    if (!payload.confirmed) {
      state.ui.confirmDialog = {
        title: '批量删除已读邮件',
        description: [
          '§7确定要清理当前分类下所有「已读且无未领附件/已过期」的邮件吗？',
          '§e未领取的正常附件邮件将被安全保留。',
        ],
        confirmText: '§c确认清理已读',
        onConfirmAction: action,
      };
      return { state, summary: '弹出批量清理已读邮件二次确认' };
    }
    const before = mState.mails.length;
    mState.mails = mState.mails.filter((m) => {
      if (m.type !== mState.activeTab) return true;
      const safeToDelete = m.expired || (m.read && (m.claimed || m.attachments.length === 0));
      return !safeToDelete;
    });
    const removed = before - mState.mails.length;
    mState.selectedMailId =
      mState.mails.find((m) => m.type === mState.activeTab)?.id || null;
    return {
      state: withToast(state, 'success', `已清理 ${removed} 封已读/过期邮件！`),
      summary: `批量删除已读邮件 (${removed}封)`,
    };
  }

  // CDK 兑换相关
  if (payloadAction === 'cdk_open_input') {
    if (typeof payload.inputText === 'string') {
      mState.cdkInput = payload.inputText.toUpperCase();
      state.ui.textInputModal = null;
      return executeCdkRedeem(state, mState.cdkInput);
    }
    state.ui.textInputModal = {
      title: '§6🎁 输入 CDK 兑换码',
      placeholder: '例如: RPG-2026-STAR / VIP-USED-888 / OLD-2024-GIFT',
      defaultValue: mState.cdkInput,
      mcSource: 'anvil',
      maxLength: 24,
      targetAction: {
        screen: 'mail',
        slot: action.slot,
        click: 'left',
        payload: { action: 'cdk_open_input' },
      },
    };
    return { state, summary: '打开 CDK 铁砧输入框 (AnvilGUI)' };
  }

  if (payloadAction === 'cdk_preset' && typeof payload.code === 'string') {
    mState.cdkInput = payload.code;
    return executeCdkRedeem(state, payload.code);
  }

  // 发送邮件相关
  if (payloadAction === 'mail_edit_draft_field') {
    const field = payload.field as 'recipient' | 'title' | 'content';
    if (typeof payload.inputText === 'string') {
      mState.draft[field] = payload.inputText;
      state.ui.textInputModal = null;
      return { state, summary: `更新发件草稿字段 [${field}]` };
    }
    const labels = {
      recipient: '收件人玩家 ID',
      title: '邮件标题',
      content: '邮件正文内容',
    };
    state.ui.textInputModal = {
      title: `§e✉ 编辑${labels[field]}`,
      placeholder: `请输入${labels[field]}...`,
      defaultValue: mState.draft[field],
      mcSource: field === 'content' ? 'chat' : 'anvil',
      maxLength: field === 'content' ? 80 : 24,
      targetAction: {
        screen: 'mail',
        slot: action.slot,
        click: 'left',
        payload: { action: 'mail_edit_draft_field', field },
      },
    };
    return { state, summary: `打开邮件草稿输入框 [${field}]` };
  }

  if (payloadAction === 'mail_draft_attachment') {
    const attIdx = typeof payload.attIdx === 'number' ? payload.attIdx : 0;
    const currentAtt = mState.draft.attachments[attIdx];
    const cursor = state.player.cursorItem;
    if (!cursor && currentAtt) {
      state.player.cursorItem = currentAtt;
      mState.draft.attachments[attIdx] = null;
      return { state, summary: `取下发件草稿附件 #${attIdx + 1}` };
    }
    if (cursor) {
      if (cursor.bindType === 'bind_on_pickup') {
        return {
          state: withToast(state, 'error', '已绑定的物品无法通过玩家邮件邮寄！'),
          summary: '绑定物品禁止邮寄拦截',
        };
      }
      mState.draft.attachments[attIdx] = cursor;
      state.player.cursorItem = currentAtt || null;
      return { state, summary: `放入发件草稿附件 #${attIdx + 1}` };
    }
  }

  if (payloadAction === 'mail_send_submit') {
    const { recipient, title, content, attachments, postage } = mState.draft;
    if (!recipient.trim() || !title.trim() || !content.trim()) {
      return {
        state: withToast(state, 'error', '字段校验失败：收件人、标题与正文均不能为空！'),
        summary: '发件校验失败：必填项为空',
      };
    }
    if (state.player.gold < postage) {
      return {
        state: withToast(state, 'error', `金币不足以支付邮费 (${postage} 金币)！`),
        summary: '发件失败：邮费不足',
      };
    }
    if (!payload.confirmed) {
      const attCount = attachments.filter(Boolean).length;
      state.ui.confirmDialog = {
        title: '确认发送玩家邮件',
        description: [
          `§7收件人: §b${recipient} §7| 邮费: §6${postage} 金币`,
          `§7标题: §f${title}`,
          `§7包含附件数: §e${attCount} 件物品`,
        ],
        confirmText: '§a确认支付邮费并发送',
        onConfirmAction: action,
      };
      return { state, summary: '弹出发送邮件二次确认弹窗' };
    }

    state.player.gold -= postage;
    mState.draft.attachments = [null, null, null, null];
    return {
      state: withToast(
        state,
        'success',
        `邮件已由信使猫头鹰发往「${recipient}」（扣除邮费 ${postage} 金币）！`
      ),
      summary: `成功发送邮件至 ${recipient}`,
    };
  }

  return { state, summary: `点击邮箱槽位 ${String(action.slot)}` };
}

function executeCdkRedeem(state: ServerState, code: string): ServerHandleResult {
  const mState = state.mail;
  const preset = CDK_DATABASE[code.trim().toUpperCase()];
  if (!preset) {
    mState.cdkStatus = 'invalid';
    mState.cdkRewardItems = [];
    mState.cdkMessage = `§c✖ 兑换失败：CDK 兑换码「${code}」无效或不存在！`;
    return {
      state: withToast(state, 'error', 'CDK 兑换失败：无效兑换码'),
      summary: `CDK 兑换结果 -> invalid (${code})`,
    };
  }

  mState.cdkStatus = preset.status;
  mState.cdkRewardItems = preset.rewards;
  mState.cdkMessage = preset.message;

  if (preset.status === 'success') {
    let nextInv = state.player.inventory;
    for (const r of preset.rewards) {
      nextInv = insertItemIntoSlots(nextInv, r, 36).nextSlots;
    }
    state.player.inventory = nextInv;
    return {
      state: withToast(state, 'success', 'CDK 兑换成功！奖励已放入背包！'),
      summary: `CDK 兑换结果 -> success (${code})`,
    };
  }

  return {
    state: withToast(
      state,
      preset.status === 'used' ? 'warning' : 'error',
      preset.message
    ),
    summary: `CDK 兑换结果 -> ${preset.status} (${code})`,
  };
}

/**
 * 6.5 公会界面交互处理
 */
function handleGuildAction(
  state: ServerState,
  action: GuiAction
): ServerHandleResult {
  const gState = state.guild;
  const payload = (action.payload || {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  // 切换模拟职位以验证权限矩阵
  if (payloadAction.startsWith('guild_sim_role:')) {
    const role = payloadAction.split(':')[1] as GuildRole;
    gState.playerRole = role;
    return {
      state: withToast(
        state,
        'info',
        `已切换当前模拟公会职位为: ${role} (UI 按钮已按权限矩阵实时刷新)`
      ),
      summary: `切换公会权限模拟职位 -> [${role}]`,
    };
  }

  // 切换有无公会模式
  if (payloadAction === 'guild_toggle_joined_mode') {
    gState.joined = !gState.joined;
    return {
      state: withToast(
        state,
        'info',
        gState.joined ? '已切换至「已加入公会」视图' : '已切换至「无公会列表/创建」视图'
      ),
      summary: `切换公会入会状态 -> ${gState.joined}`,
    };
  }

  // 未加入公会：搜索、申请加入、创建公会
  if (!gState.joined) {
    if (payloadAction === 'guild_search_list') {
      if (typeof payload.inputText === 'string') {
        gState.searchQuery = payload.inputText;
        state.ui.textInputModal = null;
        return {
          state: withToast(state, 'info', `已筛选公会名称: ${gState.searchQuery || '全部'}`),
          summary: `搜索公会列表: "${gState.searchQuery}"`,
        };
      }
      state.ui.textInputModal = {
        title: '§b🔍 搜索服务器公会',
        placeholder: '输入公会名称或缩写标签 (如 STAR, 商盟)...',
        defaultValue: gState.searchQuery,
        mcSource: 'anvil',
        maxLength: 16,
        targetAction: {
          screen: 'guild',
          slot: action.slot,
          click: 'left',
          payload: { action: 'guild_search_list' },
        },
      };
      return { state, summary: '打开公会搜索输入框' };
    }

    if (payloadAction === 'guild_apply' && typeof payload.guildId === 'string') {
      const target = gState.guildList.find((g) => g.id === payload.guildId);
      if (!target) return { state, summary: '未找到公会' };
      if (target.joinMode === 'closed' || target.memberCount >= target.maxMembers) {
        return {
          state: withToast(state, 'error', '该公会名额已满或暂停招募！'),
          summary: '申请入会遭拒：满员或关闭',
        };
      }
      if (target.joinMode === 'free') {
        gState.joined = true;
        gState.playerRole = 'member';
        return {
          state: withToast(state, 'success', `已自由加入公会「${target.name}」！`),
          summary: `自由加入公会 [${target.name}]`,
        };
      }
      target.applied = true;
      return {
        state: withToast(state, 'success', `已向「${target.name}」发送入会申请，等待管理审批！`),
        summary: `发送入会申请 -> [${target.name}]`,
      };
    }

    if (payloadAction === 'guild_create_new') {
      if (typeof payload.inputText === 'string') {
        const raw = payload.inputText.trim();
        state.ui.textInputModal = null;
        if (raw.length < 2 || raw.length > 12) {
          return {
            state: withToast(state, 'error', '创建失败：公会名称长度需在 2~12 个字符之间！'),
            summary: '创建公会校验失败：名称长度不符',
          };
        }
        if (gState.guildList.some((g) => g.name === raw)) {
          return {
            state: withToast(state, 'error', `创建失败：公会名称「${raw}」已被占用！`),
            summary: '创建公会校验失败：重名拦截',
          };
        }
        if (state.player.gold < 20000) {
          return {
            state: withToast(state, 'error', '创建公会需要 20,000 金币，当前余额不足！'),
            summary: '创建公会失败：金币不足',
          };
        }
        state.player.gold -= 20000;
        gState.joined = true;
        gState.playerRole = 'leader';
        if (gState.guildData) {
          gState.guildData.name = raw;
          gState.guildData.tag = raw.slice(0, 4).toUpperCase();
          gState.guildData.level = 1;
        }
        return {
          state: withToast(state, 'success', `🎉 消耗 20,000 金币，成功创立公会「${raw}」！`),
          summary: `成功创建新公会 [${raw}]`,
        };
      }
      state.ui.textInputModal = {
        title: '§6🏰 创建新公会 (花费 20,000 金币)',
        placeholder: '请输入 2~12 字公会名称（不可与现有公会重名）...',
        defaultValue: '苍穹圣剑同盟',
        mcSource: 'anvil',
        maxLength: 12,
        targetAction: {
          screen: 'guild',
          slot: action.slot,
          click: 'left',
          payload: { action: 'guild_create_new' },
        },
      };
      return { state, summary: '打开创建公会名称输入框' };
    }

    return { state, summary: '点击无公会列表界面' };
  }

  // 已加入公会子页面切换
  if (payloadAction.startsWith('guild_tab:')) {
    const tab = payloadAction.split(':')[1] as GuildTab;
    gState.activeTab = tab;
    gState.currentPage = 1;
    return {
      state: withToast(state, 'info', `已切换公会标签页: ${tab}`),
      summary: `切换公会 Tab -> [${tab}]`,
    };
  }

  const guild = gState.guildData;
  if (!guild) return { state, summary: '无公会数据' };

  // 公会仓库子页面：完全复用仓库交互并增加权限控制
  if (gState.activeTab === 'warehouse') {
    const slotNum = typeof action.slot === 'number' ? action.slot : -1;
    if (slotNum >= 9 && slotNum <= 35) {
      const isPickupAttempt =
        !state.player.cursorItem ||
        action.click === 'shift_left' ||
        action.click === 'shift_right';
      if (isPickupAttempt && !hasGuildPermission(gState.playerRole, 'warehouse_withdraw')) {
        return {
          state: withToast(
            state,
            'error',
            '权限不足：根据公会权限矩阵，「普通成员」仅可存入物资，需精英及以上方可取出！'
          ),
          summary: '公会仓库取出被权限矩阵拦截',
        };
      }
      return handleStorageGridSlotClick(
        state,
        guild.warehouse,
        slotNum - 9,
        action,
        '公会仓库',
        gState.warehousePage,
        gState.warehouseCategory,
        ''
      );
    }

    if (slotNum === 36 && gState.warehousePage > 1) {
      gState.warehousePage -= 1;
      return { state, summary: '公会仓库上一页' };
    }
    if (slotNum === 44) {
      gState.warehousePage += 1;
      return { state, summary: '公会仓库下一页' };
    }
    if (slotNum === 43) {
      if (!hasGuildPermission(gState.playerRole, 'warehouse_unlock')) {
        return {
          state: withToast(state, 'error', '权限不足：仅会长与副会长可扩充公会仓库槽位！'),
          summary: '公会仓库解锁槽位权限不足',
        };
      }
      if (guild.funds < guild.warehouse.unlockCostGold) {
        return {
          state: withToast(state, 'error', '公会资金不足，无法扩充公会仓库！'),
          summary: '公会资金不足',
        };
      }
      guild.funds -= guild.warehouse.unlockCostGold;
      guild.warehouse.unlockedCount += 1;
      return {
        state: withToast(
          state,
          'success',
          `已消耗 ${guild.warehouse.unlockCostGold} 公会资金，扩充至 ${guild.warehouse.unlockedCount} 格！`
        ),
        summary: '解锁公会仓库槽位',
      };
    }
  }

  // 成员选择与升职/降职/踢出/转让会长（均校验权限矩阵并要求二次确认）
  if (payloadAction === 'guild_select_member' && typeof payload.uuid === 'string') {
    gState.selectedMemberUuid = payload.uuid;
    return { state, summary: `选中公会成员 [${payload.uuid}]` };
  }

  if (
    payloadAction === 'guild_member_promote' ||
    payloadAction === 'guild_member_demote' ||
    payloadAction === 'guild_member_kick' ||
    payloadAction === 'guild_member_transfer'
  ) {
    const permMap = {
      guild_member_promote: 'promote_member',
      guild_member_demote: 'demote_member',
      guild_member_kick: 'kick_member',
      guild_member_transfer: 'transfer_leader',
    } as const;
    const permKey = permMap[payloadAction];
    if (!hasGuildPermission(gState.playerRole, permKey)) {
      return {
        state: withToast(state, 'error', '权限不足：您当前的职位无权执行该人事操作！'),
        summary: `公会人事操作 [${permKey}] 被权限矩阵拦截`,
      };
    }

    const member = guild.members.find((m) => m.uuid === gState.selectedMemberUuid);
    if (!member) return { state, summary: '未选中成员' };

    if (!payload.confirmed) {
      const actionNames = {
        guild_member_promote: '晋升成员职位',
        guild_member_demote: '降低成员职位',
        guild_member_kick: '踢出公会成员',
        guild_member_transfer: '转让公会会长',
      };
      state.ui.confirmDialog = {
        title: actionNames[payloadAction],
        description: [
          `§7目标成员: §b${member.name} §7(当前职位: ${member.role})`,
          '§e该操作将立即生效并记录至公会人事日志。',
        ],
        confirmText: '§a确认执行人事变动',
        onConfirmAction: action,
      };
      return { state, summary: `弹出公会人事二次确认 [${payloadAction}]` };
    }

    if (payloadAction === 'guild_member_promote') {
      member.role = member.role === 'member' ? 'elite' : 'vice_leader';
      guild.logs.unshift({
        id: `log_${Date.now()}`,
        time: '刚刚',
        type: 'promote',
        text: `§a${member.name} §7已被晋升为 §6${member.role}`,
      });
      return {
        state: withToast(state, 'success', `已将 ${member.name} 晋升为 ${member.role}！`),
        summary: `晋升成员 ${member.name}`,
      };
    }

    if (payloadAction === 'guild_member_demote') {
      member.role = member.role === 'vice_leader' ? 'elite' : 'member';
      return {
        state: withToast(state, 'info', `已将 ${member.name} 降职为 ${member.role}`),
        summary: `降职成员 ${member.name}`,
      };
    }

    if (payloadAction === 'guild_member_kick') {
      guild.members = guild.members.filter((m) => m.uuid !== member.uuid);
      gState.selectedMemberUuid = guild.members[0]?.uuid || null;
      return {
        state: withToast(state, 'warning', `已将 ${member.name} 移出公会`),
        summary: `踢出成员 ${member.name}`,
      };
    }

    if (payloadAction === 'guild_member_transfer') {
      guild.members.forEach((m) => {
        if (m.role === 'leader') m.role = 'vice_leader';
      });
      member.role = 'leader';
      gState.playerRole = 'vice_leader';
      return {
        state: withToast(state, 'success', `已将会长职位转让给 ${member.name}！`),
        summary: `转让会长 -> ${member.name}`,
      };
    }
  }

  // 申请审批：同意 / 拒绝 / 全部拒绝
  if (
    payloadAction === 'guild_app_approve' ||
    payloadAction === 'guild_app_reject' ||
    payloadAction === 'guild_app_reject_all'
  ) {
    if (!hasGuildPermission(gState.playerRole, 'approve_application')) {
      return {
        state: withToast(state, 'error', '权限不足：无权审批入会申请！'),
        summary: '审批权限不足',
      };
    }
    if (payloadAction === 'guild_app_reject_all') {
      guild.applications = [];
      return {
        state: withToast(state, 'info', '已全部拒绝并清空待审批列表'),
        summary: '全部拒绝入会申请',
      };
    }
    const appUuid = payload.uuid as string;
    const app = guild.applications.find((a) => a.uuid === appUuid);
    if (!app) return { state, summary: '申请记录不存在' };
    guild.applications = guild.applications.filter((a) => a.uuid !== appUuid);
    if (payloadAction === 'guild_app_approve') {
      guild.members.push({
        uuid: app.uuid,
        name: app.name,
        role: 'member',
        level: app.level,
        contribution: 0,
        online: true,
        lastOnline: '当前在线',
      });
      guild.logs.unshift({
        id: `log_${Date.now()}`,
        time: '刚刚',
        type: 'join',
        text: `§a${app.name} §7通过审批加入了公会`,
      });
      return {
        state: withToast(state, 'success', `已批准 ${app.name} 加入公会！`),
        summary: `批准入会 [${app.name}]`,
      };
    }
    return {
      state: withToast(state, 'info', `已拒绝 ${app.name} 的入会申请`),
      summary: `拒绝入会 [${app.name}]`,
    };
  }

  // 公会捐献金币或徽记
  if (payloadAction === 'guild_donate_gold') {
    if (state.player.gold < 5000) {
      return {
        state: withToast(state, 'error', '金币不足 5,000，无法捐献！'),
        summary: '捐献失败：金币不足',
      };
    }
    state.player.gold -= 5000;
    guild.funds += 5000;
    guild.exp = Math.min(guild.expToNext, guild.exp + 500);
    guild.logs.unshift({
      id: `log_${Date.now()}`,
      time: '刚刚',
      type: 'donate',
      text: `§6${state.player.name} §7捐献了 §e5,000 金币 §7(贡献 +50)`,
    });
    return {
      state: withToast(state, 'success', '成功捐献 5,000 金币！获得 +50 公会贡献与 +500 公会经验！'),
      summary: '公会捐献 5,000 金币',
    };
  }

  if (payloadAction === 'guild_donate_item') {
    const tokenIdx = state.player.inventory.findIndex(
      (i) => i && i.id === 'coin_guild_token'
    );
    if (tokenIdx === -1) {
      return {
        state: withToast(state, 'error', '背包中没有「荣耀公会徽记」可供捐献！'),
        summary: '捐献失败：缺少公会徽记',
      };
    }
    const token = state.player.inventory[tokenIdx]!;
    token.amount -= 1;
    if (token.amount <= 0) state.player.inventory[tokenIdx] = null;
    guild.funds += 2000;
    guild.exp = Math.min(guild.expToNext, guild.exp + 300);
    guild.logs.unshift({
      id: `log_${Date.now()}`,
      time: '刚刚',
      type: 'donate',
      text: `§d${state.player.name} §7捐献了 §6荣耀公会徽记 ×1 §7(贡献 +30)`,
    });
    return {
      state: withToast(state, 'success', '已捐献「荣耀公会徽记 ×1」，贡献度 +30！'),
      summary: '捐献荣耀公会徽记 ×1',
    };
  }

  // 公会设置修改
  if (payloadAction === 'guild_edit_notice') {
    if (!hasGuildPermission(gState.playerRole, 'edit_settings')) {
      return {
        state: withToast(state, 'error', '权限不足：仅会长或副会长可修改公会公告！'),
        summary: '修改公告权限不足',
      };
    }
    if (typeof payload.inputText === 'string') {
      guild.notice = payload.inputText;
      state.ui.textInputModal = null;
      return {
        state: withToast(state, 'success', '公会公告已更新！'),
        summary: '更新公会公告',
      };
    }
    state.ui.textInputModal = {
      title: '§e📢 修改公会公告',
      placeholder: '输入新的公会公告内容...',
      defaultValue: guild.notice,
      mcSource: 'sign',
      maxLength: 60,
      targetAction: {
        screen: 'guild',
        slot: action.slot,
        click: 'left',
        payload: { action: 'guild_edit_notice' },
      },
    };
    return { state, summary: '打开公会公告编辑框 (SignGUI)' };
  }

  if (payloadAction === 'guild_cycle_join_mode') {
    if (!hasGuildPermission(gState.playerRole, 'edit_settings')) {
      return {
        state: withToast(state, 'error', '权限不足：无权修改加入方式！'),
        summary: '修改加入方式被拦截',
      };
    }
    const modes: GuildJoinMode[] = ['free', 'approval', 'closed'];
    const next = modes[(modes.indexOf(guild.joinMode) + 1) % modes.length];
    guild.joinMode = next;
    return {
      state: withToast(state, 'info', `公会加入方式已设为: ${next}`),
      summary: `切换公会加入方式 -> ${next}`,
    };
  }

  if (payloadAction === 'guild_cycle_min_level') {
    if (!hasGuildPermission(gState.playerRole, 'edit_settings')) {
      return {
        state: withToast(state, 'error', '权限不足：无权修改等级门槛！'),
        summary: '修改等级门槛被拦截',
      };
    }
    guild.minLevel = guild.minLevel >= 50 ? 10 : guild.minLevel + 10;
    return {
      state: withToast(state, 'info', `入会最低等级门槛已调整为: Lv.${guild.minLevel}`),
      summary: `调整公会等级门槛 -> Lv.${guild.minLevel}`,
    };
  }

  // 退出公会 / 解散公会（二次确认）
  if (payloadAction === 'guild_leave_or_disband') {
    const isLeader = gState.playerRole === 'leader';
    if (!payload.confirmed) {
      state.ui.confirmDialog = {
        title: isLeader ? '永久解散公会' : '主动退出公会',
        description: isLeader
          ? [
              `§c确定要永久解散公会「${guild.name}」吗？`,
              '§7解散后所有公会资金、等级与仓库记录将被清空！',
            ]
          : [
              `§e确定要离开公会「${guild.name}」吗？`,
              '§7退出后您的个人贡献度将进入冻结状态。',
            ],
        confirmText: isLeader ? '§c确认解散公会' : '§e确认退出公会',
        onConfirmAction: action,
      };
      return { state, summary: '弹出退出/解散公会二次确认' };
    }
    gState.joined = false;
    return {
      state: withToast(
        state,
        'warning',
        isLeader ? `已解散公会「${guild.name}」` : `已退出公会「${guild.name}」`
      ),
      summary: isLeader ? '确认解散公会' : '确认退出公会',
    };
  }

  return { state, summary: `点击公会槽位 ${String(action.slot)}` };
}

// ==================== 箱子商店 (Chest Shop) 核心业务逻辑 ====================

/**
 * 计算玩家背包对于特定物品的最大剩余容纳上限
 * 严格遍历 P0~P35 槽位：空槽位按 maxStack 累计，同类未满槽位按差额累计
 */
export function calculateMaxInventoryCapacity(
  inventory: (Item | null)[],
  targetItem: Item
): number {
  let capacity = 0;
  for (let i = 0; i < 36; i++) {
    const slot = inventory[i];
    if (!slot) {
      capacity += targetItem.maxStack;
    } else if (canStackItems(slot, targetItem)) {
      capacity += Math.max(0, targetItem.maxStack - slot.amount);
    }
  }
  return capacity;
}

/**
 * 获取玩家对应货币余额
 */
export function getPlayerCurrencyBalance(
  player: ServerState['player'],
  currency: 'gold' | 'gems' | 'emerald'
): number {
  if (currency === 'gold') return player.gold;
  if (currency === 'gems') return player.gems;
  if (currency === 'emerald') {
    return player.inventory.reduce((sum, item) => {
      if (item && (item.id === 'emerald' || item.id === 'coin_guild_token')) return sum + item.amount;
      return sum;
    }, 0);
  }
  return 0;
}

/**
 * 扣除玩家对应货币
 */
function deductPlayerCurrency(
  player: ServerState['player'],
  currency: 'gold' | 'gems' | 'emerald',
  cost: number
): boolean {
  if (currency === 'gold') {
    if (player.gold < cost) return false;
    player.gold -= cost;
    return true;
  }
  if (currency === 'gems') {
    if (player.gems < cost) return false;
    player.gems -= cost;
    return true;
  }
  if (currency === 'emerald') {
    let remaining = cost;
    for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
      const item = player.inventory[i];
      if (item && (item.id === 'emerald' || item.id === 'coin_guild_token')) {
        const take = Math.min(item.amount, remaining);
        item.amount -= take;
        remaining -= take;
        if (item.amount <= 0) player.inventory[i] = null;
      }
    }
    return remaining === 0;
  }
  return false;
}

/**
 * 商店编辑视角：处理点击玩家背包 P0~P35 进行上架或存入库存
 */
function handleShopEditInventoryClick(
  state: ServerState,
  pIdx: number,
  _action: GuiAction
): ServerHandleResult {
  const inv = state.player.inventory;
  const clickedItem = inv[pIdx];
  const shop = state.chestShop;

  if (!clickedItem) {
    return {
      state: withToast(state, 'info', '空闲背包槽位，请点击有物品的槽位进行上架'),
      summary: `点击背包空槽位 P${pIdx}`,
    };
  }

  // 1. 商店初始为空（待上架）：点击背包内物品尝试上架
  if (!shop.targetItem) {
    const itemName = clickedItem.name;
    const initialStock = clickedItem.amount;
    // 将该物品设定为上架商品
    shop.targetItem = { ...clickedItem, amount: 1 };
    shop.stock = initialStock;
    shop.buyAmount = 1;
    inv[pIdx] = null; // 背包中该组物品已存入商店作为初始库存

    return {
      state: withToast(
        state,
        'success',
        `🎉 成功上架商品: ${itemName}！初始存入 ${initialStock} 件库存，可在上方配置单价与货币类型。`
      ),
      summary: `上架背包物品 [${itemName}] 至箱子商店，初始库存 ${initialStock}`,
    };
  }

  // 2. 商店已存在上架物品：点击同类物品存入库存，点击异类物品提示单一上架限制
  if (canStackItems(clickedItem, shop.targetItem)) {
    const space = Math.max(0, shop.maxStock - shop.stock);
    if (space <= 0) {
      return {
        state: withToast(state, 'warning', `商店库存已满（上限 ${shop.maxStock} 件），无法存入更多！`),
        summary: '商店库存已达容量上限',
      };
    }
    const depositAmount = Math.min(space, clickedItem.amount);
    shop.stock += depositAmount;
    clickedItem.amount -= depositAmount;
    if (clickedItem.amount <= 0) {
      inv[pIdx] = null;
    }
    return {
      state: withToast(
        state,
        'success',
        `已将 ${depositAmount} 个 ${clickedItem.name} 存入商店库存！当前库存: ${shop.stock}/${shop.maxStock}`
      ),
      summary: `背包向商店存入 ${depositAmount} 件 [${clickedItem.name}]，当前总库存 ${shop.stock}`,
    };
  }

  return {
    state: withToast(
      state,
      'warning',
      `箱子商店仅支持单一物品上架！当前已上架「${shop.targetItem.name}」，请先点击下架按钮。`
    ),
    summary: '箱子商店单品上架限制拦截',
  };
}

/**
 * 商店编辑界面 (shop_edit) 容器槽位动作处理
 */
function handleShopEditAction(state: ServerState, action: GuiAction): ServerHandleResult {
  const shop = state.chestShop;
  const payload = (typeof action.payload === 'object' && action.payload ? action.payload : {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  // 1. 切换/选择结算货币
  if (payloadAction === 'shop_switch_currency') {
    const nextCurrency: Record<'gold' | 'gems' | 'emerald', 'gold' | 'gems' | 'emerald'> = {
      gold: 'gems',
      gems: 'emerald',
      emerald: 'gold',
    };
    shop.currency = nextCurrency[shop.currency];
    const labels = { gold: '金币 (🪙 Vault)', gems: '点券 (💎 PlayerPoints)', emerald: '绿宝石 (❇️ 原版货币)' };
    return {
      state: withToast(state, 'info', `已将商店结算货币切换为: ${labels[shop.currency]}`),
      summary: `切换商店货币 -> ${shop.currency}`,
    };
  }

  if (payloadAction === 'shop_set_currency') {
    const currency = payload.currency as 'gold' | 'gems' | 'emerald';
    if (currency) {
      shop.currency = currency;
      const labels = { gold: '金币 (🪙 Vault)', gems: '点券 (💎 PlayerPoints)', emerald: '绿宝石 (❇️ 原版货币)' };
      return {
        state: withToast(state, 'info', `已设置商店结算货币: ${labels[shop.currency]}`),
        summary: `指定商店货币 -> ${shop.currency}`,
      };
    }
  }

  // 2. 调整单价 (+- 按钮)
  if (payloadAction === 'shop_adjust_price') {
    const delta = typeof payload.delta === 'number' ? payload.delta : 0;
    shop.unitPrice = Math.max(1, shop.unitPrice + delta);
    return {
      state: withToast(state, 'info', `已调整单价: ${shop.unitPrice}`),
      summary: `调整商品单价 -> ${shop.unitPrice}`,
    };
  }

  // 3. 直接输入自定义单价 (铁砧弹窗)
  if (payloadAction === 'shop_price_input') {
    if (typeof payload.inputText === 'string') {
      state.ui.textInputModal = null;
      const parsed = parseInt(payload.inputText, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return {
          state: withToast(state, 'error', '请输入大于 0 的有效整数单价！'),
          summary: '单价输入格式非法',
        };
      }
      shop.unitPrice = parsed;
      return {
        state: withToast(state, 'success', `单价已设定为: ${shop.unitPrice}`),
        summary: `自定义单价输入成功 -> ${shop.unitPrice}`,
      };
    }

    state.ui.textInputModal = {
      title: '§e💰 输入商品单件售价',
      placeholder: `当前单价: ${shop.unitPrice}，请输入新单价...`,
      defaultValue: String(shop.unitPrice),
      mcSource: 'anvil',
      maxLength: 10,
      targetAction: {
        screen: 'shop_edit',
        slot: action.slot,
        click: 'left',
        payload: { action: 'shop_price_input' },
      },
    };
    return { state, summary: '打开单价直接输入框' };
  }

  // 4. 直接输入超大库存数量 (铁砧弹窗，比如 300)
  if (payloadAction === 'shop_stock_input') {
    if (typeof payload.inputText === 'string') {
      state.ui.textInputModal = null;
      const parsed = parseInt(payload.inputText, 10);
      if (isNaN(parsed) || parsed < 0) {
        return {
          state: withToast(state, 'error', '请输入大于等于 0 的有效库存数量！'),
          summary: '库存输入格式非法',
        };
      }
      const clamped = Math.min(shop.maxStock, parsed);
      shop.stock = clamped;
      return {
        state: withToast(
          state,
          'success',
          `商店库存已设定为: ${shop.stock}/${shop.maxStock} 件 ${parsed > shop.maxStock ? `(已限制为上限 ${shop.maxStock})` : ''}`
        ),
        summary: `直接设定库存数量 -> ${shop.stock}`,
      };
    }

    state.ui.textInputModal = {
      title: '§b📦 设定商店超大库存数量',
      placeholder: `请输入当前库存件数 (0~${shop.maxStock}，如 300)...`,
      defaultValue: String(shop.stock),
      mcSource: 'anvil',
      maxLength: 8,
      targetAction: {
        screen: 'shop_edit',
        slot: action.slot,
        click: 'left',
        payload: { action: 'shop_stock_input' },
      },
    };
    return { state, summary: '打开库存直接输入框' };
  }

  // 5. 一键设置预设超大库存 (如 300 件)
  if (payloadAction === 'shop_set_stock_quick') {
    const amount = typeof payload.amount === 'number' ? payload.amount : 300;
    shop.stock = Math.min(shop.maxStock, amount);
    return {
      state: withToast(state, 'success', `已一键设定商店库存为 ${shop.stock} 件 (演示超大数量存储)！`),
      summary: `一键快捷设置库存 -> ${shop.stock}`,
    };
  }

  // 6. 从背包存入商品至商店 (+64 或 全部存入)
  if (payloadAction === 'shop_deposit_from_inv') {
    if (!shop.targetItem) {
      return {
        state: withToast(state, 'warning', '请先在下方背包中点击物品完成上架！'),
        summary: '未上架商品无法存入库存',
      };
    }
    const mode = payload.mode === 'all' ? 'all' : 'stack';
    let totalDeposited = 0;
    const inv = state.player.inventory;

    for (let i = 0; i < 36; i++) {
      const item = inv[i];
      if (item && canStackItems(item, shop.targetItem)) {
        const canTake = Math.min(
          shop.maxStock - shop.stock,
          mode === 'all' ? item.amount : Math.min(64 - totalDeposited, item.amount)
        );
        if (canTake > 0) {
          shop.stock += canTake;
          item.amount -= canTake;
          totalDeposited += canTake;
          if (item.amount <= 0) inv[i] = null;
        }
        if (mode !== 'all' && totalDeposited >= 64) break;
        if (shop.stock >= shop.maxStock) break;
      }
    }

    if (totalDeposited === 0) {
      return {
        state: withToast(state, 'warning', `背包内未找到更多同类物品「${shop.targetItem.name}」可供存入`),
        summary: '存入库存未找到同类物品',
      };
    }

    return {
      state: withToast(state, 'success', `已从背包向商店存入 ${totalDeposited} 件物品，现库存: ${shop.stock}/${shop.maxStock}`),
      summary: `从背包存入 ${totalDeposited} 件库存`,
    };
  }

  // 7. 从商店取出库存至玩家背包 (-64 或 全部取出)
  if (payloadAction === 'shop_withdraw_to_inv') {
    if (!shop.targetItem || shop.stock <= 0) {
      return {
        state: withToast(state, 'warning', '当前商店库存为空，无物品可取出！'),
        summary: '库存为空无法取出',
      };
    }
    const mode = payload.mode === 'all' ? 'all' : 'stack';
    const wantWithdraw = mode === 'all' ? shop.stock : Math.min(64, shop.stock);
    const { nextSlots, remainingAmount } = insertItemIntoSlots(
      state.player.inventory,
      { ...shop.targetItem, amount: wantWithdraw }
    );
    const actuallyWithdrawn = wantWithdraw - remainingAmount;
    if (actuallyWithdrawn <= 0) {
      return {
        state: withToast(state, 'error', '背包已满，无法容纳更多物品！'),
        summary: '背包已满取出失败',
      };
    }
    state.player.inventory = nextSlots;
    shop.stock -= actuallyWithdrawn;
    return {
      state: withToast(
        state,
        'info',
        `已将 ${actuallyWithdrawn} 件商品取出至背包，商店剩余库存: ${shop.stock} 件`
      ),
      summary: `从商店取出 ${actuallyWithdrawn} 件至背包`,
    };
  }

  // 8. 下架清空 (退回所有库存到玩家背包)
  if (payloadAction === 'shop_unlist') {
    if (!shop.targetItem) {
      return {
        state: withToast(state, 'info', '当前没有已上架的商品'),
        summary: '空商店无需下架',
      };
    }
    const itemToReturn = shop.targetItem;
    const stockToReturn = shop.stock;
    if (stockToReturn > 0) {
      const { nextSlots, remainingAmount } = insertItemIntoSlots(
        state.player.inventory,
        { ...itemToReturn, amount: stockToReturn }
      );
      state.player.inventory = nextSlots;
      if (remainingAmount > 0) {
        state = withToast(
          state,
          'warning',
          `背包空间不足，${remainingAmount} 件物品未能装入背包，已自动暂存或掉落！`
        );
      }
    }
    shop.targetItem = null;
    shop.stock = 0;
    shop.buyAmount = 1;
    return {
      state: withToast(state, 'warning', `已下架商品「${itemToReturn.name}」并退回库存！`),
      summary: `下架商品 [${itemToReturn.name}]`,
    };
  }

  // 9. 核心展示槽位交互
  if (action.slot === 13 || action.slot === 22) {
    if (action.click === 'right' && shop.targetItem) {
      return handleShopEditAction(state, {
        ...action,
        payload: { action: 'shop_unlist' },
      });
    }
    if (!shop.targetItem) {
      return {
        state: withToast(state, 'info', '💡 请在下方玩家背包 (P0~P35) 中点击任意物品进行上架！'),
        summary: '点击待上架槽位提示操作',
      };
    }
  }

  return { state, summary: `点击商店编辑槽位 ${String(action.slot)}` };
}

/**
 * 玩家购买界面 (shop_buy) 容器槽位动作处理
 */
function handleShopBuyAction(state: ServerState, action: GuiAction): ServerHandleResult {
  const shop = state.chestShop;
  const payload = (typeof action.payload === 'object' && action.payload ? action.payload : {}) as Record<string, unknown>;
  const payloadAction = typeof payload.action === 'string' ? payload.action : '';

  if (!shop.targetItem) {
    return {
      state: withToast(state, 'warning', '店主暂未上架任何商品，无法进行购买！'),
      summary: '商店未上架商品无法购买',
    };
  }

  // 计算玩家背包对于该物品的最大容纳空间
  const maxInventorySpace = calculateMaxInventoryCapacity(state.player.inventory, shop.targetItem);

  // 1. 调整购买数量 (+- 按钮, min, max)
  if (payloadAction === 'shop_buy_adjust_qty') {
    const delta = payload.delta;

    if (maxInventorySpace <= 0) {
      return {
        state: withToast(state, 'error', '背包已满，无法容纳更多该物品！请先清理背包。'),
        summary: '背包已满拦截数量增加',
      };
    }

    let newQty = shop.buyAmount;
    if (delta === 'min') {
      newQty = 1;
    } else if (delta === 'max') {
      newQty = Math.min(shop.stock, maxInventorySpace);
    } else if (typeof delta === 'number') {
      newQty += delta;
    }

    // 关键约束：数量不能超过背包内物品上限，也不能超过商店库存
    if (newQty > maxInventorySpace) {
      shop.buyAmount = Math.max(1, Math.min(shop.stock, maxInventorySpace));
      return {
        state: withToast(
          state,
          'warning',
          `购买数量不能超过背包剩余容纳空间 (${maxInventorySpace} 件)!`
        ),
        summary: `购买数量被背包空间限制为 ${maxInventorySpace}`,
      };
    }

    if (newQty > shop.stock) {
      shop.buyAmount = Math.max(1, shop.stock);
      return {
        state: withToast(
          state,
          'warning',
          `购买数量不能超过商店现有库存 (${shop.stock} 件)!`
        ),
        summary: `购买数量被商店库存限制为 ${shop.stock}`,
      };
    }

    shop.buyAmount = Math.max(1, newQty);
    return {
      state,
      summary: `调整购买数量 -> ${shop.buyAmount}`,
    };
  }

  // 2. 直接编辑数量 (铁砧弹窗输入)
  if (payloadAction === 'shop_buy_qty_input') {
    if (typeof payload.inputText === 'string') {
      state.ui.textInputModal = null;
      const parsed = parseInt(payload.inputText, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return {
          state: withToast(state, 'error', '请输入有效的正整数购买数量！'),
          summary: '购买数量输入非法',
        };
      }

      if (parsed > maxInventorySpace) {
        shop.buyAmount = Math.max(1, Math.min(shop.stock, maxInventorySpace));
        return {
          state: withToast(
            state,
            'warning',
            `输入数量超出背包剩余空间，已限制为背包最大容量: ${maxInventorySpace} 件！`
          ),
          summary: `输入数量超过背包上限限制为 ${maxInventorySpace}`,
        };
      }

      if (parsed > shop.stock) {
        shop.buyAmount = Math.max(1, shop.stock);
        return {
          state: withToast(
            state,
            'warning',
            `输入数量超出商店库存，已限制为商店现有库存: ${shop.stock} 件！`
          ),
          summary: `输入数量超过商店库存限制为 ${shop.stock}`,
        };
      }

      shop.buyAmount = parsed;
      return {
        state: withToast(state, 'success', `已设定拟购买数量为: ${shop.buyAmount} 件`),
        summary: `直接设定购买数量 -> ${shop.buyAmount}`,
      };
    }

    state.ui.textInputModal = {
      title: '§b🛒 输入购买数量',
      placeholder: `当前背包最多可装入: ${maxInventorySpace} 件，请输入...`,
      defaultValue: String(shop.buyAmount),
      mcSource: 'anvil',
      maxLength: 6,
      targetAction: {
        screen: 'shop_buy',
        slot: action.slot,
        click: 'left',
        payload: { action: 'shop_buy_qty_input' },
      },
    };
    return { state, summary: '打开购买数量直接输入框' };
  }

  // 3. 确认购买结算
  if (payloadAction === 'shop_confirm_buy') {
    const buyQty = shop.buyAmount;
    if (buyQty <= 0) {
      return {
        state: withToast(state, 'warning', '请选择至少 1 件购买数量！'),
        summary: '购买数量为0',
      };
    }

    if (shop.stock < buyQty) {
      return {
        state: withToast(state, 'error', `商店库存不足！当前仅剩 ${shop.stock} 件。`),
        summary: '库存不足无法购买',
      };
    }

    if (buyQty > maxInventorySpace) {
      return {
        state: withToast(
          state,
          'error',
          `背包空间不足！背包仅能容纳 ${maxInventorySpace} 件，当前尝试购买 ${buyQty} 件。`
        ),
        summary: '背包空间不足拦截购买',
      };
    }

    const totalCost = buyQty * shop.unitPrice;
    const balance = getPlayerCurrencyBalance(state.player, shop.currency);
    const currencyNames = { gold: '金币', gems: '点券', emerald: '绿宝石' };
    const currencyName = currencyNames[shop.currency];

    if (balance < totalCost) {
      return {
        state: withToast(
          state,
          'error',
          `余额不足！总价需 ${totalCost.toLocaleString()} ${currencyName}，您仅持有 ${balance.toLocaleString()} ${currencyName}。`
        ),
        summary: '货币余额不足拦截购买',
      };
    }

    // 扣除货币
    deductPlayerCurrency(state.player, shop.currency, totalCost);

    // 扣除商店库存
    shop.stock -= buyQty;

    // 将物品按照 64 堆叠规则分配入玩家背包
    const { nextSlots, remainingAmount } = insertItemIntoSlots(
      state.player.inventory,
      { ...shop.targetItem, amount: buyQty }
    );
    state.player.inventory = nextSlots;

    if (remainingAmount > 0) {
      // 容错保护
      shop.stock += remainingAmount;
    }

    // 重置购买数量至有效区间
    shop.buyAmount = Math.max(1, Math.min(shop.stock, calculateMaxInventoryCapacity(state.player.inventory, shop.targetItem)));

    return {
      state: withToast(
        state,
        'success',
        `🎉 购买成功！支付 ${totalCost.toLocaleString()} ${currencyName}，已购得 ${buyQty} 个 ${shop.targetItem.name} 并放入背包！`
      ),
      summary: `玩家购买 [${shop.targetItem.name}] × ${buyQty}，花费 ${totalCost} ${currencyName}`,
    };
  }

  return { state, summary: `点击商店购买槽位 ${String(action.slot)}` };
}
