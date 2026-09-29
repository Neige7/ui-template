import React, { useEffect, useState } from 'react';
import { ConfirmDialog } from '../core/ConfirmDialog';
import { CursorItem } from '../core/CursorItem';
import { GuiContext, TooltipPayload } from '../core/GuiContext';
import { ItemIcon } from '../core/ItemIcon';
import { MinecraftText } from '../core/MinecraftText';
import { TextInputModal } from '../core/TextInputModal';
import { Tooltip } from '../core/Tooltip';
import {
  CONFIRMED_ASSUMPTIONS,
  SCREEN_LAYOUTS,
  SCREEN_READMES,
  STAGE_REPORTS,
} from '../docs/portingGuide';
import {
  buildScenarioState,
  createBaseServerState,
  SCENARIO_LIST,
  ScenarioKey,
} from '../mock/scenarios';
import { mockServer } from '../mock/server';
import { GuildScreen } from '../screens/guild/GuildScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { MailScreen } from '../screens/mail/MailScreen';
import { MountScreen } from '../screens/mount/MountScreen';
import { PetScreen } from '../screens/pet/PetScreen';
import { QuestScreen } from '../screens/quest/QuestScreen';
import { WarehouseScreen } from '../screens/warehouse/WarehouseScreen';
import { ChestShopBuyScreen } from '../screens/chest_shop_buy/ChestShopBuyScreen';
import { ChestShopEditScreen } from '../screens/chest_shop_edit/ChestShopEditScreen';
import { ActionLogEntry, GuiAction, ScreenId, ServerState } from '../types';
import { DebugOverlayBanner } from './DebugOverlay';
import { runCoreUnitTests, TestRunnerModal } from './TestRunnerModal';
import { AgentGuideModal } from './AgentGuideModal';
import { GuiAssetExportStudio } from '../export/GuiAssetExportStudio';
import { QuickExportDrawer } from '../export/QuickExportDrawer';
import { renderLiveGuiSnapshot } from '../export/canvasDrawers';
import { exportCurrentScreenZip } from '../export/zipExporter';
import {
  AGENT_TEN_COMMANDMENTS,
  AGENT_DEVELOPMENT_STEPS,
  AGENT_THREE_ARTIFACTS,
} from '../docs/agentGuide';

const SCREEN_NAV_ITEMS: {
  id: ScreenId;
  label: string;
  sub: string;
  icon: string;
}[] = [
  { id: 'warehouse', label: '6.7 玩家仓库', sub: 'Warehouse (样板)', icon: 'warehouse' },
  { id: 'inventory', label: '6.1 玩家背包 (Hub)', sub: 'Inventory + RPG', icon: 'chest_plate' },
  { id: 'quest', label: '6.2 任务视图', sub: 'Quest System', icon: 'scroll_quest' },
  { id: 'pet', label: '6.3 宠物界面', sub: 'Pet Companion', icon: 'pet_dragon' },
  { id: 'mount', label: '6.4 坐骑界面', sub: 'Mount (复用模板)', icon: 'mount_griffin' },
  { id: 'mail', label: '6.6 邮箱界面', sub: 'Mail & CDK', icon: 'mail_unread' },
  { id: 'guild', label: '6.5 公会界面', sub: 'Guild & 权限矩阵', icon: 'banner_guild' },
  { id: 'shop_edit', label: '6.8 箱子商店管理', sub: 'Chest Shop · Edit', icon: 'chest_shop' },
  { id: 'shop_buy', label: '6.9 箱子商店购买', sub: 'Chest Shop · Buy', icon: 'cart_buy' },
];

