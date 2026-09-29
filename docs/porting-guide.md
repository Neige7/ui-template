# Minecraft RPG 服务器 GUI 原型组件库 — 拆分与移植指南 (`docs/porting-guide.md`)

## 1. 架构总览与核心约束

本原型库专为 **Minecraft RPG 服务器（模组客户端 GUI + 服务端插件容器混合架构）** 设计，所有组件严格遵守以下三条黄金准则：

1. **像素与网格规范（3.1）**：
   - 基础槽位单位：`18×18 px`（原始像素），内部物品图标 `16×16 px` 居中渲染。
   - 标准容器宽度：`176 px`（9 列 × 18 px = 162 px，左右各留 7 px 边框边距，与原版箱子 `generic_54.png` 完全一致）。
   - 全局缩放因子：`--gui-scale` 支持 `2x / 3x / 4x` 整数倍缩放，严格开启 `image-rendering: pixelated`。
2. **槽位索引模型（3.2）**：
   - 容器主区域：最多 6 行，索引为 `0 ~ rows*9 - 1`（本库 7 个界面统一采用 5 行 = `0 ~ 44`）。
   - 玩家背包区域：3×9 主背包（`P0 ~ P26`）+ 1×9 快捷栏（`P27 ~ P35`），共 36 格。
3. **单一交互抽象 `GuiAction`（3.3）**：
   - 没有任何前端 UI 组件直接修改业务状态。
   - 所有交互统一封装为 `GuiAction { screen, slot, click, payload }` 发送给 `mockServer.handle(state, action)`。
   - **移植到 Bukkit/Paper/Spigot 插件时**：监听 `InventoryClickEvent`，读取 `event.getRawSlot()` 与 `event.getClick()`，直接映射为对应的 `action` 处理函数，随后调用 `player.updateInventory()`。
   - **移植到 Forge/Fabric/NeoForge 模组客户端时**：继承 `AbstractContainerScreen<T>`，复用各界面的 `layout.json` 坐标定义，将 `background` 层绑定为资源包 PNG 贴图，`dynamic_text` 层绑定至 `GuiGraphics.drawString()`。

---

## 2. 三层渲染结构拆分方案 (`layers`)

每个界面的 `layout.json` 均声明了 `"layers": ["background", "dynamic_text", "items"]`：

| 图层 | Web 原型对应元素 | MC 模组客户端实现 | MC 纯插件容器 + 资源包实现 |
|---|---|---|---|
| `background` | `.mc-gui-frame` 外框、槽位凹槽底纹、进度条底框 | `GuiGraphics.blit(TEXTURE, leftPos, topPos, ...)` | 自定义 Font 偏移贴图（ItemsAdder / Oraxen 负空格字符 + 容器标题覆盖） |
| `dynamic_text` | 容器标题、跨槽位进度条文字 (`ProgressBar`)、底部属性横幅 | `GuiGraphics.drawString(font, Component, x, y, color)` | 动态更新容器 Title 或映射至槽位物品的 `ItemMeta.displayName / lore` |
| `items` | 18×18 槽位内的 `ItemIcon`、堆叠数量、角标 | `Slot` 内 `ItemStack` 渲染 + `CustomModelData` | `Inventory.setItem(slot, itemStack)` |

---

## 3. 文本输入源桥接规范 (`mcInputSource`)

针对搜索、改名、CDK 兑换、写信与创建公会等需要输入文本的场景，原型中通过 `TextInputModal` 明确标注了 MC 落地方案：
- **`anvil`（铁砧输入 `AnvilGUI`）**：用于仓库搜索（槽位 8）、灵宠/坐骑改名（槽位 43）、CDK 兑换（槽位 11）、公会创建（槽位 4）及收件人/标题输入。
- **`sign`（告示牌输入 `SignGUI`）**：用于公会公告多行编辑（槽位 19/21）。
- **`chat`（聊天栏捕获 `AsyncPlayerChatEvent`）**：用于长篇邮件正文输入（槽位 12）。
- **`mod_textfield`（模组客户端 `EditBox / GuiTextField`）**：由于服务器采用模组客户端（用户确认项 2），可在客户端 GUI 直接内嵌原生 `EditBox` 控件并通过 CustomPayload 发包至服务端，体验更丝滑。

---

## 4. 七大界面汇总与组件复用对照

| 界面 ID | 行数 | 核心复用组件 | 关键槽位分配 |
|---|---|---|---|
| `warehouse` (玩家仓库) | 5 行 (45格) | `ReusableWarehouseGrid` | `0-5` 分类, `7` 排序, `8` 搜索, `9-35` 存储(27格/页), `36/37/44` 分页, `38-42` 总量条, `43` 解锁下一格 |
| `inventory` (角色行囊 Hub) | 5 行 (45格) | `GuiFrame`, `Slot` | `0,9,18,27,36` 防具与副手, `1,10,19,28` 项链/双戒指/护符, `6-8,15-17` 六大系统 Hub 入口 |
| `quest` (任务委托) | 5 行 (45格) | `PagerSlot`, `Slot` | `0-4` 五大分类(切换重置页码为1), `9-13,18-22` 任务列表, `15` 详情, `24-26` 奖励槽, `41-43` 追踪/放弃/接取/提交 |
| `pet` (灵宠契约) | 5 行 (45格) | `CompanionTemplate` | `9-12,18-21` 宠物列表, `14` 详情, `15-17` 经验条, `23(-25)` 宠物护具槽, `41-44` 出战/喂养/改名/放生 |
| `mount` (皇家坐骑) | 5 行 (45格) | `CompanionTemplate` (100%复用) | 复用宠物模板，差异项：显示移速、按钮改为「骑乘/设为默认」、槽位 `26` 外观形态切换 |
| `mail` (信使邮箱) | 5 行 (45格) | `PagerSlot`, `Slot` | `0-3` 系统/玩家/CDK/发件 Tab(带未读红点), `19-22` CDK 四状态测试, `21-24` 发件附件槽, `41-44` 批量与单封操作 |
| `guild` (荣耀公会) | 5 行 (45格) | `ReusableWarehouseGrid` + 权限矩阵 | 未入会列表/搜索/创建；已入会 `0-6` 七大子页面，公会仓库直接复用 `ReusableWarehouseGrid` 并受权限矩阵控制 |
