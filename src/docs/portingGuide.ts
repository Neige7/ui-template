import guildLayout from '../screens/guild/layout.json';
import inventoryLayout from '../screens/inventory/layout.json';
import mailLayout from '../screens/mail/layout.json';
import mountLayout from '../screens/mount/layout.json';
import petLayout from '../screens/pet/layout.json';
import questLayout from '../screens/quest/layout.json';
import warehouseLayout from '../screens/warehouse/layout.json';
import shopEditLayout from '../screens/chest_shop_edit/layout.json';
import shopBuyLayout from '../screens/chest_shop_buy/layout.json';
import { ScreenId } from '../types';

export const SCREEN_LAYOUTS: Record<ScreenId, unknown> = {
  warehouse: warehouseLayout,
  inventory: inventoryLayout,
  quest: questLayout,
  pet: petLayout,
  mount: mountLayout,
  mail: mailLayout,
  guild: guildLayout,
  shop_edit: shopEditLayout,
  shop_buy: shopBuyLayout,
};

export const SCREEN_READMES: Record<ScreenId, { title: string; bullets: string[]; mcPortingNotes: string[] }> = {
  shop_edit: {
    title: '箱子商店 · 商品管理与配置 (Chest Shop Edit) · 6×9 容器 + 36 格背包',
    bullets: [
      '单品上架原则：商店内只能上架一个物品；初始状态槽位 13 为空显示待上架。',
      '背包联动上架：点击下方玩家背包 (P0~P35) 内任意物品即刻完成上架，并将该组物品充入初始库存。',
      '超大库存管理：摆脱原版 64 堆叠上限，支持按最大容量（如 5000 件）存储 300 件或更多商品。',
      '结算货币自由切换：支持金币 (Vault)、点券 (PlayerPoints)、绿宝石三种结算经济体系。',
      '单价直接输入与微调：支持 +-1、+-10、+-100 增减，以及铁砧直接自定义键盘输入单价值。',
      '库存转移：槽位 28~31 操作玩家背包，槽位 32~35 操作玩家仓库；全部存入无法超过商店数量限制。',
    ],
    mcPortingNotes: [
      'Bukkit/Paper 映射：rawSlot 13 映射为 Shop Item 模板，rawSlot 54..89 捕获背包点击执行首次上架或同类补货。',
      '超大库存存储采用数据库或 NBT 存储总整型数值，客户端使用 custom Lore 与物品数量覆盖渲染；仓库存取需同步校验解锁槽位与总量上限。',
    ],
  },
  shop_buy: {
    title: '箱子商店 · 玩家购买选购 (Chest Shop Buy) · 6×9 容器 + 36 格背包',
    bullets: [
      '展示透明：居中槽位 13 直观展示商品属性、货币类型、单件售价、当前剩余库存与买家背包可用容量。',
      '数量调节与背包强约束：可用 +- 增减数量或铁砧直接编辑，但拟购数量绝对禁止超过背包内物品上限或商店库存。',
      'MAX 智能拉满：一键计算 min(商店库存, 背包剩余上限)；确认购买时再校验余额是否足够。',
      '实时背包联动：下方 36 格背包直观渲染，购买扣费成功后商品按照原版 64 堆叠规则整齐划一落入背包。',
    ],
    mcPortingNotes: [
      '服务端购买校验：必须串行校验 buyQty <= stock && buyQty <= calculateMaxInventoryCapacity(player) && balance >= totalCost。',
      '分批堆叠发放：调用 player.getInventory().addItem()，超容时进行自动防刷保护拦截。',
    ],
  },
  warehouse: {
    title: '玩家仓库 (Warehouse) · 5×9 容器 + 36 格背包',
    bullets: [
      '槽位 0~5 为 6 个分类筛选按钮，槽位 6 返回角色背包 Hub，槽位 7 品质排序，槽位 8 搜索（右键清除）。',
      '槽位 9~35 为每页 27 个存储槽位；未解锁槽位 (realIdx >= unlockedCount) 显示为 locked 锁图标，不可交互。',
      '槽位 38~42 跨 5 格渲染总量限制条，默认按「所有页面物品堆叠总数 / 上限」统计（用户确认项 1），点击槽位 37 可切换为「占用槽位 / 已解锁槽位」。',
      '支持左键拿放/堆叠、右键拿一半/放一个、Shift+左键双向快速转移、数字键 1-9 与快捷栏交换；超总量上限时执行部分放入或拦截提示。',
    ],
    mcPortingNotes: [
      'Bukkit/Paper 映射：监听 InventoryClickEvent，rawSlot 9..35 映射至当前页 (page-1)*27 + (rawSlot-9)。',
      '模组客户端映射：38..42 槽位上方使用 GuiGraphics.fill() 与 drawString() 绘制动态进度条。',
    ],
  },
  inventory: {
    title: '玩家背包修改版 + 系统入口 (Inventory Hub) · 5×9 容器',
    bullets: [
      '左侧第 0 列（0,9,18,27,36）为头、胸、腿、脚、副手；第 1 列（1,10,19,28）为 RPG 扩展槽：项链、戒指×2、护符。',
      '中部跨槽位展示角色纸娃娃立绘预览，底部动态汇总基础属性 + 穿戴装备 + 出战灵宠 + 骑乘坐骑加成。',
      '右侧槽位（6,7,8,15,16,17）为任务、宠物、坐骑、公会、邮箱（带未读红点角标）、仓库的快捷 Hub 入口。',
      '严格执行装备部位类型校验 (isPlayerEquipSlotMatch)，错误部位无法放入；支持 Shift+左键快速穿戴与卸下。',
    ],
    mcPortingNotes: [
      '模组客户端：直接扩展 InventoryScreen 或注册自定义 ContainerMenu，中部调用 InventoryScreen.renderEntityInInventory 渲染真实玩家模型。',
    ],
  },
  quest: {
    title: '任务视图 (Quest) · 5×9 容器',
    bullets: [
      '顶部槽位 0~4 为「主线 / 支线 / 日常 / 周常 / 限时庆典」五大分类，切换分类时自动将页码重置为 1。',
      '左侧 5×2 槽位（9~13, 18~22）为分页任务列表，角标与颜色区分「可接 / 进行 / 领奖 / 完成」状态。',
      '右侧槽位 15 展示选中任务详情与目标进度 (x/y)，槽位 24~26 为可悬停查看装备词条的奖励物品槽。',
      '槽位 41~43 根据任务状态动态显示：接取 / 追踪 / 放弃（触发 ConfirmDialog 二次确认）/ 提交领奖（校验背包余量）。',
    ],
    mcPortingNotes: [
      '采用同屏左右分栏方案，避免频繁开关二级容器导致鼠标位置重置。任务追踪直接对接服务端 Scoreboard API。',
    ],
  },
  pet: {
    title: '灵宠界面 (Pet) · 共享 CompanionTemplate 模板',
    bullets: [
      '同时仅允许 1 只灵宠处于「出战」状态（用户确认项 3），激活新灵宠时自动收回原出战灵宠。',
      '默认开启 1 个宠物专属装备槽（槽位 23，用户确认项 3），点击槽位 7 可切换预览 3 格扩展装备槽（23~25）。',
      '严格校验宠物护具类型 (pet_collar / pet_claw / pet_charm)，非宠物护具禁止放入。',
      '支持喂养升级（消耗背包内灵宠星魂果露，15~17 跨 3 格经验条增长）、铁砧改名（槽位 43）与二次确认放生（槽位 44）。',
    ],
    mcPortingNotes: [
      '与坐骑界面共享同一套 ContainerLayout 与前端渲染模板，仅通过 CompanionTemplateConfig 配置注入差异。',
    ],
  },
  mount: {
    title: '坐骑界面 (Mount) · 100% 复用 CompanionTemplate 模板',
    bullets: [
      '零重复代码复用 CompanionTemplate，通过 MOUNT_CONFIG 开启移动速度加成 (+165%) 与外观切换功能。',
      '激活按钮改为「骑乘 / 设为默认」（槽位 41），额外在槽位 26 提供「坐骑外观形态切换」按钮。',
      '鞍具槽（槽位 23~25）严格校验坐骑专属装备类型 (mount_saddle / mount_barding / mount_spurs)。',
    ],
    mcPortingNotes: [
      '骑乘状态下服务端同步修改玩家 Attribute.GENERIC_MOVEMENT_SPEED 并挂载自定义坐骑模型实体。',
    ],
  },
  mail: {
    title: '邮箱界面 (Mail) · 系统/玩家/CDK/发件四合一',
    bullets: [
      '顶部槽位 0~3 为系统邮件、玩家邮件、CDK 兑换、发送邮件四个 Tab，自动统计并显示未读红点数量。',
      '邮件列表区分未读与已读，展示附件标识与有效期；已过期邮件标灰并禁止领取附件。',
      '支持单封领取、一键领取（槽位 41，背包空间不足时自动拦截提示）、单封删除与批量删除已读（槽位 42，需二次确认）。',
      'CDK 兑换页内置 4 个一键测试槽位（19~22），完整演示「成功 / 无效 / 已使用 / 已过期」四种结果状态。',
      '发送邮件页支持编辑收件人、标题、正文、放入最多 4 个暂存附件（21~24）、显示固定邮费（15）并在发送前二次确认。',
    ],
    mcPortingNotes: [
      'CDK 与收件人/标题输入标注为铁砧输入 (AnvilGUI)，正文标注为聊天栏捕获 (AsyncPlayerChatEvent)，模组客户端可直接使用原生 GuiTextField。',
    ],
  },
  guild: {
    title: '公会界面 (Guild) · 复用仓库组件 + 权限矩阵控制',
    bullets: [
      '无公会状态：分页展示服务器公会列表、搜索公会、申请加入、创建公会（校验 2~12 字长度、重名拦截与 20,000 金币花费）。',
      '已加入公会：顶部槽位 0~6 切换「概览 / 成员 / 申请审批 / 捐献 / 公会仓库 / 日志 / 设置」七大子页面。',
      '公会仓库直接复用玩家仓库的 ReusableWarehouseGrid 组件，并叠加「普通成员禁止取出、仅会长/副会长可解锁槽位」权限控制。',
      '界面下方附带实时「职位 × 操作」权限矩阵表，点击槽位 7 或表格按钮切换职位（会长/副会长/精英/成员）即可验证按钮动态显隐。',
    ],
    mcPortingNotes: [
      '服务端在处理公会人事、审批、设置与仓库存取 Action 时，统一调用 hasGuildPermission(role, action) 进行二次鉴权。',
    ],
  },
};