export const Gallery: React.FC = () => {
  const [serverState, setServerState] = useState<ServerState>(() =>
    createBaseServerState('warehouse')
  );
  const [guiScale, setGuiScale] = useState<2 | 3 | 4>(3);
  const [debugMode, setDebugMode] = useState<boolean>(true);
  const [tooltip, setTooltip] = useState<TooltipPayload | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString(),
      action: { screen: 'warehouse', slot: 0, click: 'left' },
      summary: '初始化 Minecraft RPG 服务器 GUI 原型工作台 (默认打开 6.7 玩家仓库)',
    },
  ]);
  const [rightTab, setRightTab] = useState<
    'readme' | 'layout_json' | 'action_log' | 'porting_report' | 'agent_md' | 'export'
  >('export');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [agentGuideModalOpen, setAgentGuideModalOpen] = useState(false);
  const [exportStudioOpen, setExportStudioOpen] = useState(false);

  const handleQuickDownloadSnapshot = () => {
    const canvas = renderLiveGuiSnapshot(serverState.currentScreen, serverState, guiScale);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `mc_gui_${serverState.currentScreen}_snapshot_x${guiScale}.png`;
    a.click();
  };

  const handleQuickExportZip = async () => {
    await exportCurrentScreenZip(serverState.currentScreen, serverState, {
      scale: guiScale,
    });
  };

  const unitTests = runCoreUnitTests();
  const allPassed = unitTests.every((t) => t.passed);

  useEffect(() => {
    document.documentElement.style.setProperty('--gui-scale', String(guiScale));
  }, [guiScale]);

  const dispatchAction = (action: GuiAction) => {
    setTooltip(null);
    setServerState((prev) => {
      const { state: next, summary } = mockServer.handle(prev, action);
      setActionLogs((oldLogs) => [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          timestamp: new Date().toLocaleTimeString(),
          action,
          summary,
        },
        ...oldLogs.slice(0, 49),
      ]);
      return next;
    });
  };

  const handleScreenSelect = (screenId: ScreenId) => {
    dispatchAction({
      screen: serverState.currentScreen,
      slot: 'GALLERY_NAV',
      click: 'left',
      payload: { action: `nav_screen:${screenId}` },
    });
  };

  const handleScenarioChange = (scenario: ScenarioKey) => {
    setTooltip(null);
    const next = buildScenarioState(scenario, serverState.currentScreen);
    setServerState(next);
    setActionLogs((old) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: {
          screen: serverState.currentScreen,
          slot: 'SCENARIO_SWITCH',
          click: 'left',
          payload: { scenario },
        },
        summary: `切换预设测试场景 -> [${scenario}]`,
      },
      ...old.slice(0, 49),
    ]);
  };

  const handleDownloadLayoutJson = () => {
    const jsonStr = JSON.stringify(
      SCREEN_LAYOUTS[serverState.currentScreen],
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverState.currentScreen}.layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeScreen = serverState.currentScreen;
  const activeReadme = SCREEN_READMES[activeScreen];

  return (
    <GuiContext.Provider
      value={{
        state: serverState,
        dispatchAction,
        debugMode,
        setTooltip,
      }}
    >
      <div className="app-workbench">
        {/* ==================== 左侧：9 大界面导航与场景/缩放控制器 ==================== */}
        <aside className="workbench-sidebar">
          <div className="brand-box">
            <h1 className="brand-title">⚔ MC-RPG GUI 原型组件库</h1>
            <p className="brand-subtitle">
              18×18px 槽位网格 · GuiAction 架构 · 奇幻简约 RPG
            </p>
          </div>

          {/* 9 个界面切换器 */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#9aa2c2',
                marginBottom: '6px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>9 大服务器 GUI 界面</span>
              <span>点击切换</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {SCREEN_NAV_ITEMS.map((item) => {
                const isActive = activeScreen === item.id;
                const unreadBadge =
                  item.id === 'mail'
                    ? serverState.mail.mails.filter((m) => !m.read && !m.expired)
                        .length
                    : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`wb-btn ${isActive ? 'active' : ''}`}
                    style={{
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      textAlign: 'left',
                    }}
                    onClick={() => handleScreenSelect(item.id)}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ width: '18px', height: '18px', display: 'inline-flex' }}>
                        <ItemIcon
                          icon={item.icon}
                          rarity={isActive ? 'legendary' : 'rare'}
                        />
                      </span>
                      <span>
                        <div style={{ fontSize: '12.5px', fontWeight: 700 }}>
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#8e96b8',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {item.sub}
                        </div>
                      </span>
                    </span>
                    {unreadBadge > 0 ? (
                      <span
                        className="wb-badge"
                        style={{ background: '#b82e3e', color: '#fff' }}
                      >
                        ●{unreadBadge}
                      </span>
                    ) : (
                      <span className="wb-badge">{item.id}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 预设 Mock 场景切换器 (正常 / 空数据 / 多页满载 / 边界情况) */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#9aa2c2',
                marginBottom: '6px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              预设测试场景 (Mock Scenarios)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {SCENARIO_LIST.map((sc) => {
                const isCurrent = serverState.scenarioName === sc.key;
                return (
                  <button
                    key={sc.key}
                    type="button"
                    className={`wb-btn ${isCurrent ? 'active' : ''}`}
                    style={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '6px 9px',
                      gap: '2px',
                    }}
                    onClick={() => handleScenarioChange(sc.key)}
                  >
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '12px' }}>
                        {sc.label}
                      </span>
                      <span className="wb-badge">{sc.tag}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#8e96b8',
                        textAlign: 'left',
                        lineHeight: 1.3,
                      }}
                    >
                      {sc.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 全局缩放系数 --gui-scale 与 DebugOverlay 开关 */}
          <div
            style={{
              background: '#181c2b',
              border: '1px solid #2e3552',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: '#9aa2c2' }}>
                全局像素缩放 (--gui-scale)
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {([2, 3, 4] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`wb-btn ${guiScale === s ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => setGuiScale(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`wb-btn ${debugMode ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'space-between' }}
              onClick={() => setDebugMode((v) => !v)}
            >
              <span>🔍 DebugOverlay (网格与槽位索引)</span>
              <span className="wb-badge">{debugMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              className="wb-btn"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                borderColor: allPassed ? '#2e6b48' : '#8b2e3b',
                color: '#55ff55',
              }}
              onClick={() => setTestModalOpen(true)}
            >
              <span>🧪 运行核心逻辑单元测试</span>
              <span className="wb-badge" style={{ color: '#55ff55' }}>
                {unitTests.filter((t) => t.passed).length}/{unitTests.length} PASS
              </span>
            </button>

            <button
              type="button"
              className="wb-btn"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                borderColor: '#4d5b88',
                color: '#ffd369',
                background: '#1d2238',
              }}
              onClick={() => setAgentGuideModalOpen(true)}
            >
              <span>📜 AGENT.MD 研发准则与执行手册</span>
              <span className="wb-badge" style={{ color: '#ffd369', borderColor: '#ffd369' }}>
                研发宪章
              </span>
            </button>

            <button
              type="button"
              className="wb-btn active"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                borderColor: '#ffd369',
                color: '#ffd369',
                background: 'linear-gradient(135deg, #2b2313 0%, #1c1d29 100%)',
                boxShadow: '0 0 12px rgba(255, 211, 105, 0.2)',
                fontWeight: 700,
                marginTop: '4px',
              }}
              onClick={() => setExportStudioOpen(true)}
            >
              <span>🎮 导出 GUI 组件切片工坊</span>
              <span className="wb-badge" style={{ color: '#ffd369', borderColor: '#ffd369' }}>
                EXPORT
              </span>
            </button>
          </div>
        </aside>

        {/* ==================== 中央：可交互 Minecraft 容器 GUI 舞台 ==================== */}
        <main className="workbench-stage">
          {/* 快捷游戏组件切片导出操作条 */}
          <div
            style={{
              width: 'var(--gui-width)',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <button
              type="button"
              className="wb-btn active"
              style={{
                flex: 1,
                padding: '6px 12px',
                backgroundColor: '#1b3f26',
                borderColor: '#399e52',
                color: '#ffd369',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                fontSize: '11.5px',
              }}
              onClick={() => setExportStudioOpen(true)}
            >
              <span>🎮 导出对应 GUI 组件图片 (游戏专用)</span>
            </button>
            <button
              type="button"
              className="wb-btn"
              style={{
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              onClick={handleQuickDownloadSnapshot}
              title="快速截图保存当前渲染 GUI 为 PNG 图片"
            >
              <span>📸 截图</span>
            </button>
            <button
              type="button"
              className="wb-btn"
              style={{
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              onClick={handleQuickExportZip}
              title="快速打包当前 GUI 所有贴图组件为 ZIP 压缩包"
            >
              <span>📦 打包 ZIP</span>
            </button>
          </div>

          {/* 顶部操作提示与实时 Toast 通知栏 */}
          <div
            style={{
              width: 'var(--gui-width)',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              background: '#161926',
              border: '1px solid #323956',
              fontSize: '12px',
            }}
          >
            <div>
              {serverState.ui.lastToast ? (
                <MinecraftText
                  text={
                    serverState.ui.lastToast.type === 'error'
                      ? `§c✖ ${serverState.ui.lastToast.message}`
                      : serverState.ui.lastToast.type === 'warning'
                      ? `§e⚠ ${serverState.ui.lastToast.message}`
                      : serverState.ui.lastToast.type === 'success'
                      ? `§a✔ ${serverState.ui.lastToast.message}`
                      : `§bℹ ${serverState.ui.lastToast.message}`
                  }
                />
              ) : (
                <MinecraftText text="§7提示: 左键拿放 | 右键拆分 | Shift+左键快速转移/穿戴 | 悬停按数字键1-9与快捷栏交换" />
              )}
            </div>
            {serverState.player.cursorItem && (
              <span className="wb-badge" style={{ color: '#ffd369' }}>
                手持: {serverState.player.cursorItem.amount}个
              </span>
            )}
          </div>

          {/* DebugOverlay 像素网格标尺横幅 */}
          <DebugOverlayBanner
            debugMode={debugMode}
            guiScale={guiScale}
            screen={activeScreen}
            rows={5}
          />

          {/* 当前激活的界面组件 */}
          {activeScreen === 'warehouse' && <WarehouseScreen />}
          {activeScreen === 'inventory' && <InventoryScreen />}
          {activeScreen === 'quest' && <QuestScreen />}
          {activeScreen === 'pet' && <PetScreen />}
          {activeScreen === 'mount' && <MountScreen />}
          {activeScreen === 'mail' && <MailScreen />}
          {activeScreen === 'guild' && <GuildScreen />}
          {activeScreen === 'shop_edit' && <ChestShopEditScreen />}
          {activeScreen === 'shop_buy' && <ChestShopBuyScreen />}
        </main>

        {/* ==================== 右侧：每界面三件套交付检查器 (README + layout.json + GuiAction 流) ==================== */}
        <aside className="workbench-right-drawer">
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid #262b40',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '3px',
              background: '#161926',
            }}
          >
            <button
              type="button"
              className={`wb-btn ${rightTab === 'export' ? 'active' : ''}`}
              style={{ padding: '5px 2px', fontSize: '10px', color: '#55ff55' }}
              onClick={() => setRightTab('export')}
            >
              🎮 导出
            </button>
            <button
              type="button"
              className={`wb-btn ${rightTab === 'readme' ? 'active' : ''}`}
              style={{ padding: '5px 2px', fontSize: '10px' }}
              onClick={() => setRightTab('readme')}
            >
              📘 说明
            </button>
            <button
              type="button"
              className={`wb-btn ${rightTab === 'layout_json' ? 'active' : ''}`}
              style={{ padding: '5px 2px', fontSize: '10px' }}
              onClick={() => setRightTab('layout_json')}
            >
              🧩 布局
            </button>
            <button
              type="button"
              className={`wb-btn ${rightTab === 'agent_md' ? 'active' : ''}`}
              style={{ padding: '5px 2px', fontSize: '10px', color: '#ffd369' }}
              onClick={() => setRightTab('agent_md')}
            >
              📜 宪章
            </button>
            <button
              type="button"
              className={`wb-btn ${rightTab === 'action_log' ? 'active' : ''}`}
              style={{ padding: '5px 2px', fontSize: '10px' }}
              onClick={() => setRightTab('action_log')}
            >
              ⚡ 动作({actionLogs.length})
            </button>
            <button
              type="button"
              className={`wb-btn ${rightTab === 'porting_report' ? 'active' : ''}`}
              style={{ padding: '5px 2px', fontSize: '10px' }}
              onClick={() => setRightTab('porting_report')}
            >
              📦 报告
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.55,
            }}
          >
            {/* Tab 0: 游戏 GUI 组件与切片导出管理 */}
            {rightTab === 'export' && (
              <QuickExportDrawer
                currentScreen={activeScreen}
                serverState={serverState}
                onOpenStudio={() => setExportStudioOpen(true)}
              />
            )}

            {/* Tab 1: 当前界面的交互说明文档 (README.md) */}
            {rightTab === 'readme' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '10px',
                    background: '#1a1e30',
                    border: '1px solid #3c4469',
                  }}
                >
                  <div
                    style={{
                      color: '#ffd369',
                      fontWeight: 700,
                      fontSize: '13px',
                      marginBottom: '4px',
                    }}
                  >
                    {activeReadme.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#98a4d4' }}>
                    文件路径: <code>src/screens/{activeScreen}/README.md</code>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#55ffff' }}>
                    1. 槽位交互与业务规则
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#d4daf0' }}>
                    {activeReadme.bullets.map((b, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#55ff55' }}>
                    2. Minecraft 服务端/模组客户端实现建议
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#b8c2e6' }}>
                    {activeReadme.mcPortingNotes.map((n, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    padding: '10px',
                    background: '#161926',
                    border: '1px solid #2e344f',
                  }}
                >
                  <div style={{ color: '#ffd369', fontWeight: 700, marginBottom: '6px' }}>
                    📌 已采用的确认假设清单
                  </div>
                  {CONFIRMED_ASSUMPTIONS.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        marginBottom: '6px',
                        fontSize: '11px',
                        borderBottom: '1px dashed #262b40',
                        paddingBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#55ffff', fontWeight: 700 }}>
                        [{a.id} {a.item}]
                      </span>{' '}
                      <span style={{ color: '#c4cce8' }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: 当前界面的槽位布局配置 (layout.json) */}
            {rightTab === 'layout_json' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ color: '#ffd369', fontWeight: 700 }}>
                    src/screens/{activeScreen}/layout.json
                  </span>
                  <button
                    type="button"
                    className="wb-btn active"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                    onClick={handleDownloadLayoutJson}
                  >
                    ⬇ 导出 JSON
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '10px',
                    background: '#0d0f18',
                    border: '1px solid #2e3552',
                    color: '#a6f4c5',
                    fontSize: '11px',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(SCREEN_LAYOUTS[activeScreen], null, 2)}
                </pre>
              </div>
            )}

            {/* Tab 3: GuiAction 实时事件流监控 (对应 InventoryClickEvent) */}
            {rightTab === 'action_log' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ color: '#ffd369', fontWeight: 700 }}>
                    mockServer.handle(GuiAction) 事件流
                  </span>
                  <button
                    type="button"
                    className="wb-btn"
                    style={{ padding: '2px 7px', fontSize: '10px' }}
                    onClick={() => setActionLogs([])}
                  >
                    清空日志
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {actionLogs.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '7px 9px',
                        background: '#161926',
                        borderLeft: '3px solid #55ffff',
                        fontSize: '11px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#8e96b8',
                          marginBottom: '2px',
                        }}
                      >
                        <span>
                          Screen: <strong style={{ color: '#fff' }}>{entry.action.screen}</strong>{' '}
                          | Slot: <strong style={{ color: '#00ffcc' }}>{String(entry.action.slot)}</strong>{' '}
                          | Click: <strong style={{ color: '#ffd369' }}>{entry.action.click}</strong>
                        </span>
                        <span>{entry.timestamp}</span>
                      </div>
                      <div style={{ color: '#d4daf0' }}>→ {entry.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: AGENT.MD 研发准则与军规 */}
            {rightTab === 'agent_md' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '10px',
                    background: '#1d2238',
                    border: '1px solid #4a5482',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#ffd369', fontWeight: 700, fontSize: '13px' }}>
                      📜 AGENT.MD 研发宪章
                    </span>
                    <button
                      type="button"
                      className="wb-btn active"
                      style={{ padding: '3px 8px', fontSize: '11px', color: '#ffd369' }}
                      onClick={() => setAgentGuideModalOpen(true)}
                    >
                      ⛶ 展开大窗
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#b8c3e8' }}>
                    法定地位：本项目后续所有功能迭代与 Bug 修复，<strong>必须无条件遵守 AGENT.MD</strong> 规范。
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    background: '#141724',
                    border: '1px solid #2e354e',
                  }}
                >
                  <div style={{ color: '#55ffff', fontWeight: 700, marginBottom: '6px' }}>
                    📌 单界面三件套交付标准
                  </div>
                  {AGENT_THREE_ARTIFACTS.map((art) => (
                    <div
                      key={art.name}
                      style={{
                        marginBottom: '6px',
                        fontSize: '11px',
                        borderBottom: '1px dashed #282f47',
                        paddingBottom: '4px',
                      }}
                    >
                      <strong style={{ color: '#ffd369' }}>{art.name}</strong>
                      <div style={{ color: '#a0aac8' }}>{art.desc}</div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: '10px',
                    background: '#141724',
                    border: '1px solid #2e354e',
                  }}
                >
                  <div style={{ color: '#55ff55', fontWeight: 700, marginBottom: '6px' }}>
                    ⚔ Agent 研发十诫 (精选)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {AGENT_TEN_COMMANDMENTS.slice(0, 5).map((cmd) => (
                      <div key={cmd.id} style={{ fontSize: '11px' }}>
                        <span style={{ color: '#ff5555', fontWeight: 700 }}>
                          [{cmd.id}]
                        </span>{' '}
                        <strong style={{ color: '#ffd369' }}>{cmd.rule}</strong>
                        <div style={{ color: '#97a2c8', marginLeft: '6px' }}>
                          {cmd.detail}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="wb-btn"
                      style={{ marginTop: '4px', padding: '4px 6px', fontSize: '10px' }}
                      onClick={() => setAgentGuideModalOpen(true)}
                    >
                      查看全部 10 项军规与 SOP 8步 →
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    background: '#141724',
                    border: '1px solid #2e354e',
                  }}
                >
                  <div style={{ color: '#ffd369', fontWeight: 700, marginBottom: '4px' }}>
                    ⚙ SOP 开发流程
                  </div>
                  {AGENT_DEVELOPMENT_STEPS.slice(0, 4).map((s) => (
                    <div
                      key={s.step}
                      style={{
                        marginBottom: '4px',
                        fontSize: '11px',
                        color: '#b8c3e8',
                      }}
                    >
                      <span style={{ color: '#55ffff' }}>▶</span> {s.step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: P0~P7 阶段验收报告与移植指南汇总 */}
            {rightTab === 'porting_report' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '10px',
                    background: '#1a1e30',
                    border: '1px solid #3c4469',
                  }}
                >
                  <div style={{ color: '#55ff55', fontWeight: 700, marginBottom: '4px' }}>
                    ✔ P0 ~ P7 全阶段交付与移植验收报告
                  </div>
                  <div style={{ fontSize: '11px', color: '#9aa2c2' }}>
                    完整指南已输出至 <code>docs/porting-guide.md</code>
                  </div>
                </div>

                {STAGE_REPORTS.map((rep) => (
                  <div
                    key={rep.stage}
                    style={{
                      padding: '8px 10px',
                      background: '#161926',
                      border: '1px solid #2e344f',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '3px',
                      }}
                    >
                      <strong style={{ color: '#ffd369' }}>{rep.stage}</strong>
                      <span style={{ color: '#55ff55', fontSize: '11px' }}>
                        {rep.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#b8c2e6' }}>
                      {rep.deliverables}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 全局悬浮层：MC 深紫边框 Tooltip、鼠标手持物品、二次确认容器 GUI、MC 文本输入桥接弹窗、单元测试报告 */}
      <Tooltip tooltip={tooltip} debugMode={debugMode} />
      <CursorItem />
      <ConfirmDialog />
      <TextInputModal />
      <TestRunnerModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
      />
      <AgentGuideModal
        open={agentGuideModalOpen}
        onClose={() => setAgentGuideModalOpen(false)}
      />
      {exportStudioOpen && (
        <GuiAssetExportStudio
          currentScreen={activeScreen}
          serverState={serverState}
          onClose={() => setExportStudioOpen(false)}
          onSelectScreen={handleScreenSelect}
        />
      )}
    </GuiContext.Provider>
  );
};
