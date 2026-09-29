import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Layers,
  Copy,
  Check,
  Package,
  FolderArchive,
  Grid,
  Sparkles,
  Maximize2,
  Sliders,
  Shield,
  Palette,
  Eye,
  X,
} from 'lucide-react';
import { ScreenId, ServerState } from '../types';
import { buildGuiAssets } from './assetRegistry';
import { packAssetsToAtlas } from './atlasPacker';
import {
  canvasToBlob,
  downloadSingleAsset,
  exportAllScreensMasterZip,
  exportCurrentScreenZip,
  triggerDownload,
} from './zipExporter';
import { AssetCategory, GuiAsset } from './types';
import { getEngineTemplates } from './engineTemplates';

interface ExportStudioProps {
  currentScreen: ScreenId;
  serverState: ServerState;
  onClose: () => void;
  onSelectScreen?: (screen: ScreenId) => void;
}

const SCREEN_OPTIONS: { id: ScreenId; label: string; sub: string }[] = [
  { id: 'warehouse', label: '6.7 玩家仓库', sub: 'Warehouse' },
  { id: 'inventory', label: '6.1 玩家背包', sub: 'Inventory' },
  { id: 'quest', label: '6.2 任务视图', sub: 'Quest' },
  { id: 'pet', label: '6.3 灵宠界面', sub: 'Pet' },
  { id: 'mount', label: '6.4 坐骑界面', sub: 'Mount' },
  { id: 'mail', label: '6.6 邮箱界面', sub: 'Mail' },
  { id: 'guild', label: '6.5 公会界面', sub: 'Guild' },
  { id: 'shop_edit', label: '6.8 箱子商店管理', sub: 'Shop Edit' },
  { id: 'shop_buy', label: '6.9 箱子商店购买', sub: 'Shop Buy' },
];

