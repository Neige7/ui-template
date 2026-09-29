# Minecraft RPG 服务器 GUI 原型组件库 — 拆分与移植指南 (`docs/porting-guide.md`)

## 1. 架构总览与核心约束

本原型库专为 **Minecraft RPG 服务器（模组客户端 GUI + 服务端插件容器混合架构）** 设计，所有组件严格遵守以下三条黄金准则：

1. **像素与网格规范（3.1）**：
   - 基础槽位单位：`18×18 px`（原始像素），内部物品图标 `16×16 px` 居中渲染。
   - 标准容器宽度：`176 px`（9 列 × 18 px = 162 px，左右各留 7 px 边框边距，与原版箱子 `generic_54.png` 完全一致）。
   - 全局缩放因子：`--gui-scale` 支持 `2x / 3x / 4x` 整数倍缩放，严格开启 `image-rendering: pixelated`。
2. **槽位索引模型（3.2）**：
   - 容器主区域：最多 6 行，索引为 `0 ~ rows*9 - 1`；7 个常规界面采用 5 行 (`0 ~ 44`)，箱子商店 `shop_edit` / `shop_buy` 采用 6 行 (`0 ~ 53`)。
   - 玩家背包区域：3×9 主背包（`P0 ~ P26`）+ 1×9 快捷栏（`P27 ~ P35`），共 36 格。
3. **单一交互抽象 `GuiAction`（3.3）**：
   - 没有任何前端 UI 组件直接修改业务状态。
   - 所有交互统一封装为 `GuiAction { screen, slot, click, payload }` 发送给 `mockServer.handle(state, action)`。
   - **移植到 Bukkit/Paper/Spigot 插件时**：监听 `InventoryClickEvent`，读取 `event.getRawSlot()` 与 `event.getClick()`，直接映射为对应的 `action` 处理函数，随后调用 `player.updateInventory()`。
   - **移植到 Forge/Fabric/NeoForge 模组客户端时**：继承 `AbstractContainerScreen<T>`，复用各界面的 `layout.json` 坐标定义，将 `background` 层绑定为 `src/export/` 生成的资源包 PNG 贴图，`dynamic_text` 层绑定至 `GuiGraphics.drawString()`。

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
- **`anvil`（铁砧输入 `AnvilGUI`）**：用于仓库搜索（槽位 8）、灵宠/坐骑改名（槽位 43）、CDK 兑换（槽位 11）、公会创建（槽位 4）、收件人/标题输入，以及箱子商店单价/库存/购买数量输入（`shop_edit` 槽位 21/22，`shop_buy` 槽位 22）。
- **`sign`（告示牌输入 `SignGUI`）**：用于公会公告多行编辑（槽位 19/21）。
- **`chat`（聊天栏捕获 `AsyncPlayerChatEvent`）**：用于长篇邮件正文输入（槽位 12）。
- **`mod_textfield`（模组客户端 `EditBox / GuiTextField`）**：由于服务器采用模组客户端（用户确认项 2），可在客户端 GUI 直接内嵌原生 `EditBox` 控件并通过 CustomPayload 发包至服务端，体验更丝滑。

---

## 4. 箱子商店移植契约

箱子商店由 `shop_edit`（店主管理）和 `shop_buy`（玩家购买）两个 6 行容器界面组成。两者共享 `ServerState.chestShop`，其关键字段为 `targetItem`、`currency`、`unitPrice`、`stock`、`maxStock` 和 `buyAmount`。编辑界面初始 `targetItem = null`，点击 `P0~P35` 中的物品完成单品上架；上架后只能存入同类物品。

