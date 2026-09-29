import { ScreenId, ServerState } from '../types';
import { PIXEL_ICONS, PixelRect } from './pixelIconData';

/**
 * 像素化 Canvas 创建助手
 */
export function createPixelCanvas(w: number, h: number, scale = 1): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/**
 * 绘制单个像素矩形
 */
export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  scale = 1
) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale));
}

/**
 * 绘制带斜切立体边框的像素凹坑/凸起 (MC Bevel)
 */
export function drawPixelBevel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  topColor: string,
  bottomColor: string,
  fillColor: string,
  scale = 1
) {
  // 填充背景
  drawPixelRect(ctx, x, y, w, h, fillColor, scale);

  // 顶边与左边 (1px)
  drawPixelRect(ctx, x, y, w, 1, topColor, scale);
  drawPixelRect(ctx, x, y, 1, h, topColor, scale);

  // 底边与右边 (1px)
  drawPixelRect(ctx, x, y + h - 1, w, 1, bottomColor, scale);
  drawPixelRect(ctx, x + w - 1, y, 1, h, bottomColor, scale);
}

/**
 * 绘制 16x16 像素矢量图标到指定 Canvas 位置
 */
export function drawPixelIconOn(
  ctx: CanvasRenderingContext2D,
  iconKey: string,
  destX: number,
  destY: number,
  size = 16,
  scale = 1
) {
  const iconDef = PIXEL_ICONS[iconKey];
  const rects: PixelRect[] = iconDef?.rects || [
    [2, 2, 12, 12, '#2c314a'],
    [3, 3, 10, 10, '#ffd369'],
    [6, 6, 4, 4, '#ffffff'],
  ];

  const ratio = size / 16;
  for (const [rx, ry, rw, rh, fill] of rects) {
    drawPixelRect(
      ctx,
      destX + rx * ratio,
      destY + ry * ratio,
      rw * ratio,
      rh * ratio,
      fill,
      scale
    );
  }
}

/**
 * 导出独立的 16x16 图标 PNG Canvas
 */
export function renderIconCanvas(iconKey: string, scale = 1, transparent = true): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(16, 16, scale);
  if (!transparent) {
    drawPixelRect(ctx, 0, 0, 16, 16, '#181a26', scale);
  }
  drawPixelIconOn(ctx, iconKey, 0, 0, 16, scale);
  return canvas;
}

/**
 * 绘制 MC 风格 18x18 槽位
 */
export function renderSlotCanvas(
  state: 'normal' | 'hover' | 'selected' | 'disabled' | 'locked' = 'normal',
  scale = 1,
  transparent = false,
  placeholderIcon?: string
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(18, 18, scale);

  if (!transparent) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  let bg = '#1e202d';
  let borderTop = '#10121a';
  let borderBottom = '#494e6b';

  if (state === 'hover') {
    bg = '#383e56';
  } else if (state === 'selected') {
    bg = '#2d3b55';
  } else if (state === 'disabled') {
    bg = '#15161f';
    borderTop = '#0c0d14';
    borderBottom = '#2d3247';
  } else if (state === 'locked') {
    bg = '#191520';
  }

  // 槽位底与凹陷边框
  drawPixelBevel(ctx, 0, 0, 18, 18, borderTop, borderBottom, bg, scale);

  // 内部 16x16 核心微调
  drawPixelRect(ctx, 1, 1, 16, 16, bg, scale);

  if (state === 'hover') {
    // 悬浮高亮内衬
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(Math.round(1 * scale), Math.round(1 * scale), Math.round(16 * scale), Math.round(16 * scale));
  } else if (state === 'selected') {
    // 选中金色内边框
    drawPixelRect(ctx, 1, 1, 16, 1, '#ffd369', scale);
    drawPixelRect(ctx, 1, 16, 16, 1, '#ffd369', scale);
    drawPixelRect(ctx, 1, 1, 1, 16, '#ffd369', scale);
    drawPixelRect(ctx, 16, 1, 1, 16, '#ffd369', scale);
  } else if (state === 'locked') {
    // 斜条纹
    ctx.fillStyle = '#241b2e';
    for (let i = 2; i < 16; i += 3) {
      drawPixelRect(ctx, i, 2, 1, 14, '#241b2e', scale);
    }
    // 绘制锁图标
    drawPixelIconOn(ctx, 'lock', 1, 1, 16, scale);
  }

  if (placeholderIcon && state !== 'locked') {
    ctx.globalAlpha = 0.35;
    drawPixelIconOn(ctx, placeholderIcon, 1, 1, 16, scale);
    ctx.globalAlpha = 1.0;
  }

  return canvas;
}

