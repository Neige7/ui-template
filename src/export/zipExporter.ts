import JSZip from 'jszip';
import { ScreenId, ServerState } from '../types';
import { packAssetsToAtlas } from './atlasPacker';
import { buildGuiAssets, getAllPixelIconAssets } from './assetRegistry';
import { getEngineTemplates } from './engineTemplates';
import { SCREEN_LAYOUTS } from '../docs/portingGuide';

/**
 * 将 Canvas 转换为 Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([]));
    }, 'image/png');
  });
}

/**
 * 触发浏览器文件下载
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 导出单张组件图片为 PNG
 */
export async function downloadSingleAsset(
  renderFn: (scale: number, transparent: boolean) => HTMLCanvasElement,
  filename: string,
  scale = 2,
  transparent = true
) {
  const canvas = renderFn(scale, transparent);
  const blob = await canvasToBlob(canvas);
  triggerDownload(blob, `${filename}.png`);
}

/**
 * 一键打包当前界面的全部游戏组件并下载 ZIP 压缩包
 */
export async function exportCurrentScreenZip(
  screenId: ScreenId,
  serverState?: ServerState,
  options: {
    scale?: 1 | 2 | 3 | 4 | 8;
    transparent?: boolean;
    onProgress?: (percent: number, stepText: string) => void;
  } = {}
) {
  const scale = options.scale || 2;
  const transparent = options.transparent ?? true;
  const { onProgress } = options;

  onProgress?.(5, '正在整理组件清单...');
  const assets = buildGuiAssets(screenId, serverState);
  const zip = new JSZip();

  const rootFolder = zip.folder(`mc_gui_${screenId}_assets`)!;
  const bgFolder = rootFolder.folder('backgrounds')!;
  const nineSliceFolder = rootFolder.folder('nine_slice')!;
  const slotsFolder = rootFolder.folder('slots')!;
  const buttonsFolder = rootFolder.folder('buttons')!;
  const barsFolder = rootFolder.folder('progress_bars')!;
  const itemsFolder = rootFolder.folder('items')!;
  const spritesheetFolder = rootFolder.folder('spritesheet')!;
  const engineFolder = rootFolder.folder('engine_templates')!;

  // 1. 逐个渲染组件并归类写入对应子目录
  const total = assets.length;
  for (let i = 0; i < total; i++) {
    const asset = assets[i];
    onProgress?.(
      Math.round(10 + (i / total) * 50),
      `正在渲染组件贴图: ${asset.name} (${i + 1}/${total})`
    );

    const canvas = asset.render(scale, transparent);
    const blob = await canvasToBlob(canvas);

    if (asset.category === 'background') {
      bgFolder.file(`${asset.id}.png`, blob);
    } else if (asset.nineSlice) {
      nineSliceFolder.file(`${asset.id}.png`, blob);
    } else if (asset.category === 'slot') {
      slotsFolder.file(`${asset.id}.png`, blob);
    } else if (asset.category === 'button') {
      buttonsFolder.file(`${asset.id}.png`, blob);
    } else if (asset.category === 'bar') {
      barsFolder.file(`${asset.id}.png`, blob);
    } else if (asset.category === 'icon') {
      itemsFolder.file(`${asset.id}.png`, blob);
    } else {
      rootFolder.file(`${asset.id}.png`, blob);
    }
  }

  // 2. 生成 SpriteSheet Atlas 合图与 JSON
  onProgress?.(65, '正在生成并打包 SpriteSheet 图集与坐标字典...');
  const atlas = packAssetsToAtlas(assets, scale, transparent);
  const atlasBlob = await canvasToBlob(atlas.canvas);
  spritesheetFolder.file('atlas.png', atlasBlob);
  spritesheetFolder.file('atlas.json', JSON.stringify(atlas.json, null, 2));

  // 3. 写入 9-Slice 切片参数配置
  const sliceSpecs = assets
    .filter((a) => a.nineSlice)
    .map((a) => ({
      id: a.id,
      name: a.name,
      width: a.width,
      height: a.height,
      sliceBorder: a.nineSlice,
    }));
  nineSliceFolder.file('nine_slice_specs.json', JSON.stringify(sliceSpecs, null, 2));

  // 4. 写入引擎配置与模版
  onProgress?.(80, '正在写入各游戏引擎 (Unity/Godot/Minecraft) 适配模板...');
  const templates = getEngineTemplates(screenId);
  engineFolder.file('pack.mcmeta', templates.mcmeta);
  engineFolder.file('trmenu_config.yml', templates.trMenuConfig);
  engineFolder.file('unity_sprite_metadata.json', templates.unityNineSliceJson);
  engineFolder.file('MCGuiSlot.cs', templates.unityCSharpSlotScript);
  engineFolder.file('godot_ninepatch.tscn', templates.godotNinePatchConfig);

  // 5. 写入布局配置与说明书
  rootFolder.file(
    `${screenId}.layout.json`,
    JSON.stringify(SCREEN_LAYOUTS[screenId] || {}, null, 2)
  );
  rootFolder.file('README_GAME_DEVELOPMENT.md', templates.gameDevReadme);

  // 6. 打包输出
  onProgress?.(92, '正在压缩生成 ZIP 文件...');
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(92 + Math.round(metadata.percent * 0.08), `压缩中... ${Math.round(metadata.percent)}%`);
  });

  onProgress?.(100, '打包完成！开始下载...');
  triggerDownload(zipBlob, `mc_gui_${screenId}_assets_x${scale}.zip`);
}

