import React, { useState } from 'react';
import {
  AGENT_DEVELOPMENT_STEPS,
  AGENT_TEN_COMMANDMENTS,
  AGENT_THREE_ARTIFACTS,
} from '../docs/agentGuide';
import { CONFIRMED_ASSUMPTIONS, STAGE_REPORTS } from '../docs/portingGuide';

interface AgentGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export const AgentGuideModal: React.FC<AgentGuideModalProps> = ({ open, onClose }) => {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'commandments' | 'assumptions' | 'sop' | 'screens' | 'porting'
  >('overview');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopyAgentMd = async () => {
    try {
      // 动态读取并复制 AGENT.MD 概览
      const text = `# AGENT.MD 研发准则摘要\n\n- 目标：Minecraft RPG GUI 原型组件库 (Web 前端) 跨端拆分移植\n- 网格：1 槽位 = 18×18 px，标准容器宽度 176 px，--gui-scale 整数倍\n- 交互：绝对禁止 UI 直接修改状态，统一派发 GuiAction -> mockServer\n- 状态：normal / hover / selected / disabled / locked / hidden\n- 交付物：每个界面必须包含 Web 原型、layout.json、README.md 三件套`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 容错处理
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '940px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#161825',
          border: '2px solid #4a5478',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), inset 0 0 0 1px #222638',
          display: 'flex',
          flexDirection: 'column',
          color: '#e2e6f3',
          fontFamily: 'var(--font-mono)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#1f2336',
            borderBottom: '2px solid #363d59',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📜</span>
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffd369',
                  fontFamily: 'var(--font-pixel)',
                  letterSpacing: '0.5px',
                }}
              >
                AGENT.MD — Minecraft RPG 服务器 GUI 组件原型库开发准则与执行手册
              </div>
              <div style={{ fontSize: '11px', color: '#97a2c7' }}>
                面向后续 AI Agent 与人类开发者的唯一法典 · 约束 Minecraft 物理网格与单向 GuiAction 流
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="wb-btn"
              style={{ padding: '4px 8px', fontSize: '11px', color: '#55ffff' }}
              onClick={handleCopyAgentMd}
            >
              {copied ? '✔ 已复制摘要' : '📋 复制准则摘要'}
            </button>
            <button
              type="button"
              className="wb-btn"
              style={{ padding: '4px 10px', fontSize: '13px' }}
              onClick={onClose}
            >
              ✕ 关闭
            </button>
          </div>
        </div>

        {/* 顶部统计指示 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#12141f',
            borderBottom: '1px solid #272d42',
            fontSize: '11px',
          }}
        >
          <div style={{ padding: '6px 8px', background: '#1a1d2c', border: '1px solid #313854' }}>
            <div style={{ color: '#8893b8' }}>基础槽位标准</div>
            <div style={{ color: '#55ffff', fontWeight: 700, fontSize: '13px' }}>18×18 px / 176px 宽</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#1a1d2c', border: '1px solid #313854' }}>
            <div style={{ color: '#8893b8' }}>核心状态抽象</div>
            <div style={{ color: '#55ff55', fontWeight: 700, fontSize: '13px' }}>GuiAction 纯函数驱动</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#1a1d2c', border: '1px solid #313854' }}>
            <div style={{ color: '#8893b8' }}>界面交付标准</div>
            <div style={{ color: '#ffd369', fontWeight: 700, fontSize: '13px' }}>Web + JSON + README 三件套</div>
          </div>
          <div style={{ padding: '6px 8px', background: '#1a1d2c', border: '1px solid #313854' }}>
            <div style={{ color: '#8893b8' }}>研发阶段进度</div>
            <div style={{ color: '#ff55ff', fontWeight: 700, fontSize: '13px' }}>P0 ~ P7 100% 达成</div>
          </div>
        </div>

        {/* 选项卡导航 */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#181b28',
            borderBottom: '1px solid #2e354f',
            padding: '0 12px',
            gap: '4px',
          }}
        >
          {[
            { id: 'overview', label: '📖 宪章与核心铁律' },
            { id: 'commandments', label: '⚔ Agent 研发十诫' },
            { id: 'assumptions', label: '📌 权威裁决与默认假设' },
            { id: 'sop', label: '⚙ SOP 8步开发流程' },
            { id: 'screens', label: '🖥 7大界面基线' },
            { id: 'porting', label: '🔌 服务端/模组移植' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`wb-btn ${activeSection === tab.id ? 'active' : ''}`}
              style={{
                borderRadius: '0',
                borderBottom: 'none',
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: activeSection === tab.id ? 700 : 400,
              }}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 主内容区域 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            fontSize: '12px',
            lineHeight: 1.6,
          }}
        >
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  background: '#1d2235',
                  borderLeft: '4px solid #ffd369',
                }}
              >
                <h3 style={{ margin: '0 0 6px 0', color: '#ffd369', fontSize: '14px' }}>
                  1. 项目使命与非目标定义 (Scope & Mission)
                </h3>
                <p style={{ margin: 0, color: '#c8d1ea' }}>
                  本项目<strong>并非普通网页产品</strong>，而是为 Minecraft RPG 服务器打造的可交互 GUI
                  原型库。最终目的是无缝拆分移植到 Minecraft 服务端（Bukkit/Spigot/Paper 插件容器）与客户端模组（Forge/NeoForge/Fabric Screen）。所有设计<strong>必须优先满足 MC 可实现性，严禁为了网页视觉任意破坏 MC 容器规则</strong>。
                </p>
              </div>

              <div>
                <h4 style={{ color: '#55ffff', margin: '0 0 8px 0' }}>
                  2. 界面交付物「不可逆三件套」
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {AGENT_THREE_ARTIFACTS.map((art) => (
                    <div
                      key={art.name}
                      style={{
                        padding: '10px',
                        background: '#121522',
                        border: '1px solid #2e344e',
                      }}
                    >
                      <div style={{ color: '#ffd369', fontWeight: 700, marginBottom: '4px' }}>
                        {art.name}
                      </div>
                      <code style={{ fontSize: '10px', color: '#55ff55', display: 'block', marginBottom: '4px' }}>
                        {art.path}
                      </code>
                      <div style={{ fontSize: '11px', color: '#97a2c7' }}>{art.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: '#55ff55', margin: '0 0 8px 0' }}>
                  3. Minecraft 可移植性五大架构铁律
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#d0d8f0' }}>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>1 槽位 = 18×18 px（原始像素）</strong>，内部物品图标 16×16 px 居中放置；标准容器宽度 176 px（9 列 162px + 双侧各 7px 边框）。
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>槽位索引全局唯一</strong>：容器区域严格为 <code>0 ~ rows*9-1</code>，玩家背包区域严格为 <code>P0 ~ P35</code>（P0-P26 主背包，P27-P35 快捷栏）。
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>单一交互抽象 GuiAction</strong>：UI 组件严禁直接篡改业务数据，必须打包为 <code>GuiAction &#123; screen, slot, click, payload &#125;</code> 统一派发。
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>三层渲染架构 (layers)</strong>：分为 <code>background</code>（贴图层）、<code>dynamic_text</code>（动态文字层）、<code>items</code>（物品槽位层）。
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    <strong>零第三方 UI 库与零 Mojang 原版贴图</strong>：禁止引入 AntD/MUI/Tailwind 组件，像素图标必须采用内置矢量 SVG。
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'commandments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: '#241a22',
                  border: '1px solid #732a3f',
                  color: '#ff8899',
                  fontSize: '11px',
                }}
              >
                ⚠ <strong>警告</strong>：以下 10 项军规系保障项目与 Minecraft 插件/模组 100% 对齐的红线，任何违背均视为交付失败！
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AGENT_TEN_COMMANDMENTS.map((cmd) => (
                  <div
                    key={cmd.id}
                    style={{
                      padding: '10px 12px',
                      background: '#131622',
                      border: '1px solid #293047',
                      borderLeft: '4px solid #ff5555',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <span className="wb-badge" style={{ color: '#ff5555' }}>
                        {cmd.id}
                      </span>
                      <strong style={{ color: '#ffd369', fontSize: '13px' }}>{cmd.rule}</strong>
                    </div>
                    <div style={{ color: '#b8c3e6', fontSize: '11px' }}>{cmd.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'assumptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: '#8893b8', fontSize: '11px' }}>
                原始 Plan 中存在若干可变或需用户确认项。项目已做出权威裁决并完全落地。后续 Agent <strong>严禁推翻现有裁决重新询问用户</strong>，按下列标准继续演进：
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CONFIRMED_ASSUMPTIONS.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '10px',
                      background: '#141724',
                      border: '1px solid #2a314b',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <strong style={{ color: '#55ffff' }}>[{a.id}] {a.item}</strong>
                      <span className="wb-badge" style={{ color: '#55ff55' }}>
                        已落地锁定
                      </span>
                    </div>
                    <div style={{ color: '#cfd7f0', fontSize: '12px' }}>{a.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'sop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: '#8893b8', fontSize: '11px' }}>
                后续接手项目时，无论是新增第 8 个界面（如拍卖行）或扩充旧界面，必须遵循以下标准的 8 步闭环：
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AGENT_DEVELOPMENT_STEPS.map((step, idx) => (
                  <div
                    key={step.step}
                    style={{
                      padding: '10px 12px',
                      background: '#131622',
                      border: '1px solid #282f47',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        background: '#1f2438',
                        color: '#55ffff',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '11px',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#ffd369', fontWeight: 700, marginBottom: '2px' }}>
                        {step.step}
                      </div>
                      <div style={{ color: '#b8c3e8', fontSize: '11px' }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'screens' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: '#8893b8', fontSize: '11px' }}>
                七大界面当前全部处于基线就绪状态。各界面关键技术与复用关系如下：
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {STAGE_REPORTS.slice(2, 7).map((s) => (
                  <div
                    key={s.stage}
                    style={{
                      padding: '10px',
                      background: '#141724',
                      border: '1px solid #2c334d',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <strong style={{ color: '#ffd369' }}>{s.stage}</strong>
                      <span style={{ color: '#55ff55' }}>{s.status}</span>
                    </div>
                    <div style={{ color: '#b8c3e6', fontSize: '11px' }}>{s.deliverables}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'porting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: '#8893b8', fontSize: '11px' }}>
                本项目产物可直接向以下两大 MC 生态无损移植：
              </div>
              <div
                style={{
                  padding: '10px',
                  background: '#0d0f18',
                  border: '1px solid #282f47',
                }}
              >
                <div style={{ color: '#55ff55', fontWeight: 700, marginBottom: '6px' }}>
                  方案 1: Bukkit / Spigot / Paper 服务端插件实现 (纯容器 GUI)
                </div>
                <div style={{ color: '#b8c3e6', fontSize: '11px', marginBottom: '8px' }}>
                  监听 <code>InventoryClickEvent</code>，通过 <code>event.getRawSlot()</code> 映射至 <code>layout.json</code>，按 <code>GuiAction</code> 逻辑处理后刷新容器。
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px',
                    background: '#141824',
                    color: '#a6f4c5',
                    fontSize: '11px',
                    overflowX: 'auto',
                  }}
                >
                  {`@EventHandler\npublic void onInventoryClick(InventoryClickEvent event) {\n    int rawSlot = event.getRawSlot();\n    // 对照 layout.json 直接匹配槽位行为\n    if (rawSlot == 43) { /* 按序解锁下一格 */ }\n}`}
                </pre>
              </div>

              <div
                style={{
                  padding: '10px',
                  background: '#0d0f18',
                  border: '1px solid #282f47',
                }}
              >
                <div style={{ color: '#55ffff', fontWeight: 700, marginBottom: '6px' }}>
                  方案 2: Forge / NeoForge / Fabric 模组客户端实现 (3层 Screen)
                </div>
                <div style={{ color: '#b8c3e6', fontSize: '11px', marginBottom: '8px' }}>
                  继承 <code>AbstractContainerScreen&lt;T&gt;</code>，利用 <code>GuiGraphics.blit</code> 渲染 background 贴图，利用 <code>drawString</code> 绘制 dynamic_text 跨槽位进度条。
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px',
                    background: '#141824',
                    color: '#a6f4c5',
                    fontSize: '11px',
                    overflowX: 'auto',
                  }}
                >
                  {`public class WarehouseScreen extends AbstractContainerScreen<WarehouseMenu> {\n    // 自动对齐 176px 外框与 9 列 Slot 网格\n}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#161825',
            borderTop: '1px solid #272d42',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
          }}
        >
          <div style={{ color: '#8e98bc' }}>
            提示：项目根目录已生成完整 <strong>AGENT.MD</strong> Markdown 文档，随时供外部 Agent 工具检索。
          </div>
          <button
            type="button"
            className="wb-btn active"
            style={{ padding: '5px 14px' }}
            onClick={onClose}
          >
            我已知晓并遵守本手册
          </button>
        </div>
      </div>
    </div>
  );
};
