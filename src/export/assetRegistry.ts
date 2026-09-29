import { ScreenId, ServerState } from '../types';
import {
  renderCleanGuiBackground,
  renderConfirmDialogCanvas,
  renderGuiFrame9Slice,
  renderIconCanvas,
  renderLiveGuiSnapshot,
  renderProgressBarCanvas,
  renderRpgButton,
  renderSlot9Slice,
  renderSlotCanvas,
  renderTabButton,
  renderTooltip9Slice,
} from './canvasDrawers';
import { PIXEL_ICONS } from './pixelIconData';
import { GuiAsset } from './types';

/**
 * 获取指定界面关联的所有物品 ID 与图标
 */
export function getScreenItemIcons(screenId: ScreenId, serverState?: ServerState): string[] {
  const iconSet = new Set<string>();

  // 1. 根据界面添加典型物品图标
  switch (screenId) {
    case 'warehouse':
      iconSet.add('sword_iron');
      iconSet.add('sword_legend');
      iconSet.add('sword_mythic');
      iconSet.add('chest_plate');
      iconSet.add('leggings');
      iconSet.add('boots');
      iconSet.add('potion_hp');
      iconSet.add('potion_mana');
      iconSet.add('gem_star');
      iconSet.add('ore_mythril');
      iconSet.add('scroll_quest');
      iconSet.add('coin_gold');
      iconSet.add('warehouse');
      iconSet.add('sort');
      iconSet.add('search');
      iconSet.add('unlock_plus');
      iconSet.add('arrow_left');
      iconSet.add('arrow_right');
      iconSet.add('lock');
      break;

    case 'inventory':
      iconSet.add('helmet_gold');
      iconSet.add('helmet_iron');
      iconSet.add('chest_plate');
      iconSet.add('leggings');
      iconSet.add('boots');
      iconSet.add('shield');
      iconSet.add('necklace');
      iconSet.add('ring_ruby');
      iconSet.add('ring_sapphire');
      iconSet.add('talisman');
      iconSet.add('scroll_quest');
      iconSet.add('pet_dragon');
      iconSet.add('mount_griffin');
      iconSet.add('banner_guild');
      iconSet.add('warehouse');
      break;

    case 'quest':
      iconSet.add('sword_mythic');
      iconSet.add('scroll_quest');
      iconSet.add('potion_exp');
      iconSet.add('shield');
      iconSet.add('gem_star');
      iconSet.add('book');
      iconSet.add('check_green');
      iconSet.add('cross_red');
      break;

    case 'pet':
      iconSet.add('pet_dragon');
      iconSet.add('pet_fox');
      iconSet.add('pet_slime');
      iconSet.add('pet_owl');
      iconSet.add('pet_collar');
      iconSet.add('pet_claw');
      iconSet.add('pet_charm');
      iconSet.add('potion_exp');
      break;

    case 'mount':
      iconSet.add('mount_griffin');
      iconSet.add('mount_wolf');
      iconSet.add('mount_steed');
      iconSet.add('mount_saddle');
      iconSet.add('mount_barding');
      iconSet.add('mount_spurs');
      break;

    case 'mail':
      iconSet.add('mail_unread');
      iconSet.add('mail_read');
      iconSet.add('gem_star');
      iconSet.add('scroll_quest');
      iconSet.add('coin_gold');
      iconSet.add('check_green');
      iconSet.add('cross_red');
      break;

    case 'guild':
      iconSet.add('banner_guild');
      iconSet.add('helmet_gold');
      iconSet.add('scroll_quest');
      iconSet.add('coin_gold');
      iconSet.add('chest_guild');
      iconSet.add('book');
      iconSet.add('check_green');
      iconSet.add('cross_red');
      break;

    case 'shop_edit':
      iconSet.add('chest_shop');
      iconSet.add('coin_gold');
      iconSet.add('gem_star');
      iconSet.add('emerald');
      iconSet.add('price_tag');
      iconSet.add('plus_qty');
      iconSet.add('minus_qty');
      iconSet.add('check_green');
      iconSet.add('cross_red');
      break;

    case 'shop_buy':
      iconSet.add('cart_buy');
      iconSet.add('coin_gold');
      iconSet.add('gem_star');
      iconSet.add('emerald');
      iconSet.add('chest_gold');
      iconSet.add('plus_qty');
      iconSet.add('minus_qty');
      iconSet.add('check_green');
      break;
  }

  // 2. 如果提供了实时状态，加入玩家背包和仓库内的物品
  if (serverState?.player?.inventory) {
    serverState.player.inventory.forEach((item) => {
      if (item?.icon) iconSet.add(item.icon);
    });
  }

  return Array.from(iconSet);
}