/**
 * 打包导出全部 9 大界面的全量豪华总包 (Master Bundle)
 */
export async function exportAllScreensMasterZip(
  options: {
    scale?: 1 | 2 | 3 | 4 | 8;
    transparent?: boolean;
    onProgress?: (percent: number, stepText: string) => void;
  } = {}
) {
  const scale = options.scale || 2;
  const transparent = options.transparent ?? true;
  const { onProgress } = options;

  const screens: ScreenId[] = [
    'warehouse',
    'inventory',
    'quest',
    'pet',
    'mount',
    'mail',
    'guild',
    'shop_edit',
    'shop_buy',
  ];

  const zip = new JSZip();
  const masterFolder = zip.folder('mc_rpg_all_9_gui_assets')!;
  const allIconsFolder = masterFolder.folder('full_pixel_icon_library')!;

  // 导出全量 50+ 像素图标库
  onProgress?.(5, '正在渲染全量像素图标库...');
  const allIcons = getAllPixelIconAssets();
  for (let i = 0; i < allIcons.length; i++) {
    const icon = allIcons[i];
    const canvas = icon.render(scale, transparent);
    const blob = await canvasToBlob(canvas);
    allIconsFolder.file(`${icon.id}.png`, blob);
  }

  // 逐个界面处理
  for (let sIdx = 0; sIdx < screens.length; sIdx++) {
    const sId = screens[sIdx];
    const pct = 15 + Math.round((sIdx / screens.length) * 70);
    onProgress?.(pct, `正在打包界面 [${sId}] (${sIdx + 1}/${screens.length})...`);

    const screenFolder = masterFolder.folder(`gui_${sId}`)!;
    const assets = buildGuiAssets(sId);

    for (const asset of assets) {
      const canvas = asset.render(scale, transparent);
      const blob = await canvasToBlob(canvas);
      screenFolder.file(`${asset.id}.png`, blob);
    }

    // Atlas
    const atlas = packAssetsToAtlas(assets, scale, transparent);
    const atlasBlob = await canvasToBlob(atlas.canvas);
    screenFolder.file('atlas.png', atlasBlob);
    screenFolder.file('atlas.json', JSON.stringify(atlas.json, null, 2));

    // Layout
    screenFolder.file(
      `${sId}.layout.json`,
      JSON.stringify(SCREEN_LAYOUTS[sId] || {}, null, 2)
    );
  }

  // 说明文档
  masterFolder.file(
    'README_MASTER_BUNDLE.md',
    `# MC-RPG UI Kit 全套 9 大界面全量导出包

本资源包涵盖全部 9 个核心界面的标准容器贴图、槽位九宫格、各状态按钮、进度条及 50+ 像素艺术图标库。
- 缩放倍率: ${scale}x
- 包含界面: ${screens.join(', ')}
- 适用于: Minecraft 原版材质包、Bukkit/Paper 插件菜单、Unity 2D/3D、Godot 4、网页游戏开发。
`
  );

  onProgress?.(90, '正在生成全套总包压缩文件...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, '打包完成！');
  triggerDownload(zipBlob, `mc_rpg_master_assets_all9_x${scale}.zip`);
}
