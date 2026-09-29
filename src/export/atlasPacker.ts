import { AtlasData, GuiAsset } from './types';
import { createPixelCanvas } from './canvasDrawers';

/**
 * 将一组 GuiAsset 打包进一张 Atlas 纹理合图，并生成对应的 JSON 映射文件
 */
export function packAssetsToAtlas(
  assets: GuiAsset[],
  scale = 1,
  transparent = true,
  padding = 2
): AtlasData {
  // 1. 预渲染出所有 Canvas
  const renderedItems = assets.map((asset) => {
    const canvas = asset.render(scale, transparent);
    return {
      asset,
      canvas,
      w: canvas.width,
      h: canvas.height,
    };
  });

  // 按高度从大到小排序以优化打包空间
  renderedItems.sort((a, b) => b.h - a.h);

  // 估算图集宽度 (根据总面积选择合适的尺寸，最小 256)
  const totalArea = renderedItems.reduce((acc, it) => acc + (it.w + padding) * (it.h + padding), 0);
  let atlasWidth = 256;
  if (totalArea > 256 * 256) atlasWidth = 512;
  if (totalArea > 512 * 512) atlasWidth = 1024;
  if (totalArea > 1024 * 1024) atlasWidth = 2048;

  // 简单的 Shelf (货架式) 装箱算法
  let currentX = padding;
  let currentY = padding;
  let shelfHeight = 0;

  const placements: {
    asset: GuiAsset;
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    w: number;
    h: number;
  }[] = [];

  for (const item of renderedItems) {
    if (currentX + item.w + padding > atlasWidth) {
      // 换行
      currentX = padding;
      currentY += shelfHeight + padding;
      shelfHeight = 0;
    }

    placements.push({
      asset: item.asset,
      canvas: item.canvas,
      x: currentX,
      y: currentY,
      w: item.w,
      h: item.h,
    });

    currentX += item.w + padding;
    shelfHeight = Math.max(shelfHeight, item.h);
  }

  const atlasHeight = Math.max(128, currentY + shelfHeight + padding);

  // 创建目标图集 Canvas
  const { canvas: atlasCanvas, ctx } = createPixelCanvas(atlasWidth, atlasHeight, 1);
  if (!transparent) {
    ctx.fillStyle = '#13151f';
    ctx.fillRect(0, 0, atlasWidth, atlasHeight);
  }

  const frames: Record<string, {
    frame: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
    nineSlice?: { left: number; top: number; right: number; bottom: number };
  }> = {};

  for (const p of placements) {
    ctx.drawImage(p.canvas, p.x, p.y);
    frames[p.asset.id] = {
      frame: { x: p.x, y: p.y, w: p.w, h: p.h },
      sourceSize: { w: p.asset.width, h: p.asset.height },
      nineSlice: p.asset.nineSlice,
    };
  }

  return {
    canvas: atlasCanvas,
    json: {
      meta: {
        app: 'MC-RPG UI Kit Asset Exporter',
        version: '1.0.0',
        scale,
        size: { w: atlasWidth, h: atlasHeight },
        format: 'RGBA8888',
      },
      frames,
    },
  };
}
