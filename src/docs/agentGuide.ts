export interface AgentRuleItem {
  id: string;
  rule: string;
  detail: string;
}

export const AGENT_TEN_COMMANDMENTS: AgentRuleItem[] = [
  {
    id: '军规 1',
    rule: '绝对禁止绕过 GuiAction',
    detail: '任何业务状态流转必须由 mockServer.handle 纯函数处理，严禁组件内私设状态篡改核心数据。',
  },
  {
    id: '军规 2',
    rule: '绝对禁止偏离 18px 槽位网格',
    detail: '所有按钮与交互点必须是 18×18 槽位或标准槽位组合，严禁任意摆放游离的网页悬浮按钮。',
  },
  {
    id: '军规 3',
    rule: '绝对禁止引入重型外部 UI 库',
    detail: '严禁使用 npm 安装 AntD、MUI、Shadcn UI 等；原生 CSS 变量是保证像素等比缩放的唯一标准。',
  },
  {
    id: '军规 4',
    rule: '绝对禁止使用 Mojang 原版贴图素材',
    detail: '所有视觉资产使用项目内置的 SVG 像素代码或纯色字符，保持完全开源合法与可定制性。',
  },
  {
    id: '军规 5',
    rule: '绝对禁止违背 176px 容器宽度',
    detail: '9 列网格宽度必须恒定为 162px，加双侧 7px 边框为 176px，保证与原版贴图 1:1 吻合。',
  },
  {
    id: '军规 6',
    rule: '绝对禁止在深层业务中硬编码中文字符串',
    detail: '所有通用提示、弹窗文案集中放入 src/i18n/zh_CN.ts，方便后续一键导出为服务器语言包。',
  },
  {
    id: '军规 7',
    rule: '遇到歧义绝对不要停工等待',
    detail: '遇到需求模糊时，严格按照第 3 章的裁决 (A1~A8, Q1~Q5) 继续推进，并在开发日志中明确记录"已做假设"。',
  },
  {
    id: '军规 8',
    rule: '编写伙伴与仓库逻辑时必须复用组件',
    detail: '坐骑界面必须复用 CompanionTemplate，公会仓库必须复用 ReusableWarehouseGrid，严禁复制代码！',
  },
  {
    id: '军规 9',
    rule: '破坏原有单元测试者严禁交付',
    detail: '每次改动后必须运行内置单元测试套件，10 项核心测试必须 100% 保持绿色通过。',
  },
  {
    id: '军规 10',
    rule: '每次修改必须同步更新 layout.json 与 README',
    detail: '槽位有变动时，必须同步修改对应的 layout.json，确保插件开发者拿到的配置始终准确无误。',
  },
];

export const AGENT_DEVELOPMENT_STEPS = [
  { step: '步骤 1: MC 可行性评估', desc: '确认需求能否落在 9 列槽位网格上？能否对应 Bukkit/Mod 机制？若不能，拒绝并提出符合 MC 的替代方案。' },
  { step: '步骤 2: 规划槽位分配与 layout.json', desc: '按界面 rows 确定 0~53（5 行界面为 0~44）槽位功能，编辑或新建对应的 layout.json。' },
  { step: '步骤 3: 扩充/核对类型定义', desc: '在 src/types/index.ts 中追加新的 Action 动作名、数据模型字段。' },
  { step: '步骤 4: 实现 mockServer 状态机纯函数', desc: '在 src/mock/server.ts 中编写对应 action 的处理分支，返回全新的不可变状态 (Immutable State) 与描述文本。' },
  { step: '步骤 5: 编写或更新 Screen 组件', desc: '仅通过 dispatchAction 发送 GuiAction，读取 serverState 渲染视图，支持 6 大视觉状态。' },
  { step: '步骤 6: 编写 4 种典型 Mock 场景', desc: '在 scenarios.ts 中注入：1.正常状态；2.空数据状态；3.多页满载状态；4.边界异常状态。' },
  { step: '步骤 7: 扩充与运行单元测试', desc: '在 src/dev/TestRunnerModal.tsx 中补充该功能的自动化测试用例，确保全部通过。' },
  { step: '步骤 8: 更新 README.md、导出契约并执行构建自检', desc: '补充槽位表与 MC 实现说明；视觉或尺寸变更时同步核对 src/export/assetRegistry.ts、九宫格边距与引擎模板，运行 npx tsc --noEmit 与 npm run build 确保零错误。' },
];

export const AGENT_THREE_ARTIFACTS = [
  { name: '1. 可交互 Web 原型组件', path: 'src/screens/{name}/{Name}Screen.tsx', desc: '具备完整 6 大视觉状态，严格以 dispatchAction 发送 GuiAction，无缝支持桌面键鼠操作。' },
  { name: '2. 槽位布局配置文件', path: 'src/screens/{name}/layout.json', desc: '声明 rows、slots（按 rows 为 0~44 或 0~53，另含 P0~P35）、layers (background, dynamic_text, items)、mcInputSource 等。' },
  { name: '3. 交互与移植说明文档', path: 'src/screens/{name}/README.md', desc: '向服务端/模组开发者详细说明槽位动作映射、边界拦截、二次确认、以及 Java 移植范例代码。' },
];

export const AGENT_EXPORT_CHECKLIST = [
  '资产必须由 src/export/ 的 Canvas 绘制器和内置像素数据生成，不得读取外部图片。',
  '导出倍率只允许 1x / 2x / 3x / 4x / 8x；保持整数倍像素渲染与可选 Alpha 背景。',
  'Atlas 必须同时提供 atlas.png、atlas.json，以及适用资产的 nineSlice 边距。',
  '修改组件尺寸或界面行数后，必须检查单图 PNG、当前界面 ZIP 和 9 界面全量 ZIP 的目录与文件名。',
];
