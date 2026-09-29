import React, { useMemo, useState } from 'react';
import { Download, Copy, Check, Eye } from 'lucide-react';
import { ScreenId, ServerState } from '../types';
import { buildGuiAssets } from './assetRegistry';
import { downloadSingleAsset, exportCurrentScreenZip } from './zipExporter';
import { AssetCategory } from './types';

interface QuickExportDrawerProps {
  currentScreen: ScreenId;
  serverState: ServerState;
  onOpenStudio: () => void;
}

export const QuickExportDrawer: React.FC<QuickExportDrawerProps> = ({
  currentScreen,
  serverState,
  onOpenStudio,
}) => {
  const [scale, setScale] = useState<1 | 2 | 3 | 4>(2);
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const assets = useMemo(() => {
    return buildGuiAssets(currentScreen, serverState);
  }, [currentScreen, serverState]);

  const filtered = useMemo(() => {
    if (category === 'all') return assets;
    return assets.filter((a) => a.category === category);
  }, [assets, category]);

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportCurrentScreenZip(currentScreen, serverState, { scale });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyDataUrl = (asset: any) => {
    const c = asset.render(scale, true);
    navigator.clipboard.writeText(c.toDataURL('image/png'));
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 顶部醒目横幅与打包按钮 */}
      <div
        style={{
          padding: '12px',
          backgroundColor: '#1b2033',
          border: '1px solid #3d476e',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffd369' }}>
            🎮 游戏 GUI 切片导出
          </span>
          <span style={{ fontSize: '11px', color: '#8899cc' }}>
            共 {assets.length} 个组件
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '11px', color: '#9bb0e0', lineHeight: 1.4 }}>
          一键导出当前界面对应的背景、槽位、按钮切片与 16×16 物品素材。
        </p>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            className="wb-btn active"
            style={{
              flex: 1,
              padding: '6px 10px',
              justifyContent: 'center',
              backgroundColor: '#1e6b37',
              borderColor: '#43b364',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={handleExportZip}
            disabled={isExporting}
          >
            <Download size={13} style={{ marginRight: '4px' }} />
            <span>{isExporting ? '打包中...' : `一键导出 ZIP (${scale}x)`}</span>
          </button>

          <button
            type="button"
            className="wb-btn"
            style={{
              padding: '6px 10px',
              backgroundColor: '#2d3b66',
              color: '#ffd369',
              cursor: 'pointer',
            }}
            onClick={onOpenStudio}
            title="打开全屏资产导出工坊 (包含 9-Slice 切片测试与 Atlas 合图)"
          >
            <Eye size={13} style={{ marginRight: '4px' }} />
            <span>工坊</span>
          </button>
        </div>
      </div>

      {/* 控制选项：缩放倍率 + 分类 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#7c88aa' }}>缩放倍率:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([1, 2, 3, 4] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`wb-btn ${scale === s ? 'active' : ''}`}
                style={{ padding: '2px 7px', fontSize: '10.5px' }}
                onClick={() => setScale(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* 分类切换 */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: '全部' },
            { id: 'background', label: '背景' },
            { id: 'slot', label: '槽位' },
            { id: 'button', label: '按钮' },
            { id: 'icon', label: '物品' },
            { id: 'bar', label: '进度条' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`wb-btn ${category === cat.id ? 'active' : ''}`}
              style={{ padding: '2px 6px', fontSize: '10px', whiteSpace: 'nowrap' }}
              onClick={() => setCategory(cat.id as any)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 组件微型列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
        {filtered.map((asset) => {
          return (
            <div
              key={asset.id}
              style={{
                backgroundColor: '#141724',
                border: '1px solid #242a3d',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {/* 缩略图 */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#0a0b12',
                    border: '1px solid #1c2030',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={asset.render(1, true).toDataURL()}
                    alt={asset.name}
                    style={{
                      maxWidth: '28px',
                      maxHeight: '28px',
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#e2e6f5',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#7c88aa' }}>
                    {asset.width}×{asset.height} px · {asset.category}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="wb-btn"
                  style={{ padding: '3px 6px', fontSize: '10px' }}
                  onClick={() => downloadSingleAsset((s, t) => asset.render(s, t), `${asset.id}_x${scale}`, scale, true)}
                  title="下载单张 PNG"
                >
                  <Download size={11} />
                </button>
                <button
                  type="button"
                  className="wb-btn"
                  style={{ padding: '3px 6px', fontSize: '10px' }}
                  onClick={() => handleCopyDataUrl(asset)}
                  title="复制 Base64 Data URL"
                >
                  {copiedId === asset.id ? <Check size={11} color="#55ff55" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
