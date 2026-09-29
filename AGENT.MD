# AGENT.MD — Minecraft RPG 服务器 GUI 组件原型库开发准则与执行手册

> **文档适用对象**：接手本项目的后续 AI Agent 与人类开发者。  
> **项目仓库地址**：https://github.com/Neige7/ui-template  
> **文档法定地位**：本项目所有后续功能迭代、Bug 修复、界面扩展与技术重构，**必须严格遵守本文档之所有准则**。任何偏离本准则的设计（如破坏 18px 网格、绕过 GuiAction 状态抽象、引入外部重型 UI 库）均视为不合格交付。

---

## 目录
1. [项目愿景与非目标边界](#1-项目愿景与非目标边界)
2. [Minecraft 可移植性铁律 (核心架构军规)](#2-minecraft-可移植性铁律-核心架构军规)
3. [权威裁决与已做假设记录 (A1~A8 & Q1~Q5)](#3-权威裁决与已做假设记录-a1a8--q1q5)
4. [项目目录组织与职责规范](#4-项目目录组织与职责规范)
5. [核心组件库技术规范 (src/core)](#5-核心组件库技术规范-srccore)
6. [九大界面规格与状态机详析](#6-九大界面规格与状态机详析)
7. [研发阶段现状基线 (P0~P8) 与验收准则](#7-研发阶段现状基线-p0p8-与验收准则)
8. [Agent 标准开发流程 (SOP) 与操作规程](#8-agent-标准开发流程-sop-与操作规程)
9. [Agent 研发十诫 (禁忌与军规清单)](#9-agent-研发十诫-禁忌与军规清单)
10. [Minecraft 服务端 / 模组客户端移植工程指南](#10-minecraft-服务端--模组客户端移植工程指南)
11. [命令速查与测试验证手册](#11-命令速查与测试验证手册)

---

## 1. 项目愿景与非目标边界

### 1.1 核心使命
本项目并非单纯的网页产品，而是一个**面向 Minecraft RPG 服务器的交互式 GUI 原型组件库**。  
我们使用纯前端技术（Vite + React + TypeScript + 原生 CSS 变量），构建包含 **9 个标准界面**（玩家背包 Hub、任务视图、灵宠界面、坐骑界面、荣耀公会、信使邮箱、玩家仓库、箱子商店管理、箱子商店购买）的原型。

其终极价值是**能够被插件开发者与模组客户端开发者无缝拆分移植**：
- 导出为客户端资源包贴图切片 (`assets/.../textures/gui/`)
- 导出为容器 GUI 槽位布局配置 (`layout.json` 对应服务端容器槽位映射)
- 导出为服务端交互事件处理逻辑 (`GuiAction` 对应 Bukkit/Paper `InventoryClickEvent`)

### 1.2 "单界面交付三件套" 铁律
后续无论新增任何界面（如拍卖行、符文强化等），或重构已有界面，每个界面目录下**必须且只能**具备以下三件套：
1. **可交互的 Web 原型组件**：`{Name}Screen.tsx`，支持全部业务状态机与视觉状态；
2. **槽位布局配置文件**：`layout.json`，提供给服务端插件与客户端模组直接读取；
3. **交互与移植说明文档**：`README.md`，向后端开发者清晰说明槽位含义、事件映射、边界保护与移植代码示例。

### 1.3 非目标边界 (Out of Scope - 严禁擅自扩大范围)
- ❌ **不做真实后端**：严禁接入真实数据库、HTTP 接口或 WebSocket 通信，全量业务必须由纯纯函数 `mockServer` 模拟；
- ❌ **不做原生 Java 插件编写**：本项目只负责 Web 前端原型与跨端移植契约，不直接打包 `.jar`；
- ❌ **不使用 Mojang 原版贴图**：严禁从原版客户端提取并上传带有 Mojang 知识产权的 PNG 贴图；所有图标必须采用项目中已内置的 SVG / 纯 CSS 矢量像素图标；
- ❌ **不做移动端手势适配**：MC 属于桌面游戏，本原型仅面向桌面端浏览器（1280px 以上视口，支持鼠标左键、右键、Shift 点击、数字键交换）。

---

## 2. Minecraft 可移植性铁律 (核心架构军规)

所有代码必须无条件服从以下 7 条硬性物理与逻辑约束：

### 2.1 网格与尺寸规范 (Grid Spec)
- **1 槽位 = 18×18 px（原始未缩放像素）**；
- **槽内图标 = 16×16 px**，必须在 18×18 px 槽位内居中放置（四周边距各 1px）；
- **标准容器宽度 = 176 px**（9 列 × 18 px = 162 px，左右各留 7 px 边框，与原版箱子 `generic_54.png` 完全一致）；
- **全局缩放系数 `--gui-scale`**：仅允许为整数倍（`2x`、`3x`、`4x`），通过 CSS 变量 `var(--gui-scale)` 驱动；
- **像素渲染样式**：容器与所有图标强制设置 `image-rendering: pixelated; image-rendering: crisp-edges;`，禁止平滑插值；
- **字体标准**：默认使用开源商用像素字体 `DotGothic16`、`Silkscreen`，严格回退至 `JetBrains Mono, monospace`。

### 2.2 槽位索引模型 (Slot Index Model)
- **容器主工作区**：槽位索引严格为数字 `0 ~ rows * 9 - 1`（以 5 行容器为例，索引为 `0 ~ 44`）；
- **玩家背包区**：共 36 格，严格以 `P0 ~ P35` 标识：
  - `P0 ~ P26`：3 行 × 9 列 主背包存储区；
  - `P27 ~ P35`：1 行 × 9 列 快捷栏（对应原版快捷栏按键 1-9）；
- **`layout.json` 规范**：每个界面必须导出完整的槽位映射，允许连续范围写法（如 `"9-35": { "type": "storage" }`, `"P0-P26": { "type": "storage" }`）。

### 2.3 单一交互抽象 (GuiAction Pattern - 最核心原则)
UI 组件**绝对禁止直接修改任何业务数据**！严禁在 React 组件中写 `onClick={() => { warehouse.totalAmount++ }}`！

所有交互必须封装为标准的 `GuiAction`：
```ts
export interface GuiAction {
  screen: ScreenId;          // 'inventory' | 'warehouse' | 'quest' | 'pet' | 'mount' | 'guild' | 'mail' | 'shop_edit' | 'shop_buy'
  slot: number | string;     // 容器槽位 0~53（按 rows）或玩家背包 P0~P35
  click: 'left' | 'right' | 'shift_left' | 'shift_right' | 'number_key' | 'drop';
  payload?: unknown;         // 输入文本、数字键编号(1-9)、确认弹窗回调等
}
```
**数据流向**：  
`用户点击槽位` → `Slot 组件组装 GuiAction` → `dispatchAction(action)` → `mockServer.handle(oldState, action)` → `返回 newState + summary 描述` → `驱动 React 重新渲染`。  
这与 Bukkit 插件中 `InventoryClickEvent` → `插件业务逻辑` → `player.updateInventory()` 的模型完全一一对应。

### 2.4 三层渲染架构拆分 (`layers`)
每个界面的 `layout.json` 均声明了 `"layers": ["background", "dynamic_text", "items"]`：
1. **`background`（背景层）**：外框、凹槽底纹、进度条空槽底板。在 MC 模组客户端中对应 `GuiGraphics.blit()` 贴图，在纯插件中对应自定义字符背景；
2. **`dynamic_text`（动态文字层）**：跨槽位的进度条文字、容器标题、属性汇总横幅。在模组客户端中对应 `GuiGraphics.drawString()`，在纯插件中对应容器 Title 刷新或 Lore 显示；
3. **`items`（物品网格层）**：18×18 槽位内的 `ItemStack`、堆叠数字、耐久条、稀有度边框。在 MC 中对应 `Slot` 容器槽位。

### 2.5 槽位六大视觉状态 (Visual States)
所有槽位必须支持且只能处于以下 6 种视觉状态之一：
- `normal`：正常可用；
- `hover`：鼠标悬停高亮（白色半透明高亮膜，原版 MC 槽位特性）；
- `selected`：当前选中态（如分类 Tab、当前选中的任务/宠物/邮件）；
- `disabled`：禁用不可点击（如第 1 页的上一页按钮、未接取任务的放弃按钮）；
- `locked`：未解锁锁定态（显示金色锁图标，如仓库未购买的槽位）；
- `hidden`：不可见（如隐藏的空按钮、条件未达成时不渲染的动作）。

### 2.6 文本输入源桥接标注 (`mcInputSource`)
对于需要文本输入的场景（如搜索、改名、CDK 兑换、创建公会），网页中以 `TextInputModal` 弹窗模拟，但必须显式标注其在 MC 中的实现途径：
- `anvil`（铁砧输入 `AnvilGUI`）：简短文本输入（搜索词、宠物名字、CDK 码、公会名，以及箱子商店单价、库存和购买数量）；
- `sign`（告示牌输入 `SignGUI`）：公会公告多行编辑；
- `chat`（聊天栏捕获 `AsyncPlayerChatEvent`）：邮件长篇正文；
- `mod_textfield`（模组文本框 `EditBox / GuiTextField`）：模组客户端原生嵌入式文本框。

### 2.7 样式技术选型禁令
- **严禁在核心 GUI 组件中引入 Tailwind 布局类或外部 UI 框架（如 AntD、MUI、Shadcn）**；
- 容器内部所有尺寸必须以 `--gui-scale` 和 CSS 变量绝对计算；
- 文本格式解析支持标准 Minecraft `§` 颜色代码（`§0` ~ `§f`，`§l` 粗体，`§o` 斜体）。

---

## 3. 权威裁决与已做假设记录 (A1~A8 & Q1~Q5)

当开发过程中遇到歧义时，**以本章权威记录为准**，严禁停工等待：

| 标识 | 议题 / 问题 | 裁决方案 (已落地并锁定) | 理由与 MC 落地考量 |
|---|---|---|---|
| **A1** | 仓库存储容量 | **3 行 × 9 列 = 27 格 / 页** | 与原版单箱子容量完全吻合，避免分页数据混乱 |
| **A2** | 玩家背包布局 | **3×9 主背包 (P0-P26) + 1×9 快捷栏 (P27-P35) = 36 格** | 严格与原版玩家背包数据结构对齐 |
| **A3** | 容器总行数 | **常规界面采用 5 行 (45 格)；`shop_edit` / `shop_buy` 采用 6 行 (54 格)** | 常规界面保留上下功能栏；箱子商店使用标准 Double Chest 容器并容纳超大库存控制面板 |
| **A4 & Q1** | 仓库"总数量"统计模式 | **默认按「所有页面物品堆叠数量之和 / 最大上限」**；槽位 37 支持左键点击切换为「占用槽位数 / 已解锁槽位数」 | 满足用户确认项 1，同时提供双模式切换预览，极大方便策划测试 |
| **A5** | 仓库槽位解锁 | **按序逐个解锁，未解锁槽位渲染为 `locked` 锁图标** | 对应插件玩家金币购买槽位权限逻辑；全满时解锁按钮自动隐藏 |
| **A6 & Q3** | 宠物出战与装备槽 | **单宠出战互斥**（同时只能有 1 只宠物处于出战状态）；宠物装备槽**默认开启 1 个（槽位 23）**，支持槽位 7 点击切换 3 格扩展槽预览 | 满足用户确认项 3，兼顾轻量与深度 RPG 玩法 |
| **A7 & Q2** | 客户端 GUI 架构 | **模组客户端 GUI + 服务端插件容器混合架构** | 既保证 9 列槽位与 Bukkit 兼容，又充分利用客户端 3 层切片绘制能力 |
| **A8 & Q5** | 像素美术风格 | **奇幻简约 RPG 风格 (Fantasy Slate)** | 深石板蓝背景 (`#252736`) + 暗银凹槽 + 皇家金镶边 (`#d4a64a`)，使用纯矢量 SVG 像素图标，零 Mojang 版权素材 |
| **Q4** | 公会职位与层级规则 | **四级架构：会长 (`leader`) > 副会长 (`vice_leader`) > 精英 (`elite`) > 成员 (`member`)** | 输出完整权限矩阵文档，并在界面中内置实时职位权限切换模拟器 |

---

## 4. 项目目录组织与职责规范

```
ui-template/
├── AGENT.MD                     # 本文档：Agent 执行手册与研发宪章
├── index.html                   # 入口 HTML (引入 DotGothic16 / Silkscreen 字体)
├── package.json                 # 依赖声明 (React 19 + TypeScript 5.9 + Vite 7)
├── tsconfig.json                # TS 严格配置 (strict: true)
├── docs/
│   └── porting-guide.md         # 服务端 / 模组客户端拆分与移植指南
└── src/
    ├── types/
    │   └── index.ts             # 核心数据模型与 GuiAction 类型定义 (唯一权威来源)
    ├── core/                    # 通用 MC 容器组件库 (严禁包含具体业务)
    │   ├── GuiFrame.tsx         # 容器外框 (176px 基准、9 列网格、标题栏)
    │   ├── Slot.tsx             # 18×18 槽位单元 (支持 6 大视觉状态与所有点击事件)
    │   ├── ItemIcon.tsx         # 16×16 像素图标矢量绘制库 (装备、材料、伙伴、UI按钮)
    │   ├── Tooltip.tsx          # MC 原版深紫边框 Lore 悬停窗 (支持 § 代码与超长警告)
    │   ├── MinecraftText.tsx    # § 格式化文本解析渲染器
    │   ├── PlayerInventory.tsx  # 3×9+1×9 玩家背包组件 (P0~P35)
    │   ├── Pager.tsx            # 上一页 / 页码 / 下一页标准翻页组
    │   ├── TabBar.tsx           # 水平分类标签按钮组 (带选中态高亮)
    │   ├── ProgressBar.tsx      # 跨槽位动态进度条 (经验条、容量条、等级条)
    │   ├── ConfirmDialog.tsx    # 二次确认对话框 (模拟 MC 二级确认 GUI)
    │   ├── TextInputModal.tsx   # 文本输入弹窗 (标注 anvil / sign / chat 来源)
    │   ├── CursorItem.tsx       # 鼠标手持抓取物品跟随层
    │   └── GuiContext.tsx       # 交互派发器与 Tooltip 全局 Context
    ├── screens/                 # 9 大业务界面目录 (高内聚、自包含)
    │   ├── warehouse/           # 6.7 玩家仓库
    │   ├── inventory/           # 6.1 背包修改版 Hub
    │   ├── quest/               # 6.2 任务视图
    │   ├── pet/                 # 6.3 灵宠契约 (包含共享 CompanionTemplate)
    │   ├── mount/               # 6.4 皇家坐骑 (100% 复用 CompanionTemplate)
    │   ├── guild/               # 6.5 荣耀公会 (含权限矩阵与仓库复用)
    │   ├── mail/                # 6.6 信使邮箱 (系统/玩家/CDK/发件)
    │   ├── chest_shop_edit/     # 6.8 箱子商店管理 (单品上架/超大库存/货币)
    │   └── chest_shop_buy/      # 6.9 箱子商店购买 (容量/库存/余额校验)
    ├── mock/                    # 服务端模拟层 (纯纯函数状态机)
    │   ├── server.ts            # mockServer.handle(state, action) 单一处理器 (核心大脑)
    │   ├── data/                # 假数据种子 (items, quests, companions, guilds, mails)
    │   └── scenarios/           # 预设场景库 (正常 / 空数据 / 满载多页 / 边界异常)
    ├── i18n/
    │   └── zh_CN.ts             # 集中式本地化字典 (与服务端 messages.yml 对齐)
    └── dev/                     # 开发者工作台与验收工具
        ├── Gallery.tsx          # 界面总览、场景切换、右侧文档与实时日志监控抽屉
        ├── DebugOverlay.tsx     # 18px 网格对齐辅助线与槽位索引显示开关
        ├── TestRunnerModal.tsx  # 内置自动化单元测试执行器 (10 大核心逻辑自检)
        └── testHelpers.ts       # 单元测试断言辅助工具
```

---

## 5. 核心组件库技术规范 (src/core)

### 5.1 `Slot.tsx`
- **尺寸**：固定为 `calc(18px * var(--gui-scale))`；
- **事件监听**：
  - `onClick`：普通左键点击 (`left`)；
  - `onContextMenu`：阻止浏览器右键菜单，触发 `right` 点击；
  - `Shift 键判定`：在点击时若 `e.shiftKey === true`，自动转化为 `shift_left` 或 `shift_right`；
  - `onKeyDown`：支持按键 `1~9`，自动触发 `number_key` 并将按键作为 `payload` 发送；
- **视觉反馈**：通过 `visualState` 控制凹凸边框与高亮膜，严格禁止超出 18px 边界。

### 5.2 `ItemIcon.tsx`
- **尺寸**：固定为 `calc(16px * var(--gui-scale))`；
- **渲染方案**：全部采用项目内置的高清矢量像素 SVG，自带 1px 像素投影；
- **扩展规范**：如需新增物品，优先在 `ItemIcon.tsx` 内注册对应的 SVG 图案或纯色块字母徽章，**严禁引入外链图片**（防止网络加载失败）。

### 5.3 `Tooltip.tsx` & `MinecraftText.tsx`
- **MC 经典深紫边框**：外边框 `#100010`，内边框双色渐变紫 `#28007f` 至 `#140038`，背景半透明黑底；
- **§ 代码解析**：完整支持 `§0`（黑）至 `§f`（白），以及 `§6`（金）、`§a`（浅绿）、`§b`（水蓝）、`§d`（粉紫）、`§e`（亮黄）；
- **开发告警**：在 `debugMode === true` 下，若单行文本字符数超过 38 字符，在 Tooltip 底部高亮打印 `[MC Warning] 单行 Lore 超长，实机可能溢出容器边界`。

### 5.4 `ProgressBar.tsx`
- **设计原理**：MC 容器槽位网格无法直接放置连续进度条，因此进度条必须标注为 `background` 与 `dynamic_text` 层，跨越连续的槽位绘制（如槽位 `38~42` 跨 5 格）；
- **视觉特征**：凹槽黑色底板，内嵌带斜切高光的像素进度填充条，并在中央清晰标注进度文字（如 `1,420 / 3,000`）。

---

## 6. 九大界面规格与状态机详析

> 本节编号沿用 Gallery 导航编号；仓库样板虽列在本节前部，编号仍为 6.7。

### 6.7 玩家仓库 (`warehouse` · 样板界面)
- **网格**：5 行 45 格 (`0~44`) + 玩家背包 36 格 (`P0~P35`)；
- **槽位定义**：
  - `0 ~ 5`：物品分类筛选 Tab（全部 / 装备 / 材料 / 消耗品 / 任务物品 / 其他），切换时重置页码为 1；
  - `6`：返回背包 Hub；
  - `7`：一键整理与稀有度降序排序；
  - `8`：搜索按钮（左键打开铁砧搜索，右键清除搜索）；
  - `9 ~ 35`：27 个仓库存储槽位；未解锁槽位显示为 `locked`；
  - `36, 44`：上一页 / 下一页；
  - `37`：页码指示（左键切换 `stack_sum` 与 `slot_count` 统计模式）；
  - `38 ~ 42`：总量限制条（接近 100% 自动变红并拦截溢出存入）；
  - `43`：解锁下一个槽位（根据金币与权限判定，达到上限自动隐藏）。

### 6.1 玩家行囊 Hub (`inventory` · 系统总枢纽)
- **装备槽位（第 0 列原版 + 第 1 列 RPG 首饰）**：
  - `0` 头盔、`9` 胸甲、`18` 护腿、`27` 战靴、`36` 副手盾牌；
  - `1` 项链、`10` 戒指 1、`19` 戒指 2、`28` 护符；
- **严格校验**：`isPlayerEquipSlotMatch`，防具与首饰类型不符时严禁放入；
- **中部区域**：角色纸娃娃 3×4 预览区，悬停可查看汇总全属性面板（基础 + 装备 + 出战灵宠 + 骑乘坐骑加成）；
- **右侧 Hub 导航按钮**：直达任务 (`6`)、灵宠 (`7`)、坐骑 (`8`)、公会 (`15`)、邮箱 (`16`，附带未读红点)、仓库 (`17`)。

### 6.2 任务委托 (`quest`)
- **同屏分栏架构**：左侧 `0~4` 顶部切换五大分类（主线/支线/日常/周常/活动，切换重置页码为 1）；
- **列表与详情**：
  - `9~13, 18~22`：任务列表，角标显示状态颜色；
  - `15`：任务卷轴详情槽（悬停查看任务故事与目标达成度 `current/target`）；
  - `24 ~ 26`：真实奖励物品槽（可悬停查看装备属性词条）；
- **状态流转按钮**：
  - `41`：追踪 / 取消追踪（对接服务端 Scoreboard）；
  - `42`：放弃任务（必须弹出 `ConfirmDialog` 二次确认）；
  - `43`：接取任务（未接时） / 提交领奖（可提交时，自动校验背包余量并给予奖励）。

### 6.3~6.4 灵宠契约 (`pet`) 与 皇家坐骑 (`mount`)
- **架构级复用**：`MountScreen` 100% 复用 `CompanionTemplate.tsx` 组件，仅通过注入 `PET_CONFIG` 与 `MOUNT_CONFIG` 区分；
- **灵宠特有规则**：单只出战互斥；槽位 `23` 为宠物专属装备槽（槽位 `7` 切换 3 格预览）；槽位 `42` 消耗星魂果露升级；槽位 `43` 铁砧改名；槽位 `44` 二次确认放生；
- **坐骑特有规则**：展示骑乘移动速度（如 `+165%`）；槽位 `41` 文案为「骑乘 / 设为默认」；槽位 `26` 支持在已解锁形态间循环切换；鞍具槽校验 `mount_saddle / mount_barding / mount_spurs`。

### 6.6 信使邮箱 (`mail`)
- **四大 Tab (`0 ~ 3`)**：系统邮件 / 玩家邮件 / CDK 兑换 / 发送新邮件（Tab 上实时显示未读红点）；
- **过期保护**：已过期邮件标题标灰，领取按钮变更为 `disabled`，严禁提取过期附件；
- **CDK 四大状态闭环**：内置槽位 `19~22` 测试按钮，完整覆盖成功 (`success`)、无效 (`invalid`)、已使用 (`used`)、已过期 (`expired`) 状态；
- **写信与发件**：收件人 (`10`)、标题 (`11`)、正文 (`12`)、暂存附件槽 (`21~24`)、固定邮费 (`15`)，发送前强制二次确认。

### 6.5 荣耀公会 (`guild`)
- **未入会模式**：展示全服公会分页列表、铁砧搜索公会、创建公会（校验 2~12 字符与 20,000 金币）；
- **已入会模式**：顶部 `0~6` 切换概览、成员、审批、捐献、仓库、日志、设置七大子页面；
- **公会仓库复用**：直接挂载 `ReusableWarehouseGrid`，复用全部仓库交互；
- **权限矩阵严密控制**：
  - 普通成员禁止从公会仓库取出物品（槽位放入不受限）；
  - 踢人、升降职、转让会长、修改公告强制检查职位权限并弹出二次确认；
  - 界面内置「职位权限模拟器」（槽位 `7`），可一键切换会长/副会长/精英/成员，实时验证按钮权限过滤。

### 6.8 箱子商店管理 (`shop_edit`)
- **网格**：6 行 54 格 (`0~53`) + 玩家背包 36 格 (`P0~P35`)，对应标准 Double Chest 容器。
- **单品上架**：`chestShop.targetItem` 初始为 `null`；点击玩家背包中的物品后完成上架并把该组物品转入 `stock`，上架后只能存入同类物品。
- **超大库存与货币**：`stock` 受 `maxStock`（基线为 5,000）限制，支持金币 (`gold`)、点券 (`gems`) 和绿宝石 (`emerald`) 三种结算货币；`unitPrice` 最低为 1。
- **关键动作**：货币选择使用槽位 `2/3/4`，单价调整使用 `11/12/14/15/19/25`，铁砧输入使用 `21/22`，存取库存使用 `28~31`，快捷填充使用 `32`，下架使用 `34`；右键槽位 `13` 也执行下架并退回库存。

### 6.9 箱子商店购买 (`shop_buy`)
- **商品展示**：槽位 `13` 展示当前在售商品；未上架时提示切换到 `shop_edit`，不允许执行购买。
- **数量约束**：槽位 `18~26` 调整或输入 `buyAmount`，数量不得超过商店库存或 `calculateMaxInventoryCapacity` 计算出的背包剩余空间；槽位 `23` 一键取库存与背包空间的可行上限，余额在确认购买时校验。
- **结算动作**：槽位 `31` 执行串行校验（库存 → 背包空间 → 余额），通过后扣除对应货币、减少库存，并按原版 64 堆叠规则写入 `P0~P35`；任一步失败都不得改变商品或余额。
- **移植要求**：金币和点券映射 Vault / PlayerPoints 账户；绿宝石必须从玩家背包扣除；服务端必须重新计算容量并校验，不能信任客户端传入的购买数量。

---

## 7. 研发阶段现状基线 (P0~P8) 与验收准则

| 阶段 | 内容定位 | 交付物清单 | 状态 | 验收自检基线 |
|---|---|---|---|---|
| **P0** | 脚手架与协议 | 项目结构、`src/types/index.ts`、`mockServer` 骨架、集中式 `i18n` | **✔ 100% 达成** | `tsc --noEmit` 零报错；`GuiAction` 协议冻结 |
| **P1** | 核心通用组件库 | 13 个 core 组件 + `DebugOverlay` + 18px 物理槽位 | **✔ 100% 达成** | 严格符合 18×18 槽位与 176px 外框；Tooltip 支持 § 代码 |
| **P2** | 仓库与背包 (Hub) | `WarehouseScreen`、`InventoryScreen`、`layout.json`、README | **✔ 100% 达成** | 27 格存储、总量条变色、按序解锁、部位校验、Shift 穿戴通过 |
| **P3** | 任务视图 | `QuestScreen`、`layout.json`、README | **✔ 100% 达成** | 5 大分类切换重置页码、同屏奖励悬停、四状态按钮、放弃二次确认 |
| **P4** | 灵宠与坐骑 | `CompanionTemplate`、`PetScreen`、`MountScreen` | **✔ 100% 达成** | 零重复代码复用、单宠出战互斥、移速展示、鞍具类型隔离 |
| **P5** | 邮箱系统 | `MailScreen`、`layout.json`、README | **✔ 100% 达成** | 4 大 Tab、未读红点、过期拦截、CDK 四状态测试、写信暂存槽 |
| **P6** | 公会与权限矩阵 | `GuildScreen`、`permissionMatrix.ts`、README | **✔ 100% 达成** | 7 大子页面、公会仓库复用、职位实时模拟、人事与存取权限鉴权 |
| **P7** | 导出打磨与测试 | `docs/porting-guide.md`、`TestRunnerModal` (10项全绿) | **✔ 100% 达成** | 单元测试 100% 通过；导出 JSON 规范；三层渲染解耦 |
| **P8** | 箱子商店 | `ChestShopEditScreen`、`ChestShopBuyScreen`、`ChestShopState`、两个 `layout.json` 与 README | **✔ 100% 达成** | 单品上架、超大库存、多货币切换、背包容量/库存/余额三重购买校验 |

---

## 8. Agent 标准开发流程 (SOP) 与操作规程

当接手新增需求或进行界面调整时，Agent 必须严格按以下 8 步执行：

```
[步骤 1: MC 可行性评估]
  └─ 确认需求能否落在 9 列槽位网格上？能否对应 Bukkit/Mod 机制？若不能，拒绝并提出符合 MC 的替代方案。
[步骤 2: 规划槽位分配与 layout.json]
  └─ 按界面 rows 确定 0~53（5 行界面为 0~44）槽位功能，编辑或新建对应的 layout.json。
[步骤 3: 扩充/核对类型定义]
  └─ 在 src/types/index.ts 中追加新的 Action 动作名、数据模型字段。
[步骤 4: 实现 mockServer 状态机纯函数]
  └─ 在 src/mock/server.ts 中编写对应 action 的处理分支，返回全新的不可变状态 (Immutable State) 与描述文本。
[步骤 5: 编写或更新 Screen 组件]
  └─ 仅通过 dispatchAction 发送 GuiAction，读取 serverState 渲染视图，支持 6 大视觉状态。
[步骤 6: 编写 4 种典型 Mock 场景]
  └─ 在 scenarios.ts 中注入：1.正常状态；2.空数据状态；3.多页满载状态；4.边界异常状态（如背包满、已过期、无权限）。
[步骤 7: 扩充与运行单元测试]
  └─ 在 src/dev/TestRunnerModal.tsx 中补充该功能的自动化测试用例，确保全部通过。
[步骤 8: 更新 README.md 并执行构建自检]
  └─ 补充槽位表与 MC 实现说明，运行 npx tsc --noEmit 与 npm run build 确保零错误。
```

---

## 9. Agent 研发十诫 (禁忌与军规清单)

1. **第一诫：绝对禁止绕过 GuiAction**  
   任何业务状态流转必须由 `mockServer.handle` 纯函数处理，严禁组件内私设状态篡改核心数据。
2. **第二诫：绝对禁止偏离 18px 槽位网格**  
   所有按钮与交互点必须是 18×18 槽位或标准槽位组合，严禁任意摆放游离的网页悬浮按钮。
3. **第三诫：绝对禁止引入重型外部 UI 库**  
   严禁使用 npm 安装 AntD、MUI、Shadcn UI 等；原生 CSS 变量是保证像素等比缩放的唯一标准。
4. **第四诫：绝对禁止使用 Mojang 原版贴图素材**  
   所有视觉资产使用项目内置的 SVG 像素代码或纯色字符，保持完全开源合法与可定制性。
5. **第五诫：绝对禁止违背 176px 容器宽度**  
   9 列网格宽度必须恒定为 162px，加双侧 7px 边框为 176px，保证与原版贴图 1:1 吻合。
6. **第六诫：绝对禁止在深层业务中硬编码中文字符串**  
   所有通用提示、弹窗文案集中放入 `src/i18n/zh_CN.ts`，方便后续一键导出为服务器语言包。
7. **第七诫：遇到歧义绝对不要停工等待**  
   遇到需求模糊时，严格按照第 3 章的裁决继续推进，并在开发日志中明确记录"已做假设"。
8. **第八诫：编写伙伴与仓库逻辑时必须复用组件**  
   坐骑界面必须复用 `CompanionTemplate`，公会仓库必须复用 `ReusableWarehouseGrid`，严禁复制代码！
9. **第九诫：破坏原有单元测试者严禁交付**  
   每次改动后必须运行内置单元测试套件，10 项核心测试必须 100% 保持绿色通过。
10. **第十诫：每次修改必须同步更新 layout.json 与 README**  
    槽位有变动时，必须同步修改对应的 `layout.json`，确保插件开发者拿到的配置始终准确无误。

---

## 10. Minecraft 服务端 / 模组客户端移植工程指南

### 10.1 Bukkit / Paper 服务端插件移植映射
```java
// 示例：Bukkit 插件中监听玩家点击仓库槽位 43 (解锁下一个槽位)
@EventHandler
public void onInventoryClick(InventoryClickEvent event) {
    if (!event.getView().getTitle().contains("星辰私人仓库")) return;
    event.setCancelled(true); // 默认阻止原版默认拿取
    
    int rawSlot = event.getRawSlot();
    Player player = (Player) event.getWhoClicked();
    
    // 映射至 GuiAction: slot 43
    if (rawSlot == 43) {
        WarehouseData data = WarehouseManager.get(player);
        if (data.canUnlockNext(player)) {
            data.unlockNextSlot(player);
            player.sendMessage("§a[仓库] 成功解锁下一格槽位！");
            WarehouseGUI.open(player, data.getCurrentPage()); // 刷新容器
        } else {
            player.sendMessage("§c[仓库] 金币不足或已达解锁上限！");
        }
        return;
    }
    
    // 映射至 27 格存储槽位 9..35
    if (rawSlot >= 9 && rawSlot <= 35) {
        int pageIndex = (currentPage - 1) * 27 + (rawSlot - 9);
        WarehouseManager.handleClick(player, pageIndex, event.getClick());
    }
}
```

### 10.2 Forge / NeoForge / Fabric 模组客户端移植映射
```java
// 示例：继承 AbstractContainerScreen 实现 3 层渲染
public class WarehouseScreen extends AbstractContainerScreen<WarehouseMenu> {
    private static final ResourceLocation BG_TEXTURE = new ResourceLocation("myrpg", "textures/gui/warehouse.png");

    public WarehouseScreen(WarehouseMenu menu, Inventory playerInventory, Component title) {
        super(menu, playerInventory, title);
        this.imageWidth = 176;
        this.imageHeight = 222; // 5 行容器 + 玩家背包
    }

    @Override
    protected void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
        // Layer 1: background 贴图层
        graphics.blit(BG_TEXTURE, this.leftPos, this.topPos, 0, 0, this.imageWidth, this.imageHeight);
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        super.render(graphics, mouseX, mouseY, partialTick);
        // Layer 2: dynamic_text 跨槽位进度条文字绘制 (槽位 38..42 上方)
        String progressText = menu.getTotalAmount() + " / " + menu.getMaxTotalAmount();
        graphics.drawString(this.font, progressText, this.leftPos + 80, this.topPos + 82, 0xFFFFFF);
        
        // Layer 3: 原版自动渲染 Slot 内的 ItemStack
        this.renderTooltip(graphics, mouseX, mouseY);
    }
}
```

---

## 11. 命令速查与测试验证手册

| 操作目标 | 命令 / 交互途径 | 预期标准 |
|---|---|---|
| **启动本地工作台** | `npm run dev` | 浏览器秒级热更新，打开 Gallery 界面，无控制台报错 |
| **生产构建打包** | `npm run build` | 输出单个 `dist/index.html`，0 警告，0 报错 |
| **严格类型校验** | `npx tsc --noEmit` | 全量 TypeScript 严格类型检查 0 错误 |
| **运行单元测试套件** | 打开工作台右上角「⚡ 运行核心单元测试」 | 10 个测试用例（堆叠、上限、解锁、隔离、互斥、权限等）全部显示 **✔ PASSED** |
| **切换预设场景** | 点击左侧「预设测试场景 (Mock Scenarios)」 | 快速切换正常、空数据、满载多页、边界权限等场景 |
| **切换像素缩放系数** | 点击左侧 `--gui-scale` (2x / 3x / 4x) | 全界面整齐等比像素缩放，无模糊，网格严密对齐 |
| **开启槽位调试网格** | 勾选「网格对齐辅助与槽位索引 (DebugOverlay)」 | 每个槽位中央精确叠加显示槽位编号（按界面显示 `0~44` 或 `0~53`，以及 `P0~P35`） |
| **导出布局配置** | 打开右侧抽屉「槽位布局 JSON」点击「⬇ 导出 JSON」 | 立即下载该界面的标准化 `layout.json` |

---
> **签署说明**：本规范自制定之日起生效。所有后续 AI Agent 在修改或新增代码前，应以此文件作为唯一行为准则。