/**
 * 绘制槽位 9-Slice 切片图 (24x24 px，边距 3px)
 */
export function renderSlot9Slice(scale = 1): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(24, 24, scale);
  // 绘制 24x24 槽位
  drawPixelBevel(ctx, 0, 0, 24, 24, '#10121a', '#494e6b', '#1e202d', scale);
  drawPixelBevel(ctx, 1, 1, 22, 22, '#141622', '#383e58', '#1e202d', scale);
  return canvas;
}

/**
 * 绘制 RPG 通用按钮 (例如 60x18 或 80x20)
 */
export function renderRpgButton(
  w = 64,
  h = 18,
  state: 'normal' | 'hover' | 'active' | 'disabled' = 'normal',
  label = '确认',
  iconKey?: string,
  scale = 1
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(w, h, scale);

  let bg = '#25293d';
  let borderLight = '#5d688f';
  let borderDark = '#12141e';
  let textColor = '#e6e8f0';

  if (state === 'hover') {
    bg = '#373e5c';
    borderLight = '#7b8abf';
    textColor = '#ffffff';
  } else if (state === 'active') {
    bg = '#1d2130';
    borderLight = '#12141e';
    borderDark = '#5d688f';
    textColor = '#ffd369';
  } else if (state === 'disabled') {
    bg = '#181a24';
    borderLight = '#2a2e42';
    borderDark = '#0e0f14';
    textColor = '#616785';
  }

  // 基础边框
  drawPixelBevel(ctx, 0, 0, w, h, borderLight, borderDark, bg, scale);
  // 四角点缀金色或暗角
  const cornerColor = state === 'disabled' ? '#2a2e42' : '#d4a64a';
  drawPixelRect(ctx, 1, 1, 1, 1, cornerColor, scale);
  drawPixelRect(ctx, w - 2, 1, 1, 1, cornerColor, scale);
  drawPixelRect(ctx, 1, h - 2, 1, 1, cornerColor, scale);
  drawPixelRect(ctx, w - 2, h - 2, 1, 1, cornerColor, scale);

  // 文字与图标居中绘制
  ctx.font = `${Math.round(9 * scale)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;

  const contentOffset = state === 'active' ? 1 : 0;
  const centerY = (h / 2 + contentOffset) * scale;

  if (iconKey) {
    const iconX = 4;
    drawPixelIconOn(ctx, iconKey, iconX, 1 + contentOffset, 16, scale);
    ctx.textAlign = 'left';
    ctx.fillText(label, Math.round((22) * scale), Math.round(centerY));
  } else {
    ctx.fillText(label, Math.round((w / 2) * scale), Math.round(centerY));
  }

  return canvas;
}

/**
 * 绘制 Tab 选项卡按钮
 */
export function renderTabButton(
  active = true,
  w = 32,
  h = 18,
  iconKey = 'warehouse',
  scale = 1
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(w, h, scale);

  const bg = active ? '#2d3b55' : '#191c29';
  const borderTop = active ? '#ffd369' : '#3c4363';
  const borderSides = active ? '#5b709c' : '#222638';
  const borderBottom = active ? '#2d3b55' : '#10121c';

  drawPixelRect(ctx, 0, 0, w, h, bg, scale);
  drawPixelRect(ctx, 0, 0, w, 2, borderTop, scale);
  drawPixelRect(ctx, 0, 0, 1, h, borderSides, scale);
  drawPixelRect(ctx, w - 1, 0, 1, h, borderSides, scale);
  drawPixelRect(ctx, 0, h - 1, w, 1, borderBottom, scale);

  if (iconKey) {
    drawPixelIconOn(ctx, iconKey, (w - 16) / 2, 1, 16, scale);
  }

  return canvas;
}

/**
 * 绘制进度条 / 经验条 / 容量条
 */
export function renderProgressBarCanvas(
  w = 90,
  h = 10,
  pct = 65,
  variant: 'green' | 'cyan' | 'purple' | 'orange' | 'red' | 'gold' = 'green',
  scale = 1
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(w, h, scale);

  // 外框背景
  drawPixelBevel(ctx, 0, 0, w, h, '#10121a', '#444a66', '#0d0f17', scale);

  const fillColors = {
    green: ['#22bb55', '#44ff77'],
    cyan: ['#2299cc', '#55ddff'],
    purple: ['#8833cc', '#cc66ff'],
    orange: ['#d47711', '#ffaa22'],
    red: ['#cc2233', '#ff5566'],
    gold: ['#c49015', '#ffd369'],
  };

  const [cDark, cLight] = fillColors[variant] || fillColors.green;
  const fillWidth = Math.round((w - 2) * (pct / 100));

  if (fillWidth > 0) {
    // 进度条填充
    drawPixelRect(ctx, 1, 1, fillWidth, h - 2, cDark, scale);
    drawPixelRect(ctx, 1, 1, fillWidth, 1, cLight, scale);
  }

  // 刻度线 (每 18px 一格)
  for (let x = 18; x < w - 2; x += 18) {
    drawPixelRect(ctx, x, 1, 1, h - 2, 'rgba(0,0,0,0.45)', scale);
  }

  return canvas;
}

/**
 * 绘制完整的 9-Slice GUI 外框 (48x48 模板，边距 6px)
 */
export function renderGuiFrame9Slice(scale = 1): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(48, 48, scale);

  // 背景
  drawPixelRect(ctx, 0, 0, 48, 48, '#252736', scale);

  // 顶边与左边 (2px)
  drawPixelRect(ctx, 0, 0, 48, 2, '#5c6282', scale);
  drawPixelRect(ctx, 0, 0, 2, 48, '#5c6282', scale);

  // 底边与右边 (2px)
  drawPixelRect(ctx, 0, 46, 48, 2, '#151722', scale);
  drawPixelRect(ctx, 46, 0, 2, 48, '#151722', scale);

  // 金色内镶边 (inset 2px, 1px 宽)
  ctx.fillStyle = 'rgba(212, 166, 74, 0.45)';
  ctx.fillRect(Math.round(3 * scale), Math.round(3 * scale), Math.round(42 * scale), Math.round(1 * scale));
  ctx.fillRect(Math.round(3 * scale), Math.round(44 * scale), Math.round(42 * scale), Math.round(1 * scale));
  ctx.fillRect(Math.round(3 * scale), Math.round(3 * scale), Math.round(1 * scale), Math.round(42 * scale));
  ctx.fillRect(Math.round(44 * scale), Math.round(3 * scale), Math.round(1 * scale), Math.round(42 * scale));

  // 四角金色铆钉
  drawPixelRect(ctx, 4, 4, 2, 2, '#ffd369', scale);
  drawPixelRect(ctx, 42, 4, 2, 2, '#ffd369', scale);
  drawPixelRect(ctx, 4, 42, 2, 2, '#ffd369', scale);
  drawPixelRect(ctx, 42, 42, 2, 2, '#ffd369', scale);

  return canvas;
}

/**
 * 绘制完整的 176px 标准宽度容器 GUI 背景贴图 (Clean 无物品版)
 * 对应 Minecraft 风格标准资源包贴图 (如 chest.png / generic_54.png)
 */
export function renderCleanGuiBackground(
  screenId: ScreenId,
  rows = 5,
  scale = 1,
  transparent = false
): HTMLCanvasElement {
  const safeRows = Math.min(6, Math.max(1, rows));
  const w = 176;
  // 顶边框 5 + 标题 12 + 容器网格 rows*18 + 分隔栏 7 + 背包 76 + 底边 5
  const h = 5 + 12 + safeRows * 18 + 7 + 76 + 5;

  const { canvas, ctx } = createPixelCanvas(w, h, scale);

  if (!transparent) {
    // 整体窗体背景
    drawPixelRect(ctx, 0, 0, w, h, '#252736', scale);
  }

  // 外围 2px 立体边框
  drawPixelRect(ctx, 0, 0, w, 2, '#5c6282', scale);
  drawPixelRect(ctx, 0, 0, 2, h, '#5c6282', scale);
  drawPixelRect(ctx, 0, h - 2, w, 2, '#151722', scale);
  drawPixelRect(ctx, w - 2, 0, 2, h, '#151722', scale);

  // 金色精致内衬线
  ctx.fillStyle = 'rgba(212, 166, 74, 0.3)';
  ctx.fillRect(Math.round(2 * scale), Math.round(2 * scale), Math.round((w - 4) * scale), Math.round(1 * scale));
  ctx.fillRect(Math.round(2 * scale), Math.round((h - 3) * scale), Math.round((w - 4) * scale), Math.round(1 * scale));
  ctx.fillRect(Math.round(2 * scale), Math.round(2 * scale), Math.round(1 * scale), Math.round((h - 4) * scale));
  ctx.fillRect(Math.round((w - 3) * scale), Math.round(2 * scale), Math.round(1 * scale), Math.round((h - 4) * scale));

  // 标题栏装饰背景
  drawPixelRect(ctx, 7, 5, 162, 11, '#1b1d28', scale);
  drawPixelRect(ctx, 7, 15, 162, 1, '#32374d', scale);

  // 容器网格区域 (9 列 × safeRows 行)
  const containerStartY = 17;
  const gridStartX = 7;

  // 根据 screenId 绘制特定的槽位布局
  for (let r = 0; r < safeRows; r++) {
    for (let c = 0; c < 9; c++) {
      const slotX = gridStartX + c * 18;
      const slotY = containerStartY + r * 18;
      const slotIndex = r * 9 + c;

      // 特殊界面预设槽位装饰
      let placeholder: string | undefined;
      if (screenId === 'inventory') {
        if (slotIndex === 0) placeholder = 'helmet_iron';
        else if (slotIndex === 9) placeholder = 'chest_plate';
        else if (slotIndex === 18) placeholder = 'leggings';
        else if (slotIndex === 27) placeholder = 'boots';
        else if (slotIndex === 36) placeholder = 'shield';
        else if (slotIndex === 1) placeholder = 'necklace';
        else if (slotIndex === 10) placeholder = 'ring_ruby';
        else if (slotIndex === 19) placeholder = 'ring_sapphire';
        else if (slotIndex === 28) placeholder = 'talisman';
      }

      // 绘制槽位底框
      drawPixelBevel(ctx, slotX, slotY, 18, 18, '#10121a', '#494e6b', '#1e202d', scale);

      if (placeholder) {
        ctx.globalAlpha = 0.25;
        drawPixelIconOn(ctx, placeholder, slotX + 1, slotY + 1, 16, scale);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // 中间分隔栏
  const dividerY = containerStartY + safeRows * 18 + 2;
  drawPixelRect(ctx, 7, dividerY, 162, 2, '#151722', scale);
  drawPixelRect(ctx, 7, dividerY + 2, 162, 1, '#474e6e', scale);

  // 玩家背包区 (3×9 存储槽 + 1×9 快捷栏)
  const invStartY = dividerY + 5;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      const sx = gridStartX + c * 18;
      const sy = invStartY + r * 18;
      drawPixelBevel(ctx, sx, sy, 18, 18, '#10121a', '#494e6b', '#1e202d', scale);
    }
  }

  // 玩家快捷栏 (距存储区 4px 间隙)
  const hotbarY = invStartY + 3 * 18 + 4;
  for (let c = 0; c < 9; c++) {
    const sx = gridStartX + c * 18;
    drawPixelBevel(ctx, sx, hotbarY, 18, 18, '#10121a', '#494e6b', '#1e202d', scale);
  }

  return canvas;
}

/**
 * 绘制带当前游戏状态、真实物品、图标与文本的完整渲染截图
 */
export function renderLiveGuiSnapshot(
  screenId: ScreenId,
  serverState: ServerState,
  scale = 2
): HTMLCanvasElement {
  // 先获得基础背景
  const rows = screenId === 'shop_edit' || screenId === 'shop_buy' ? 6 : 5;
  const bgCanvas = renderCleanGuiBackground(screenId, rows, scale, false);
  const { canvas, ctx } = createPixelCanvas(bgCanvas.width / scale, bgCanvas.height / scale, scale);
  ctx.drawImage(bgCanvas, 0, 0);

  // 绘制标题文字
  ctx.font = `bold ${Math.round(7 * scale)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#ffd369';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const titles: Record<ScreenId, string> = {
    warehouse: '星辰私人仓库 [Warehouse]',
    inventory: '角色行囊与装备 [Inventory Hub]',
    quest: '冒险史诗委托 [Quest Logs]',
    pet: '随从灵宠营地 [Pet Companion]',
    mount: '神兽坐骑厩舍 [Mount Companion]',
    mail: '王国信使驿站 [Mail & CDK]',
    guild: '星耀公会大厅 [Guild Hall]',
    shop_edit: '箱子商店管理 [Chest Shop Edit]',
    shop_buy: '箱子商店选购 [Chest Shop Buy]',
  };
  ctx.fillText(titles[screenId] || screenId, Math.round(9 * scale), Math.round(10.5 * scale));

  // 绘制玩家背包物品 (P0 ~ P35)
  const safeRows = rows;
  const containerStartY = 17;
  const dividerY = containerStartY + safeRows * 18 + 2;
  const invStartY = dividerY + 5;
  const hotbarY = invStartY + 3 * 18 + 4;

  const playerInv = serverState?.player?.inventory || [];
  playerInv.forEach((item, idx) => {
    let sx = 0;
    let sy = 0;
    if (idx < 27) {
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      sx = 7 + c * 18;
      sy = invStartY + r * 18;
    } else if (idx < 36) {
      const c = idx - 27;
      sx = 7 + c * 18;
      sy = hotbarY;
    }

    if (item) {
      drawPixelIconOn(ctx, item.icon, sx + 1, sy + 1, 16, scale);
      if (item.amount > 1) {
        ctx.font = `bold ${Math.round(6 * scale)}px "JetBrains Mono", monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        // 阴影
        ctx.fillStyle = '#11131c';
        ctx.fillText(String(item.amount), Math.round((sx + 17) * scale), Math.round((sy + 18) * scale));
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(item.amount), Math.round((sx + 16.5) * scale), Math.round((sy + 17.5) * scale));
      }
    }
  });

  return canvas;
}

/**
 * 绘制二次确认弹窗底框 (176x90 px)
 */
export function renderConfirmDialogCanvas(scale = 1): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(176, 90, scale);
  drawPixelBevel(ctx, 0, 0, 176, 90, '#5c6282', '#151722', '#252736', scale);

  // 标题
  drawPixelRect(ctx, 7, 5, 162, 12, '#181a26', scale);
  ctx.font = `bold ${Math.round(7 * scale)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#ff5555';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠ 二次确认操作 (Confirm)', Math.round(10 * scale), Math.round(11 * scale));

  // 槽位网格 (3×9)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      const sx = 7 + c * 18;
      const sy = 22 + r * 18;
      const idx = r * 9 + c;

      if (idx === 11) {
        // 确认槽
        drawPixelBevel(ctx, sx, sy, 18, 18, '#10121a', '#44aa44', '#1f3826', scale);
        drawPixelIconOn(ctx, 'check_green', sx + 1, sy + 1, 16, scale);
      } else if (idx === 15) {
        // 取消槽
        drawPixelBevel(ctx, sx, sy, 18, 18, '#10121a', '#aa4444', '#381f26', scale);
        drawPixelIconOn(ctx, 'cross_red', sx + 1, sy + 1, 16, scale);
      } else {
        drawPixelBevel(ctx, sx, sy, 18, 18, '#10121a', '#34384a', '#181a24', scale);
      }
    }
  }

  return canvas;
}

/**
 * 绘制 MC 风格 Tooltip 浮窗 9-Slice (32x32, 边距 4px)
 */
export function renderTooltip9Slice(scale = 1): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas(32, 32, scale);

  // 渐变黑紫色底
  const grad = ctx.createLinearGradient(0, 0, 0, 32 * scale);
  grad.addColorStop(0, '#100010');
  grad.addColorStop(1, '#1b0d2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32 * scale, 32 * scale);

  // 外框 1px 亮紫
  drawPixelRect(ctx, 0, 0, 32, 1, '#5000ff', scale);
  drawPixelRect(ctx, 0, 31, 32, 1, '#28007f', scale);
  drawPixelRect(ctx, 0, 0, 1, 32, '#5000ff', scale);
  drawPixelRect(ctx, 31, 0, 1, 32, '#28007f', scale);

  // 内圈 1px 亮粉
  drawPixelRect(ctx, 1, 1, 30, 1, '#aa00aa', scale);
  drawPixelRect(ctx, 1, 30, 30, 1, '#550055', scale);
  drawPixelRect(ctx, 1, 1, 1, 30, '#aa00aa', scale);
  drawPixelRect(ctx, 30, 1, 1, 30, '#550055', scale);

  return canvas;
}