export const GuiAssetExportStudio: React.FC<ExportStudioProps> = ({
  currentScreen: initialScreen,
  serverState,
  onClose,
  onSelectScreen,
}) => {
  const [selectedScreen, setSelectedScreen] = useState<ScreenId>(initialScreen);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all' | 'atlas' | 'slicer' | 'guide'>('all');
  const [scale, setScale] = useState<1 | 2 | 3 | 4 | 8>(2);
  const [transparent, setTransparent] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<GuiAsset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 打包导出进度状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ percent: number; text: string }>({
    percent: 0,
    text: '',
  });

  // 获取当前界面所有资产
  const assets = useMemo(() => {
    return buildGuiAssets(selectedScreen, serverState);
  }, [selectedScreen, serverState]);

  // 过滤资产
  const filteredAssets = useMemo(() => {
    let list = assets;
    if (selectedCategory !== 'all' && selectedCategory !== 'atlas' && selectedCategory !== 'slicer' && selectedCategory !== 'guide') {
      list = list.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [assets, selectedCategory, searchQuery]);

  // 生成 Atlas 数据
  const atlasData = useMemo(() => {
    return packAssetsToAtlas(assets, scale, transparent);
  }, [assets, scale, transparent]);

  // 9-Slice 测试切片组件
  const nineSliceAssets = useMemo(() => {
    return assets.filter((a) => a.nineSlice);
  }, [assets]);
  const [selectedSlicerAsset, setSelectedSlicerAsset] = useState<GuiAsset | null>(
    nineSliceAssets[0] || null
  );
  const [slicerTestW, setSlicerTestW] = useState(140);
  const [slicerTestH, setSlicerTestH] = useState(80);

  // 选中资产默认展示第一项
  useEffect(() => {
    if (!selectedAsset && assets.length > 0) {
      setSelectedAsset(assets[0]);
    }
  }, [assets, selectedAsset]);

  // 复制 Base64 / SVG 动作
  const handleCopyDataUrl = async (asset: GuiAsset) => {
    const canvas = asset.render(scale, transparent);
    const dataUrl = canvas.toDataURL('image/png');
    await navigator.clipboard.writeText(dataUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 单个资产直接下载 PNG
  const handleDownloadAsset = (asset: GuiAsset) => {
    downloadSingleAsset(
      (s, t) => asset.render(s, t),
      `${asset.id}_x${scale}`,
      scale,
      transparent
    );
  };

  // 导出 Atlas 合图 + JSON
  const handleDownloadAtlas = async () => {
    const blob = await canvasToBlob(atlasData.canvas);
    triggerDownload(blob, `atlas_${selectedScreen}_x${scale}.png`);

    const jsonBlob = new Blob([JSON.stringify(atlasData.json, null, 2)], {
      type: 'application/json',
    });
    triggerDownload(jsonBlob, `atlas_${selectedScreen}_x${scale}.json`);
  };

  // 导出当前界面 ZIP
  const handleExportCurrentZip = async () => {
    setIsExporting(true);
    try {
      await exportCurrentScreenZip(selectedScreen, serverState, {
        scale,
        transparent,
        onProgress: (percent, text) => {
          setExportProgress({ percent, text });
        },
      });
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  // 导出全量 9 大界面 Master ZIP
  const handleExportAllZip = async () => {
    setIsExporting(true);
    try {
      await exportAllScreensMasterZip({
        scale,
        transparent,
        onProgress: (percent, text) => {
          setExportProgress({ percent, text });
        },
      });
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  // 引擎模板数据
  const templates = useMemo(() => {
    return getEngineTemplates(selectedScreen);
  }, [selectedScreen]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 10, 16, 0.94)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        color: '#e6e9f2',
        fontFamily: 'var(--font-mono)',
        overflow: 'hidden',
      }}
    >
      {/* ================= 顶栏 Header ================= */}
      <header
        style={{
          height: '56px',
          padding: '0 20px',
          borderBottom: '2px solid #293047',
          backgroundColor: '#121522',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              backgroundColor: '#ffd369',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255, 211, 105, 0.35)',
            }}
          >
            <Package size={20} color="#151722" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffd369' }}>
                🎮 GUI 游戏组件与切片导出工坊
              </span>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#27314d',
                  color: '#9db4f0',
                  padding: '2px 7px',
                  borderRadius: '3px',
                }}
              >
                v1.2 · 游戏开发专用
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#8892b3' }}>
              一键提取并导出容器背景、9-Slice 切片、交互槽位、状态按钮与 16×16 原创矢量像素图标
            </div>
          </div>
        </div>

        {/* 顶部右侧：批量下载动作与关闭 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="wb-btn active"
            style={{
              padding: '6px 14px',
              backgroundColor: '#1e6b37',
              borderColor: '#43b364',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={handleExportCurrentZip}
            disabled={isExporting}
          >
            <Download size={14} />
            <span>打包导出当前界面 ZIP</span>
          </button>

          <button
            type="button"
            className="wb-btn"
            style={{
              padding: '6px 12px',
              backgroundColor: '#2d3b66',
              borderColor: '#546aa8',
              color: '#ffd369',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={handleExportAllZip}
            disabled={isExporting}
            title="打包导出全套 9 个GUI界面的全量豪华总包与50+图标库"
          >
            <FolderArchive size={14} />
            <span>导出 9 大界面全量总包</span>
          </button>

          <button
            type="button"
            style={{
              background: '#242a3d',
              border: '1px solid #434c6e',
              color: '#a4b1d9',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: '6px',
            }}
            onClick={onClose}
            title="关闭导出工坊"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ================= 界面切换栏 + 控制器选项 ================= */}
      <div
        style={{
          padding: '8px 20px',
          backgroundColor: '#161928',
          borderBottom: '1px solid #282f45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* 9 个 GUI 界面选择 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          <span style={{ fontSize: '11px', color: '#7e89ab', marginRight: '4px' }}>目标界面:</span>
          {SCREEN_OPTIONS.map((sc) => {
            const isActive = selectedScreen === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                className={`wb-btn ${isActive ? 'active' : ''}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setSelectedScreen(sc.id);
                  onSelectScreen?.(sc.id);
                }}
              >
                {sc.label}
              </button>
            );
          })}
        </div>

        {/* 导出缩放倍率与背景切换 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* 倍率切换 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#7e89ab' }}>分辨率倍率:</span>
            {([1, 2, 3, 4, 8] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`wb-btn ${scale === s ? 'active' : ''}`}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  minWidth: '28px',
                  fontWeight: scale === s ? 700 : 400,
                  cursor: 'pointer',
                }}
                onClick={() => setScale(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* 背景透明度切换 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className={`wb-btn ${transparent ? 'active' : ''}`}
              style={{ padding: '3px 9px', fontSize: '11px', cursor: 'pointer' }}
              onClick={() => setTransparent(true)}
            >
              透明背景 (Alpha PNG)
            </button>
            <button
              type="button"
              className={`wb-btn ${!transparent ? 'active' : ''}`}
              style={{ padding: '3px 9px', fontSize: '11px', cursor: 'pointer' }}
              onClick={() => setTransparent(false)}
            >
              暗夜岩板背景 (#181a26)
            </button>
          </div>
        </div>
      </div>

      {/* ================= 主体工作区 (左侧分类 + 中间画廊 + 右侧检查器) ================= */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr 340px', overflow: 'hidden' }}>
        {/* 左侧：分类导航 */}
        <aside
          style={{
            backgroundColor: '#121522',
            borderRight: '1px solid #242b40',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '11px', color: '#7e89ab', marginBottom: '4px' }}>组件分类</div>

          {[
            { id: 'all', label: `全部组件 (${assets.length})`, icon: Grid },
            { id: 'background', label: `🖼️ 容器背景 (${assets.filter((a) => a.category === 'background').length})`, icon: Layers },
            { id: 'slot', label: `🔲 槽位素材 (${assets.filter((a) => a.category === 'slot').length})`, icon: Shield },
            { id: 'button', label: `🔘 按钮与控件 (${assets.filter((a) => a.category === 'button').length})`, icon: Sliders },
            { id: 'bar', label: `📊 进度条 (${assets.filter((a) => a.category === 'bar').length})`, icon: Palette },
            { id: 'icon', label: `🗡️ 物品与图标 (${assets.filter((a) => a.category === 'icon').length})`, icon: Sparkles },
            { id: 'dialog', label: `💬 弹窗与浮窗 (${assets.filter((a) => a.category === 'dialog').length})`, icon: Maximize2 },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`wb-btn ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: 'flex-start',
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedCategory(cat.id as any)}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}

          <div style={{ height: '1px', backgroundColor: '#22283d', margin: '10px 0' }} />

          <div style={{ fontSize: '11px', color: '#7e89ab', marginBottom: '4px' }}>高级工具</div>

          <button
            type="button"
            className={`wb-btn ${selectedCategory === 'atlas' ? 'active' : ''}`}
            style={{
              justifyContent: 'flex-start',
              padding: '7px 10px',
              fontSize: '11.5px',
              color: '#ffd369',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedCategory('atlas')}
          >
            🗺️ SpriteSheet 图集生成器
          </button>

          <button
            type="button"
            className={`wb-btn ${selectedCategory === 'slicer' ? 'active' : ''}`}
            style={{
              justifyContent: 'flex-start',
              padding: '7px 10px',
              fontSize: '11.5px',
              color: '#55ffff',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedCategory('slicer')}
          >
            📐 9-Slice 交互切片调试
          </button>

          <button
            type="button"
            className={`wb-btn ${selectedCategory === 'guide' ? 'active' : ''}`}
            style={{
              justifyContent: 'flex-start',
              padding: '7px 10px',
              fontSize: '11.5px',
              color: '#55ff55',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedCategory('guide')}
          >
            ⚙️ 游戏引擎接入模版
          </button>
        </aside>

        {/* 中间：画廊展示区 */}
        <main
          style={{
            backgroundColor: '#0c0e17',
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* ================= 模式 1: 普通组件栅格视图 ================= */}
          {selectedCategory !== 'atlas' && selectedCategory !== 'slicer' && selectedCategory !== 'guide' && (
            <>
              {/* 搜索过滤与统计 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="按名称、ID 或标签搜索组件 (如 sword, 9slice, slot)..."
                    style={{
                      width: '320px',
                      padding: '6px 12px',
                      backgroundColor: '#161928',
                      border: '1px solid #2e3752',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="wb-btn"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => setSearchQuery('')}
                    >
                      清空
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '11.5px', color: '#8b97bc' }}>
                  展示 <span style={{ color: '#ffd369', fontWeight: 700 }}>{filteredAssets.length}</span> 个可导出游戏组件 (当前缩放: {scale}x)
                </div>
              </div>

              {/* 卡片栅格 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '12px',
                }}
              >
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const previewScale = Math.min(scale, asset.width > 100 ? 1 : 3);

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        backgroundColor: isSelected ? '#1f2538' : '#141724',
                        border: isSelected ? '2px solid #ffd369' : '1px solid #262c3f',
                        borderRadius: '4px',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'border-color 0.15s ease, background 0.15s ease',
                      }}
                    >
                      {/* 卡片头部 */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: isSelected ? '#ffd369' : '#e0e4f2',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={asset.name}
                        >
                          {asset.name}
                        </span>
                        {asset.nineSlice && (
                          <span
                            style={{
                              fontSize: '9px',
                              backgroundColor: '#352345',
                              border: '1px solid #7c48a8',
                              color: '#ff99ff',
                              padding: '1px 4px',
                              borderRadius: '2px',
                            }}
                          >
                            9-Slice
                          </span>
                        )}
                      </div>

                      {/* 贴图预览框 (棋盘格透明背景) */}
                      <div
                        style={{
                          height: '110px',
                          backgroundColor: '#0a0b12',
                          backgroundImage:
                            'linear-gradient(45deg, #121522 25%, transparent 25%), linear-gradient(-45deg, #121522 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #121522 75%), linear-gradient(-45deg, transparent 75%, #121522 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                          border: '1px solid #202538',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <AssetCanvasPreview
                          asset={asset}
                          scale={previewScale}
                          transparent={transparent}
                        />

                        {/* 尺寸标签 */}
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '3px',
                            right: '5px',
                            fontSize: '9.5px',
                            color: '#9aa5c4',
                            backgroundColor: 'rgba(12, 14, 22, 0.85)',
                            padding: '1px 5px',
                            borderRadius: '2px',
                          }}
                        >
                          {asset.width}×{asset.height}
                        </span>
                      </div>

                      {/* 卡片底部操作按钮 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="wb-btn"
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: '11px',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAsset(asset);
                          }}
                        >
                          <Download size={12} />
                          <span>下载 PNG</span>
                        </button>

                        <button
                          type="button"
                          className="wb-btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDataUrl(asset);
                          }}
                          title="复制 Base64 DataURL"
                        >
                          {copiedId === asset.id ? <Check size={12} color="#55ff55" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ================= 模式 2: SpriteSheet Atlas 合图预览 ================= */}
          {selectedCategory === 'atlas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#161928',
                  border: '1px solid #2e3752',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffd369' }}>
                    🗺️ 自动打包生成的 SpriteSheet 纹理图集
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b97bc', marginTop: '2px' }}>
                    已将当前界面的 {assets.length} 个独立组件整合成一张高清纹理图集，附带 JSON 坐标映射字典。
                  </div>
                </div>

                <button
                  type="button"
                  className="wb-btn active"
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#1e6b37',
                    borderColor: '#43b364',
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={handleDownloadAtlas}
                >
                  <Download size={14} />
                  <span>下载 Atlas 图集与 JSON</span>
                </button>
              </div>

              {/* Atlas 画布预览 */}
              <div
                style={{
                  backgroundColor: '#0a0b12',
                  backgroundImage:
                    'linear-gradient(45deg, #121522 25%, transparent 25%), linear-gradient(-45deg, #121522 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #121522 75%), linear-gradient(-45deg, transparent 75%, #121522 75%)',
                  backgroundSize: '16px 16px',
                  border: '2px solid #2b334d',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflowX: 'auto',
                }}
              >
                <div style={{ boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
                  <img
                    src={atlasData.canvas.toDataURL()}
                    alt="Packed Atlas"
                    style={{
                      display: 'block',
                      imageRendering: 'pixelated',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Atlas 坐标字典预览 */}
              <div
                style={{
                  backgroundColor: '#111420',
                  border: '1px solid #242b40',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffd369',
                    marginBottom: '6px',
                  }}
                >
                  atlas.json 映射数据字典
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    fontSize: '11px',
                    color: '#a3b1d9',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {JSON.stringify(atlasData.json, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* ================= 模式 3: 9-Slice 交互切片调试器 ================= */}
          {selectedCategory === 'slicer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#161928',
                  border: '1px solid #2e3752',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#55ffff' }}>
                  📐 9-Slice 九宫格交互切片调试器
                </div>
                <div style={{ fontSize: '11px', color: '#8b97bc', marginTop: '2px' }}>
                  九宫格切片能让边框和角钉在自由缩放下拉伸而不失真，完美适配 Unity 2D Sprite 与 Godot NinePatchRect。
                </div>
              </div>

              {/* 选择 9-Slice 目标 */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {nineSliceAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className={`wb-btn ${selectedSlicerAsset?.id === asset.id ? 'active' : ''}`}
                    style={{ padding: '5px 12px', fontSize: '11.5px', cursor: 'pointer' }}
                    onClick={() => setSelectedSlicerAsset(asset)}
                  >
                    {asset.name}
                  </button>
                ))}
              </div>

              {selectedSlicerAsset && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    backgroundColor: '#131624',
                    border: '1px solid #262c3f',
                    padding: '16px',
                  }}
                >
                  {/* 左栏：切片线原图预览 */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffd369', marginBottom: '8px' }}>
                      原始切片参数 (Base 1x: {selectedSlicerAsset.width}×{selectedSlicerAsset.height} px)
                    </div>
                    <div
                      style={{
                        height: '200px',
                        backgroundColor: '#090a10',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #2c334d',
                        position: 'relative',
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <AssetCanvasPreview
                          asset={selectedSlicerAsset}
                          scale={4}
                          transparent={transparent}
                        />
                        {/* 切片辅助红线 */}
                        {selectedSlicerAsset.nineSlice && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              pointerEvents: 'none',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: `${selectedSlicerAsset.nineSlice.left * 4}px`,
                                top: 0,
                                bottom: 0,
                                width: '1px',
                                backgroundColor: '#ff4444',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                right: `${selectedSlicerAsset.nineSlice.right * 4}px`,
                                top: 0,
                                bottom: 0,
                                width: '1px',
                                backgroundColor: '#ff4444',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: `${selectedSlicerAsset.nineSlice.top * 4}px`,
                                left: 0,
                                right: 0,
                                height: '1px',
                                backgroundColor: '#55ff55',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: `${selectedSlicerAsset.nineSlice.bottom * 4}px`,
                                left: 0,
                                right: 0,
                                height: '1px',
                                backgroundColor: '#55ff55',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9aa5c4',
                        marginTop: '8px',
                        backgroundColor: '#1b1f30',
                        padding: '8px',
                      }}
                    >
                      <div>
                        切片边距: Left={selectedSlicerAsset.nineSlice?.left}px, Top=
                        {selectedSlicerAsset.nineSlice?.top}px, Right={selectedSlicerAsset.nineSlice?.right}
                        px, Bottom={selectedSlicerAsset.nineSlice?.bottom}px
                      </div>
                      <div style={{ color: '#7e8aa8', marginTop: '2px' }}>
                        红线表示左右保护区域，绿线表示上下保护区域。
                      </div>
                    </div>
                  </div>

                  {/* 右栏：自由拉伸测试演示 */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#55ff55', marginBottom: '8px' }}>
                      拉伸模拟效果测试 (拖动滑块调节尺寸)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                        <span style={{ width: '60px' }}>宽度 ({slicerTestW}px):</span>
                        <input
                          type="range"
                          min="48"
                          max="280"
                          value={slicerTestW}
                          onChange={(e) => setSlicerTestW(Number(e.target.value))}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                        <span style={{ width: '60px' }}>高度 ({slicerTestH}px):</span>
                        <input
                          type="range"
                          min="32"
                          max="180"
                          value={slicerTestH}
                          onChange={(e) => setSlicerTestH(Number(e.target.value))}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        height: '200px',
                        backgroundColor: '#090a10',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #2c334d',
                        overflow: 'hidden',
                      }}
                    >
                      <NineSliceStretchedPreview
                        asset={selectedSlicerAsset}
                        width={slicerTestW}
                        height={slicerTestH}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 模式 4: 游戏引擎接入指南 ================= */}
          {selectedCategory === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#161928',
                  border: '1px solid #2e3752',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#55ff55' }}>
                  ⚙️ 游戏引擎与服务器插件无缝接入模版
                </div>
                <div style={{ fontSize: '11px', color: '#8b97bc', marginTop: '2px' }}>
                  包含 Minecraft Java 资源包、TrMenu/DeluxeMenus 配置、Unity C# 脚本与 Godot NinePatchRect 规范。
                </div>
              </div>

              {/* Unity C# 脚本 */}
              <div style={{ backgroundColor: '#131624', border: '1px solid #262c3f', padding: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffd369' }}>
                    🎮 Unity 2D UGUI: MCGuiSlot.cs
                  </span>
                  <button
                    type="button"
                    className="wb-btn"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(templates.unityCSharpSlotScript);
                      alert('已复制 Unity C# 脚本代码到剪贴板！');
                    }}
                  >
                    复制脚本
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    fontSize: '11px',
                    color: '#a3b1d9',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#0a0c14',
                    padding: '8px',
                  }}
                >
                  {templates.unityCSharpSlotScript}
                </pre>
              </div>

              {/* Minecraft 材质包与 TrMenu */}
              <div style={{ backgroundColor: '#131624', border: '1px solid #262c3f', padding: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#55ffff' }}>
                    ⛏️ Minecraft 材质包 & 菜单配置 (pack.mcmeta & TrMenu)
                  </span>
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    fontSize: '11px',
                    color: '#a3b1d9',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#0a0c14',
                    padding: '8px',
                  }}
                >
                  {templates.trMenuConfig}
                </pre>
              </div>
            </div>
          )}
        </main>

        {/* 右侧：单项组件深度检查器 (Inspector) */}
        <aside
          style={{
            backgroundColor: '#121522',
            borderLeft: '1px solid #242b40',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffd369',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Eye size={14} />
            <span>组件属性与放大检查器</span>
          </div>

          {selectedAsset ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 大图高倍预览 */}
              <div
                style={{
                  height: '180px',
                  backgroundColor: '#0a0b12',
                  backgroundImage:
                    'linear-gradient(45deg, #121522 25%, transparent 25%), linear-gradient(-45deg, #121522 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #121522 75%), linear-gradient(-45deg, transparent 75%, #121522 75%)',
                  backgroundSize: '16px 16px',
                  border: '1px solid #2a324a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <AssetCanvasPreview
                  asset={selectedAsset}
                  scale={selectedAsset.width > 100 ? 1 : Math.max(3, scale)}
                  transparent={transparent}
                />
              </div>

              {/* 标题与描述 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {selectedAsset.name}
                </div>
                <div style={{ fontSize: '11px', color: '#ffd369', fontFamily: 'var(--font-mono)' }}>
                  ID: <code>{selectedAsset.id}</code>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#8b97bc',
                    lineHeight: 1.5,
                    marginTop: '6px',
                    backgroundColor: '#161a29',
                    padding: '8px',
                    borderRadius: '3px',
                  }}
                >
                  {selectedAsset.description}
                </div>
              </div>

              {/* 规格参数表 */}
              <div
                style={{
                  backgroundColor: '#161928',
                  border: '1px solid #252c42',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7c88aa' }}>原始尺寸 (1x):</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>
                    {selectedAsset.width} × {selectedAsset.height} px
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7c88aa' }}>当前导出尺寸 ({scale}x):</span>
                  <span style={{ color: '#55ff55', fontWeight: 700 }}>
                    {selectedAsset.width * scale} × {selectedAsset.height * scale} px
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7c88aa' }}>类别分类:</span>
                  <span style={{ color: '#55ffff' }}>{selectedAsset.category}</span>
                </div>
                {selectedAsset.nineSlice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7c88aa' }}>9-Slice 保护边距:</span>
                    <span style={{ color: '#ff99ff' }}>
                      L:{selectedAsset.nineSlice.left} T:{selectedAsset.nineSlice.top} R:
                      {selectedAsset.nineSlice.right} B:{selectedAsset.nineSlice.bottom}
                    </span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="wb-btn active"
                  style={{
                    padding: '8px 12px',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDownloadAsset(selectedAsset)}
                >
                  <Download size={14} />
                  <span>下载此组件 PNG ({scale}x)</span>
                </button>

                <button
                  type="button"
                  className="wb-btn"
                  style={{
                    padding: '7px 12px',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleCopyDataUrl(selectedAsset)}
                >
                  {copiedId === selectedAsset.id ? (
                    <>
                      <Check size={14} color="#55ff55" />
                      <span style={{ color: '#55ff55' }}>已复制 Data URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>复制 Base64 Data URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#6f7a9c', textAlign: 'center', marginTop: '40px' }}>
              请在左侧列表中点击任意组件进行检查与单独下载
            </div>
          )}
        </aside>
      </div>

      {/* ================= 打包导出全屏遮罩 Progress Modal ================= */}
      {isExporting && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 12, 0.88)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '380px',
              backgroundColor: '#161a29',
              border: '2px solid #ffd369',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 0 40px rgba(0,0,0,0.9)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffd369', textAlign: 'center' }}>
              📦 正在打包导出游戏美术资产...
            </div>

            <div style={{ fontSize: '11px', color: '#a6b4de', textAlign: 'center', minHeight: '32px' }}>
              {exportProgress.text || '正在处理中...'}
            </div>

            {/* 进度条 */}
            <div
              style={{
                height: '14px',
                backgroundColor: '#0c0e17',
                border: '1px solid #3d4766',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${exportProgress.percent}%`,
                  backgroundColor: '#44cc77',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>

            <div style={{ fontSize: '11px', color: '#ffd369', textAlign: 'right' }}>
              {exportProgress.percent}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 动态渲染 Canvas 的轻量预览组件
 */
const AssetCanvasPreview: React.FC<{
  asset: GuiAsset;
  scale: number;
  transparent: boolean;
}> = ({ asset, scale, transparent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const canvas = asset.render(scale, transparent);
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.imageRendering = 'pixelated';
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(canvas);
  }, [asset, scale, transparent]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    />
  );
};

/**
 * 9-Slice 拉伸测试效果渲染组件 (基于 CSS border-image)
 */
const NineSliceStretchedPreview: React.FC<{
  asset: GuiAsset;
  width: number;
  height: number;
}> = ({ asset, width, height }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const c = asset.render(1, true);
    setDataUrl(c.toDataURL());
  }, [asset]);

  if (!asset.nineSlice || !dataUrl) return null;

  const { left, top, right, bottom } = asset.nineSlice;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderStyle: 'solid',
        borderWidth: `${top * 2}px ${right * 2}px ${bottom * 2}px ${left * 2}px`,
        borderImageSource: `url(${dataUrl})`,
        borderImageSlice: `${top} ${right} ${bottom} ${left} fill`,
        borderImageRepeat: 'repeat',
        imageRendering: 'pixelated',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
      }}
    />
  );
};