| 界面 | 关键槽位 | 服务端必须执行的动作 |
|---|---|---|
| `shop_edit` | `2/3/4` 货币、`11/12/14/15/19/25` 调价、`21/22` 铁砧输入、`28~32` 存取与快捷库存、`34` 下架 | 校验单品限制与 `maxStock`，下架时把库存安全退回玩家背包；货币类型映射 Vault、PlayerPoints 或绿宝石 |
| `shop_buy` | `13` 商品、`18~26` 数量、`23` MAX、`31` 确认购买、`33` 背包容量 | 重新计算背包可容纳量，并串行校验库存、容量和余额后再扣款、扣库存、分批发放物品 |

购买校验必须满足：

```text
buyQty <= shop.stock
buyQty <= calculateMaxInventoryCapacity(player, shop.targetItem)
buyQty * shop.unitPrice <= getPlayerCurrencyBalance(player, shop.currency)
```

校验和扣款都必须在服务端完成，不能信任客户端传入的数量或总价。完整槽位契约和 Bukkit/Paper 示例见 [`chest_shop_edit/README.md`](../src/screens/chest_shop_edit/README.md) 与 [`chest_shop_buy/README.md`](../src/screens/chest_shop_buy/README.md)。

---

## 5. 游戏美术资产导出契约 (`src/export`)

### 5.1 资产来源与类别

导出模块从 `pixelIconData.ts` 和 Canvas 绘制器生成 PNG，项目不读取或上传外部图片。`buildGuiAssets(screenId, serverState?)` 会按界面组装以下资产：

| 类别 | 内容 | 1x 基准尺寸 |
|---|---|---|
| `background` | 纯净容器背景、带当前物品与数量的实时快照、48×48 容器九宫格外框 | 普通界面 `176×195px`；商店 `176×213px`；外框 `48×48px` |
| `slot` | 普通 / 悬停 / 选中 / 锁定 / 禁用槽位、装备底槽、槽位九宫格 | `18×18px`；槽位九宫格 `24×24px` |
| `button` | RPG 按钮、Tab、翻页、整理、搜索、数量和购买按钮 | RPG 按钮 `64×18px`；Tab `32×18px`；图标按钮 `18×18px` |
| `bar` | 空轨道及生命、容量、经验、预警、危险、公会金色进度条 | `90×10px` |
| `dialog` | 二次确认弹窗、MC 风格 Tooltip 九宫格 | `176×90px`；Tooltip `32×32px` |
| `icon` | 当前界面物品图标与全量原创像素图标库 | `16×16px` |

所有尺寸均为原始像素；导出倍率只能使用 `1x / 2x / 3x / 4x / 8x`。透明模式输出 Alpha PNG，关闭透明背景时使用绘制器定义的暗色底；不得把生成 PNG 当成新的素材源。

### 5.2 单图、实时快照与快速入口

- 导出工坊 (`GuiAssetExportStudio`) 支持按 9 个界面切换、按类别和名称 / ID / 标签筛选、预览并单独下载 PNG，文件名为 `<asset.id>_x<scale>.png`。
- 每个组件都可以复制 PNG Base64 Data URL；实时快照只有在传入 `ServerState` 时生成，包含当前界面物品、堆叠数字和标题。
- Gallery 右侧「导出」抽屉提供当前界面的快速 PNG / ZIP；舞台上的「截图」按钮只保存当前渲染快照，不替代资源组件导出。

### 5.3 Atlas 与九宫格

`packAssetsToAtlas` 使用 2px 间距的货架式装箱算法，按渲染后的高度排序，图集宽度按总面积选择 `256 / 512 / 1024 / 2048px`，高度至少为 `128px`。`atlas.json` 的 `meta` 必须记录 `scale`、图集尺寸和 `RGBA8888` 格式；每个 `frames` 项必须记录 `frame`、原始 `sourceSize`，并在适用时记录 `nineSlice`。

九宫格边距由资产注册表统一提供：`gui_frame_9slice` 为 `5px`，`slot_9slice` 为 `2px`，`btn_rpg` 为 `3px`，`tooltip_frame` 为 `4px`。导出包另写入 `nine_slice/nine_slice_specs.json`，Unity / Godot 接入时以该文件为准。

