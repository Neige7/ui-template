import { ScreenId } from '../types';

export function getEngineTemplates(screenId: ScreenId) {
  const mcmeta = JSON.stringify(
    {
      pack: {
        pack_format: 15,
        description: `§6[MC-RPG UI Kit] §eCustom GUI Assets for §b${screenId}`,
      },
    },
    null,
    2
  );

  const trMenuConfig = `# ==============================================================
# TrMenu / DeluxeMenus 游戏菜单配置文件
# 界面标识: ${screenId}
# 渲染器: MC-RPG UI Kit (Neige7/ui-template)
# ==============================================================
title: '§8[§9奇幻RPG · ${screenId}§8]'
rows: ${screenId === 'shop_edit' || screenId === 'shop_buy' ? 6 : 5}
open-action:
  - 'sound: BLOCK_CHEST_OPEN-1-1'

layout:
  - '######### '
  - ' SSSSSSS '
  - ' SSSSSSS '
  - ' SSSSSSS '
  - '< = B + >'

icons:
  slot_storage:
    display:
      material: GRAY_STAINED_GLASS_PANE
      name: '§7[空白槽位]'
    actions:
      all: 'sound: UI_BUTTON_CLICK-1-1'
`;

  const unityNineSliceJson = JSON.stringify(
    {
      format: 'Unity 2D Sprite Importer Metadata',
      pixelsPerUnit: 16,
      filterMode: 'Point',
      sprites: {
        gui_frame_9slice: {
          border: { left: 5, top: 5, right: 5, bottom: 5 },
          pivot: { x: 0.5, y: 0.5 },
        },
        slot_9slice: {
          border: { left: 2, top: 2, right: 2, bottom: 2 },
          pivot: { x: 0.5, y: 0.5 },
        },
        btn_rpg: {
          border: { left: 3, top: 3, right: 3, bottom: 3 },
          pivot: { x: 0.5, y: 0.5 },
        },
        tooltip_frame: {
          border: { left: 4, top: 4, right: 4, bottom: 4 },
          pivot: { x: 0.5, y: 0.5 },
        },
      },
    },
    null,
    2
  );

  const unityCSharpSlotScript = `// ==============================================================
// Unity UGUI 像素物品槽控制器 (MC-RPG GUI Slot)
// 适配 18x18px 像素网格与 9-Slice 切片
// ==============================================================
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

[RequireComponent(typeof(Image))]
public class MCGuiSlot : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler
{
    public int slotIndex;
    public Image itemIconImage;
    public Text amountText;
    public Image selectionBorder;

    [Header("Sprite States")]
    public Sprite normalSlotSprite;
    public Sprite hoverSlotSprite;
    public Sprite selectedSlotSprite;
    public Sprite lockedSlotSprite;

    private Image _slotBackground;

    private void Awake()
    {
        _slotBackground = GetComponent<Image>();
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        if (_slotBackground && hoverSlotSprite)
            _slotBackground.sprite = hoverSlotSprite;
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        if (_slotBackground && normalSlotSprite)
            _slotBackground.sprite = normalSlotSprite;
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        bool isRightClick = eventData.button == PointerEventData.InputButton.Right;
        bool isShift = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
        Debug.Log($"[MCGuiSlot] Clicked Slot {slotIndex}, Right={isRightClick}, Shift={isShift}");
    }
}
`;

  const godotNinePatchConfig = `# ==============================================================
# Godot 4 NinePatchRect 节点配置
# 用于动态自适应 GUI 弹窗与容器背景
# ==============================================================
[gd_scene load_steps=2 format=3]

[node name="MCGuiFrame" type="NinePatchRect"]
texture = ExtResource("gui_frame_9slice.png")
patch_margin_left = 5
patch_margin_top = 5
patch_margin_right = 5
patch_margin_bottom = 5
axis_stretch_horizontal = 1
axis_stretch_vertical = 1
`;

  const gameDevReadme = `# MC-RPG GUI 组件资源使用指南 (Game Developer Guide)

本导出包包含当前界面 (${screenId}) 的全套游戏美术切片、纯净背景底图、9-Slice 九宫格素材、各交互态按钮以及 16x16 矢量像素物品图标。

## 目录结构
- \`backgrounds/\`: 176px 标准宽度容器纯净背景图 (Clean) 与实时游戏截图 (Snapshot)
- \`nine_slice/\`: 适配 Unity / Godot / Web 引擎的可无限拉伸 9-Slice 切片与边距规范
- \`slots/\`: 18x18px 基础物品槽、鼠标悬停态、选中高亮态、上锁态及专用装备底槽
- \`buttons/\`: 选项卡 Tab、翻页 Pager、整理/搜索/加减等功能性按钮与 RPG 操作按键
- \`progress_bars/\`: 进度条底槽与 6 种颜色形态 (生命绿色、魔力青蓝、经验紫粉、预警橙黄、危险赤红、公会金色)
- \`items/\`: 当前界面包含的所有 16x16 像素图标 (透明背景 PNG)
- \`spritesheet/\`: 合并后的完整图集 \`atlas.png\` 与坐标映射字典 \`atlas.json\`
- \`engine_templates/\`: Minecraft 资源包模板、Unity C# 脚本、Godot 配置文件、TrMenu 配置

## 9-Slice 切片边距速查表
| 资源名称 | 贴图尺寸 | Left | Top | Right | Bottom |
|---|---|---|---|---|---|
| \`gui_frame_9slice\` | 48×48 px | 5 px | 5 px | 5 px | 5 px |
| \`slot_9slice\` | 24×24 px | 2 px | 2 px | 2 px | 2 px |
| \`btn_rpg\` | 64×18 px | 3 px | 3 px | 3 px | 3 px |
| \`tooltip_frame\` | 32×32 px | 4 px | 4 px | 4 px | 4 px |

## 像素网格参数
- 基础槽位大小 (Slot Size): 18×18 像素 (内部物品居中 16×16 像素，外围 1 像素立体斜切凹陷)
- 容器标准宽度: 176 像素 (左右各边距 7 像素，槽位网格 9 列 × 18 像素 = 162 像素)
- 字体推荐: DotGothic16 / JetBrains Mono / Silkscreen
`;

  return {
    mcmeta,
    trMenuConfig,
    unityNineSliceJson,
    unityCSharpSlotScript,
    godotNinePatchConfig,
    gameDevReadme,
  };
}
