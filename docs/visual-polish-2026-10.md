# 视觉打磨记录 (Visual Polish Pass) — 2026-10

> 本轮属于**纯视觉层优化**：不触碰任何槽位索引、`GuiAction` 协议、`mockServer` 状态机、
> `layout.json` 契约与 `src/export/` Canvas 导出管线。全部修改严格遵守 AGENT.MD 军规
> （18px 槽位网格、176px 容器宽度、`--gui-scale` 整数缩放、无外部 UI 库）。

## 一、修改清单

### 1. `src/index.css` — 视觉系统升级（主战场）
| 对象 | 优化内容 |
|---|---|
| `.mc-gui-frame` | 顶部高光渐变、四角皇家金铆钉（`::after` 4 向像素点）、分层投影（近场+远场），几何尺寸与 2px 斜切边框**完全不变** |
| `.mc-gui-header-rule` (新增) | 标题栏下金色渐变分隔线 + 中央旋转菱形宝石，作为 `background` 装饰层 |
| `.mc-slot` | 凹槽内阴影（上/左内生阴影增强深度）；hover 附加金色发丝环 + 白色高亮膜；selected 双层金环；focus-visible 青色键盘焦点环；locked 改为紫金斜纹 |
| `.mc-section-divider` | 玩家行囊分隔条改为带上下发丝边的凹槽条 |
| `.mc-currency-chip` (新增) | 金币/点券改为徽章化芯片（暗底 + 属性色描边 + 内阴影） |
| `.mc-progress-*` (新增) | 进度条轨道凹槽化；填充条带顶部斜切高光、18px 刻度线（`repeating-linear-gradient` 按 `--slot-size` 对齐槽位列）、底部暗边 |
| `.mc-tooltip` | 165° 深紫渐变底、双层紫晶描边（外 `#18042e` / 内 `#4b00e0`）、内发光、淡入动画 |
| `.wb-btn` | 工作台按钮升级为 MC 斜切立体按钮（上左亮/下右暗、按压反相、active 金框发光） |
| `.wb-badge` / `.wb-control-box` / `.wb-section-title` | 徽章描边芯片化；控制盒面板化；分节标题加金色 ◆ 标记 |
| `.stage-toolbar` / `.stage-toast` (新增) | 舞台工具条与提示条 class 化；Toast 按 `data-tone`（error/warning/success/info）显示左缘状态色 |
| `.mc-debug-banner` | DebugOverlay 横幅 class 化（青玉色系 + 外发光） |
| `.asset-thumb` (新增) | 导出抽屉资产缩略图棋盘格透底 |
| 滚动条 | 侧栏/抽屉 webkit 细滚动条（暗底圆角 thumb） |
| `.app-workbench` | 双径向渐变星空底 + 舞台中央柔光托盘 |

### 2. JSX 精修（仅 className / 装饰元素，无逻辑改动）
- `core/GuiFrame.tsx`：标题下插入 `.mc-gui-header-rule`；footerBanner 内联样式 → `.mc-gui-footer-banner`
- `core/ConfirmDialog.tsx`：同步 `.mc-gui-header-rule`
- `core/ProgressBar.tsx`：轨道/填充/文本 → class 化，填充色经 CSS 变量 `--fill` 注入（变色逻辑不变）
- `core/PlayerInventory.tsx`：金币/点券 → 徽章芯片
- `core/Slot.tsx`：占位底影图标 → `.mc-slot-placeholder`
- `dev/DebugOverlay.tsx`：横幅 → `.mc-debug-banner`
- `dev/Gallery.tsx`：工具条/提示条/分节标题/控制盒 class 化；提示条新增 `data-tone`；**DebugOverlay 默认 OFF**（开关功能不变，首屏更干净）
- `export/QuickExportDrawer.tsx`：缩略图容器 → `.asset-thumb`
- `vite.config.ts`：`server/preview.allowedHosts = true`（适配云端预览域名）

## 二、未触碰（军规红线复核）
- 槽位索引/`layout.json`/README 三件套：零改动
- `src/mock/server.ts` 状态机、`GuiAction` 类型：零改动
- `src/export/`（assetRegistry / canvasDrawers / atlasPacker / zipExporter）：零改动；
  导出贴图由独立 Canvas 绘制器生成，与 CSS 完全解耦 → 导出产物与优化前逐像素一致
- 九宫格参数（5/2/3/4px）、176×195 / 176×213 背景尺寸：无几何变化，无需调整

## 三、验证结果（scripts/verify.mjs，全 13 项 PASS）
- `npx tsc --noEmit`：0 错误；`npm run build`：0 警告
- 内置单元测试 10/10 PASS（堆叠/上限/解锁/校验/互斥/权限/CDK）
- 交互回归：铁砧搜索弹窗、分类切换、Tooltip、物品拿放、二次确认开合
- 导出回归：📸 截图 PNG、📦 当前界面 ZIP、导出抽屉单组件 PNG 均正常下载；
  导出工坊正常打开渲染；DebugOverlay 与 2x/3x/4x 缩放精确（4x 实测宽 704px=176×4）
- 控制台 0 报错

## 四、工具脚本（可选，非运行时依赖）
- `scripts/shots.mjs`：9 界面截图（`node scripts/shots.mjs shots/xxx`）
- `scripts/verify.mjs`：13 项功能/导出回归
- `scripts/confirm_shot.mjs`：二次确认弹窗截图
- 使用前需 `npm i -D playwright-core && npx playwright-core install chromium`（一次性，不入 dependencies）