/**
 * 组装某个 GUI (或全套) 的完整组件资产列表
 */
export function buildGuiAssets(screenId: ScreenId, serverState?: ServerState): GuiAsset[] {
  const assets: GuiAsset[] = [];
  const rows = screenId === 'shop_edit' || screenId === 'shop_buy' ? 6 : 5;
  const safeH = 5 + 12 + rows * 18 + 7 + 76 + 5;

  // ==================== 1. GUI 背景与窗口类 ====================
  assets.push({
    id: `gui_bg_${screenId}_clean`,
    name: `GUI 纯净背景贴图 (${screenId})`,
    category: 'background',
    screenId,
    width: 176,
    height: safeH,
    description: `Minecraft 标准 176px 宽度容器背景，含 ${rows} 行容器网格、标题栏与玩家 36 格背包底槽。适合作为游戏容器或材质包皮肤。`,
    tags: ['background', 'clean', 'container', 'skin'],
    render: (scale, transparent) => renderCleanGuiBackground(screenId, rows, scale, transparent),
  });

  if (serverState) {
    assets.push({
      id: `gui_bg_${screenId}_rendered`,
      name: `GUI 游戏运行快照 (${screenId})`,
      category: 'background',
      screenId,
      width: 176,
      height: safeH,
      description: '包含当前界面真实物品槽位、数字堆叠角标、动态标题文字的游戏内完整渲染截图。',
      tags: ['background', 'live', 'snapshot', 'mock'],
      render: (scale) => renderLiveGuiSnapshot(screenId, serverState, scale),
    });
  }

  assets.push({
    id: 'gui_frame_9slice',
    name: 'GUI 容器外框 (9-Slice 九宫格)',
    category: 'background',
    screenId: 'global',
    width: 48,
    height: 48,
    nineSlice: { left: 5, top: 5, right: 5, bottom: 5 },
    description: '可任意拉伸缩放的 9-Slice 容器边框（四角带金色铆钉），边距为 5px。适用于 Unity UI / Godot NinePatchRect。',
    tags: ['9slice', 'frame', 'window', 'modal'],
    render: (scale) => renderGuiFrame9Slice(scale),
  });

  // ==================== 2. 槽位组件 (Slots) ====================
  assets.push({
    id: 'slot_normal',
    name: '标准物品槽 (Normal Slot)',
    category: 'slot',
    screenId: 'global',
    width: 18,
    height: 18,
    description: '18x18px 标准 MC 斜切凹坑物品槽，1px 暗顶边/左边，1px 亮底边/右边。',
    tags: ['slot', 'normal', 'standard'],
    render: (scale, transparent) => renderSlotCanvas('normal', scale, transparent),
  });

  assets.push({
    id: 'slot_hover',
    name: '悬停高亮槽 (Hover Slot)',
    category: 'slot',
    screenId: 'global',
    width: 18,
    height: 18,
    description: '鼠标悬浮时的微亮高亮槽位贴图。',
    tags: ['slot', 'hover', 'highlight'],
    render: (scale, transparent) => renderSlotCanvas('hover', scale, transparent),
  });

  assets.push({
    id: 'slot_selected',
    name: '选中槽位 (Selected Slot)',
    category: 'slot',
    screenId: 'global',
    width: 18,
    height: 18,
    description: '当前被选中的金色内边框槽位。',
    tags: ['slot', 'selected', 'gold'],
    render: (scale, transparent) => renderSlotCanvas('selected', scale, transparent),
  });

  assets.push({
    id: 'slot_locked',
    name: '上锁未解锁槽 (Locked Slot)',
    category: 'slot',
    screenId: 'global',
    width: 18,
    height: 18,
    description: '未解锁槽位，带紫色暗条纹和迷你挂锁标识。',
    tags: ['slot', 'locked', 'padlock'],
    render: (scale, transparent) => renderSlotCanvas('locked', scale, transparent),
  });

  assets.push({
    id: 'slot_disabled',
    name: '禁用槽位 (Disabled Slot)',
    category: 'slot',
    screenId: 'global',
    width: 18,
    height: 18,
    description: '暗色禁用槽位，用于不可放置物品或无效区域。',
    tags: ['slot', 'disabled'],
    render: (scale, transparent) => renderSlotCanvas('disabled', scale, transparent),
  });

  assets.push({
    id: 'slot_9slice',
    name: '槽位九宫格 (Slot 9-Slice)',
    category: 'slot',
    screenId: 'global',
    width: 24,
    height: 24,
    nineSlice: { left: 2, top: 2, right: 2, bottom: 2 },
    description: '可按需自由放大放小的物品槽位九宫格贴图。',
    tags: ['slot', '9slice'],
    render: (scale) => renderSlot9Slice(scale),
  });

  // 装备底槽
  const equipPlaceholders = [
    { id: 'slot_equip_helmet', name: '头盔装备槽 (Helmet)', icon: 'helmet_iron' },
    { id: 'slot_equip_chestplate', name: '胸甲装备槽 (Chestplate)', icon: 'chest_plate' },
    { id: 'slot_equip_leggings', name: '护腿装备槽 (Leggings)', icon: 'leggings' },
    { id: 'slot_equip_boots', name: '靴子装备槽 (Boots)', icon: 'boots' },
    { id: 'slot_equip_shield', name: '副手盾牌槽 (Offhand)', icon: 'shield' },
    { id: 'slot_equip_necklace', name: '项链饰品槽 (Necklace)', icon: 'necklace' },
    { id: 'slot_equip_ring', name: '戒指饰品槽 (Ring)', icon: 'ring_ruby' },
    { id: 'slot_equip_talisman', name: '护符宝物槽 (Talisman)', icon: 'talisman' },
    { id: 'slot_equip_pet_collar', name: '灵宠项圈槽 (Pet Collar)', icon: 'pet_collar' },
    { id: 'slot_equip_mount_saddle', name: '坐骑战鞍槽 (Mount Saddle)', icon: 'mount_saddle' },
  ];

  equipPlaceholders.forEach((eq) => {
    assets.push({
      id: eq.id,
      name: eq.name,
      category: 'slot',
      screenId: 'global',
      width: 18,
      height: 18,
      description: `带透明虚影占位指示的专用装备底槽 (${eq.name})。`,
      tags: ['slot', 'equipment', 'placeholder'],
      render: (scale, transparent) => renderSlotCanvas('normal', scale, transparent, eq.icon),
    });
  });

  // ==================== 3. 按钮与交互控件 (Buttons) ====================
  assets.push({
    id: 'btn_rpg_normal',
    name: 'RPG 按钮 (Normal 状态)',
    category: 'button',
    screenId: 'global',
    width: 64,
    height: 18,
    nineSlice: { left: 3, top: 3, right: 3, bottom: 3 },
    description: '奇幻简约 RPG 风格标准操作按钮（金角点缀）。',
    tags: ['button', 'normal', 'action'],
    render: (scale) => renderRpgButton(64, 18, 'normal', '确认操作', undefined, scale),
  });

  assets.push({
    id: 'btn_rpg_hover',
    name: 'RPG 按钮 (Hover 悬停)',
    category: 'button',
    screenId: 'global',
    width: 64,
    height: 18,
    nineSlice: { left: 3, top: 3, right: 3, bottom: 3 },
    description: '鼠标悬停亮色高光按钮。',
    tags: ['button', 'hover'],
    render: (scale) => renderRpgButton(64, 18, 'hover', '确认操作', undefined, scale),
  });

  assets.push({
    id: 'btn_rpg_active',
    name: 'RPG 按钮 (Active 按下)',
    category: 'button',
    screenId: 'global',
    width: 64,
    height: 18,
    nineSlice: { left: 3, top: 3, right: 3, bottom: 3 },
    description: '按钮被按下的凹陷立体贴图。',
    tags: ['button', 'active', 'pressed'],
    render: (scale) => renderRpgButton(64, 18, 'active', '确认操作', undefined, scale),
  });

  assets.push({
    id: 'btn_rpg_disabled',
    name: 'RPG 按钮 (Disabled 禁用)',
    category: 'button',
    screenId: 'global',
    width: 64,
    height: 18,
    nineSlice: { left: 3, top: 3, right: 3, bottom: 3 },
    description: '禁用不可点击的暗灰色按钮。',
    tags: ['button', 'disabled'],
    render: (scale) => renderRpgButton(64, 18, 'disabled', '不可用', undefined, scale),
  });

  // Tab 按钮
  assets.push({
    id: 'btn_tab_active',
    name: '选项卡 Tab (激活态)',
    category: 'button',
    screenId: 'global',
    width: 32,
    height: 18,
    description: '带金顶亮框的激活状态选项卡切片。',
    tags: ['button', 'tab', 'active'],
    render: (scale) => renderTabButton(true, 32, 18, 'warehouse', scale),
  });

  assets.push({
    id: 'btn_tab_inactive',
    name: '选项卡 Tab (未激活态)',
    category: 'button',
    screenId: 'global',
    width: 32,
    height: 18,
    description: '深暗色未激活选项卡切片。',
    tags: ['button', 'tab', 'inactive'],
    render: (scale) => renderTabButton(false, 32, 18, 'warehouse', scale),
  });

  // 翻页与常用功能按钮
  const functionButtons = [
    { id: 'btn_pager_prev', name: '翻页上一页 (Prev)', icon: 'arrow_left' },
    { id: 'btn_pager_next', name: '翻页下一页 (Next)', icon: 'arrow_right' },
    { id: 'btn_sort', name: '一键整理排序 (Sort)', icon: 'sort' },
    { id: 'btn_search', name: '搜索物品按钮 (Search)', icon: 'search' },
    { id: 'btn_unlock_plus', name: '扩充解锁槽位 (Unlock)', icon: 'unlock_plus' },
    { id: 'btn_confirm_check', name: '绿色对勾确认 (Confirm)', icon: 'check_green' },
    { id: 'btn_cancel_cross', name: '红色叉号取消 (Cancel)', icon: 'cross_red' },
    { id: 'btn_qty_plus', name: '加量按钮 (+1 Qty)', icon: 'plus_qty' },
    { id: 'btn_qty_minus', name: '减量按钮 (-1 Qty)', icon: 'minus_qty' },
    { id: 'btn_price_tag', name: '商品标价标签 (Price Tag)', icon: 'price_tag' },
    { id: 'btn_cart_buy', name: '购物车购买 (Cart Buy)', icon: 'cart_buy' },
  ];

  functionButtons.forEach((btn) => {
    assets.push({
      id: btn.id,
      name: btn.name,
      category: 'button',
      screenId: 'global',
      width: 18,
      height: 18,
      description: `18x18 独立交互按钮图标贴图 (${btn.name})。`,
      tags: ['button', 'icon-button'],
      render: (scale, transparent) => {
        const c = renderSlotCanvas('normal', scale, transparent);
        const ctx = c.getContext('2d')!;
        const iconC = renderIconCanvas(btn.icon, scale, true);
        ctx.drawImage(iconC, Math.round(1 * scale), Math.round(1 * scale));
        return c;
      },
    });
  });

  // ==================== 4. 进度条与计量条 (Progress Bars) ====================
  assets.push({
    id: 'bar_track_empty',
    name: '进度条空底轨 (Bar Track)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '凹陷深黑外框底轨，用于承载生命值、容量、经验或战力进度。',
    tags: ['bar', 'track', 'empty'],
    render: (scale) => renderProgressBarCanvas(90, 10, 0, 'green', scale),
  });

  assets.push({
    id: 'bar_fill_green',
    name: '进度条 (绿色健康/生命 65%)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '绿色生命/健康/正常容量条。',
    tags: ['bar', 'green', 'hp'],
    render: (scale) => renderProgressBarCanvas(90, 10, 65, 'green', scale),
  });

  assets.push({
    id: 'bar_fill_cyan',
    name: '进度条 (青蓝容量/魔力 70%)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '青蓝色仓库堆叠容量条或法力条。',
    tags: ['bar', 'cyan', 'mana', 'capacity'],
    render: (scale) => renderProgressBarCanvas(90, 10, 70, 'cyan', scale),
  });

  assets.push({
    id: 'bar_fill_purple',
    name: '进度条 (紫粉经验值 80%)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '经验值 EXP 升级条或灵宠亲密度条。',
    tags: ['bar', 'purple', 'exp'],
    render: (scale) => renderProgressBarCanvas(90, 10, 80, 'purple', scale),
  });

  assets.push({
    id: 'bar_fill_orange',
    name: '进度条 (橙黄预警 85%)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '容量接近上限 (>75%) 预警橙色填充条。',
    tags: ['bar', 'orange', 'warning'],
    render: (scale) => renderProgressBarCanvas(90, 10, 85, 'orange', scale),
  });

  assets.push({
    id: 'bar_fill_red',
    name: '进度条 (赤红临界 95%)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '容量超负荷或残血 (>90%) 赤红色填充条。',
    tags: ['bar', 'red', 'danger'],
    render: (scale) => renderProgressBarCanvas(90, 10, 95, 'red', scale),
  });

  assets.push({
    id: 'bar_fill_gold',
    name: '进度条 (金色成就/公会 100%)',
    category: 'bar',
    screenId: 'global',
    width: 90,
    height: 10,
    description: '公会建设度或传说成就满溢金色进度条。',
    tags: ['bar', 'gold', 'guild'],
    render: (scale) => renderProgressBarCanvas(90, 10, 100, 'gold', scale),
  });

  // ==================== 5. 弹窗与浮窗组件 (Dialogs & Tooltips) ====================
  assets.push({
    id: 'dialog_confirm_window',
    name: '二次确认弹窗框架 (Confirm Dialog)',
    category: 'dialog',
    screenId: 'global',
    width: 176,
    height: 90,
    description: '3×9 二次确认容器子窗口框架，预置确认与取消槽位。',
    tags: ['dialog', 'modal', 'confirm'],
    render: (scale) => renderConfirmDialogCanvas(scale),
  });

  assets.push({
    id: 'tooltip_frame_9slice',
    name: 'MC 风格 Tooltip 浮窗 (9-Slice)',
    category: 'dialog',
    screenId: 'global',
    width: 32,
    height: 32,
    nineSlice: { left: 4, top: 4, right: 4, bottom: 4 },
    description: 'Minecraft 经典的暗黑紫渐变、亮紫双层内衬悬浮提示框 9-Slice 切片图。',
    tags: ['dialog', 'tooltip', '9slice'],
    render: (scale) => renderTooltip9Slice(scale),
  });

  // ==================== 6. 物品与像素图标 (Icons) ====================
  // 6.1 当前界面专用的所有物品图标
  const currentScreenIcons = getScreenItemIcons(screenId, serverState);
  currentScreenIcons.forEach((iconKey) => {
    const iconDef = PIXEL_ICONS[iconKey];
    if (iconDef) {
      assets.push({
        id: `icon_${iconKey}`,
        name: iconDef.name,
        category: 'icon',
        screenId,
        width: 16,
        height: 16,
        description: `16x16 原创奇幻 RPG 像素图标 (${iconDef.name})。`,
        tags: ['icon', iconDef.category, 'pixel-art', 'item'],
        render: (scale, transparent) => renderIconCanvas(iconKey, scale, transparent),
      });
    }
  });

  return assets;
}

/**
 * 获取系统完整的全量像素图标库 (50+ 项)
 */
export function getAllPixelIconAssets(): GuiAsset[] {
  return Object.entries(PIXEL_ICONS).map(([key, def]) => ({
    id: `icon_${key}`,
    name: def.name,
    category: 'icon',
    screenId: 'global',
    width: 16,
    height: 16,
    description: `16x16 原创奇幻 RPG 像素矢量图标 (${def.name})。`,
    tags: ['icon', def.category, 'pixel-art'],
    render: (scale, transparent) => renderIconCanvas(key, scale, transparent),
  }));
}