### 5.4 ZIP 交付结构与引擎模板

当前界面导出文件名为 `mc_gui_<screen>_assets_x<scale>.zip`，根目录包含：

```text
mc_gui_<screen>_assets/
├── backgrounds/       # 纯净背景与有状态快照
├── nine_slice/        # 九宫格 PNG 与 nine_slice_specs.json
├── slots/             # 槽位状态与装备底槽
├── buttons/           # 按钮、Tab、功能控件
├── progress_bars/     # 进度条变体
├── items/             # 当前界面 16×16 图标
├── spritesheet/       # atlas.png + atlas.json
├── engine_templates/  # pack.mcmeta、TrMenu、Unity、Godot 模板
├── <screen>.layout.json
└── README_GAME_DEVELOPMENT.md
```

全量导出文件名为 `mc_rpg_master_assets_all9_x<scale>.zip`，包含 `gui_<screen>/` 下的 9 个界面资源、`full_pixel_icon_library/` 全量像素图标库和 `README_MASTER_BUNDLE.md`。引擎模板只是接入起点：目标项目仍需按服务端权限、槽位事件和实际资源命名复核 `pack.mcmeta`、TrMenu、Unity `MCGuiSlot.cs` 与 Godot `NinePatchRect` 配置。

---

## 6. 九大界面汇总与组件复用对照

| 界面 ID | 行数 | 核心复用组件 | 关键槽位分配 |
|---|---|---|---|
| `warehouse` (玩家仓库) | 5 行 (45格) | `ReusableWarehouseGrid` | `0-5` 分类, `7` 排序, `8` 搜索, `9-35` 存储(27格/页), `36/37/44` 分页, `38-42` 总量条, `43` 解锁下一格 |
| `inventory` (角色行囊 Hub) | 5 行 (45格) | `GuiFrame`, `Slot` | `0,9,18,27,36` 防具与副手, `1,10,19,28` 项链/双戒指/护符, `6-8,15-17` 六大系统 Hub 入口 |
| `quest` (任务委托) | 5 行 (45格) | `PagerSlot`, `Slot` | `0-4` 五大分类(切换重置页码为1), `9-13,18-22` 任务列表, `15` 详情, `24-26` 奖励槽, `41-43` 追踪/放弃/接取/提交 |
| `pet` (灵宠契约) | 5 行 (45格) | `CompanionTemplate` | `9-12,18-21` 宠物列表, `14` 详情, `15-17` 经验条, `23(-25)` 宠物护具槽, `41-44` 出战/喂养/改名/放生 |
| `mount` (皇家坐骑) | 5 行 (45格) | `CompanionTemplate` (100%复用) | 复用宠物模板，差异项：显示移速、按钮改为「骑乘/设为默认」、槽位 `26` 外观形态切换 |
| `mail` (信使邮箱) | 5 行 (45格) | `PagerSlot`, `Slot` | `0-3` 系统/玩家/CDK/发件 Tab(带未读红点), `19-22` CDK 四状态测试, `21-24` 发件附件槽, `41-44` 批量与单封操作 |
| `guild` (荣耀公会) | 5 行 (45格) | `ReusableWarehouseGrid` + 权限矩阵 | 未入会列表/搜索/创建；已入会 `0-6` 七大子页面，公会仓库直接复用 `ReusableWarehouseGrid` 并受权限矩阵控制 |
| `shop_edit` (箱子商店管理) | 6 行 (54格) | `GuiFrame`, `Slot`, `PlayerInventory` | `2/3/4` 货币, `11~25` 调价与输入, `28~34` 存取/下架, `P0-P35` 上架与补货 |
| `shop_buy` (箱子商店购买) | 6 行 (54格) | `GuiFrame`, `Slot`, `PlayerInventory` | `13` 商品, `18~26` 数量, `31` 购买, `33` 背包容量, `P0-P35` 购买后存放 |