export const STAGE_REPORTS = [
  {
    stage: 'P0 脚手架与交互协议',
    status: '✔ 已完成',
    deliverables: '严格 TS 类型定义、GuiAction 协议、mockServer 状态机、集中式 zh_CN 语言文件',
  },
  {
    stage: 'P1 核心通用组件库',
    status: '✔ 已完成',
    deliverables: 'GuiFrame(176px)、Slot(18×18)/ItemIcon(16×16)、Tooltip(§颜色码+超长警告)、PlayerInventory(3×9+1×9)、Pager、ProgressBar、ConfirmDialog、TextInputModal、CursorItem、DebugOverlay',
  },
  {
    stage: 'P2 玩家仓库 + 角色背包(Hub)',
    status: '✔ 已完成',
    deliverables: 'WarehouseScreen(27格/页+总量限制条+按序解锁+筛选搜索)、InventoryScreen(9装备槽+属性汇总+6入口Hub) + layout.json + README',
  },
  {
    stage: 'P3 任务视图',
    status: '✔ 已完成',
    deliverables: 'QuestScreen(5大分类重置页码+进度展示+可悬停奖励+四状态按钮+放弃二次确认) + layout.json + README',
  },
  {
    stage: 'P4 宠物 + 坐骑 (模板复用)',
    status: '✔ 已完成',
    deliverables: 'CompanionTemplate 共享组件 + PetScreen + MountScreen(移速+骑乘+外观选择) + 护具类型校验 + layout.json + README',
  },
  {
    stage: 'P5 邮箱系统',
    status: '✔ 已完成',
    deliverables: 'MailScreen(系统/玩家/CDK/发件四Tab + 过期标灰 + 背包满拦截 + CDK四结果场景 + 发件附件与二次确认) + layout.json + README',
  },
  {
    stage: 'P6 公会系统 + 权限矩阵',
    status: '✔ 已完成',
    deliverables: 'GuildScreen(无公会列表/创建 + 已入会7子页面 + 公会仓库复用 + 职位×操作权限矩阵联动) + layout.json + README',
  },
  {
    stage: 'P7 导出与移植文档打磨',
    status: '✔ 已完成',
    deliverables: 'docs/porting-guide.md、内置核心逻辑自动化单元测试套件、奇幻简约 RPG 像素视觉统一',
  },
  {
    stage: 'P8 箱子商店',
    status: '✔ 已完成',
    deliverables: 'ChestShopEditScreen、ChestShopBuyScreen、ChestShopState、6 行容器布局与 README；单品上架、超大库存、多货币结算和购买容量校验',
  },
  {
    stage: 'P9 游戏图片资产导出',
    status: '✔ 已完成',
    deliverables: 'src/export/ 资产注册与 Canvas 绘制、单图 PNG、Atlas + atlas.json、九宫格参数、当前界面 ZIP、9 界面全量 ZIP，以及 Minecraft / TrMenu / Unity / Godot 接入模板',
  },
];

export const CONFIRMED_ASSUMPTIONS = [
  { id: 'A1/A2', item: '网格与容量', value: '仓库存储区 3×9=27 格/页；下方玩家背包 3×9 主背包(P0-P26) + 1×9 快捷栏(P27-P35) = 36 格' },
  { id: '确认1', item: '仓库总数量统计', value: '默认按所有页面物品「堆叠数量之和 / 上限」统计（点击槽位 37 可切换查看槽位占用数）' },
  { id: '确认2', item: '客户端 GUI 方案', value: '面向模组客户端 GUI + 标准 9 列容器网格混合兼容设计，标注 background / dynamic_text / items 三层' },
  { id: '确认3', item: '宠物出战与装备槽', value: '同时仅允许 1 只宠物出战；宠物装备槽默认开启 1 个（槽位 7 支持一键切换 1 格 / 3 格预览）' },
  { id: '确认4', item: '公会职位与人数规则', value: '采用既定四级职位（会长/副会长/精英/成员）与 1~5 级公会人数/干部配额规则，输出完整权限矩阵' },
  { id: '确认5', item: '像素美术风格', value: '奇幻简约 RPG 风格（深石板蓝金镶边外框 + 16×16 原创矢量像素图标，零 Mojang 原版贴图）' },
];
