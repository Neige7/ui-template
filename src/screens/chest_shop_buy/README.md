# 6.9 箱子商店 · 玩家购买界面 (Chest Shop Buy GUI)

## 1. 界面定位与核心规格
- **容器规格**：6 行 × 9 列 = 54 槽位 + 下方 36 格玩家行囊 (`P0~P35`)。
- **渲染分层**：
  - `background`：交易底盘、数量增减操作面板、状态指示条。
  - `dynamic_text`：货币类型与单价标价、购买总价动态计算、背包剩余装载上限预警。
  - `items`：居中在售商品模型、数量调整微调按钮、购买确认按钮。
- **核心业务铁律**：
  - **展示透明**：清晰展示在售商品的货币类型（金币/点券/绿宝石）、单件售价、剩余库存。
  - **数量约束**：玩家可用 `+` / `-` 调节数量，也可直接点击输入；**购买数量绝对禁止超过背包内物品上限**（以及商店库存与余额上限）。
  - **实时背包展示**：玩家可在界面下方实时观察到自己的 36 格行囊，购买完成后商品自动堆叠或落入空闲格子。

---

## 2. 槽位分布与动作契约表

| 槽位编号 | 槽位类型 | 默认图标 | 显示名称 | 交互动作 (`GuiAction.payload`) | 说明与 MC 服务端逻辑 |
|---|---|---|---|---|---|
| **0** | `display` | `chest_shop` | 商店与店主标语 | 无 | 显示店主玩家名与商店公告 |
| **4** | `display` | `coin_gold` / `gem_star` / `emerald` | 货币与单价 | 无 | 显示结算货币类型与单件售价 |
| **8** | `hub_nav` | `chest_gold` | 前往店主编辑视角 | `{ action: 'nav_screen:shop_edit' }` | 快速切换至配置管理界面 |
| **13** | `display` | 商品图标 | **核心在售商品** | 无 (悬停展示 Lore) | 查看商品属性、单价、库存、剩余背包空间 |
| **18** | `button` | `minus_qty` | -64 件 | `{ action: 'shop_buy_adjust_qty', delta: -64 }` | 减少 64 件拟购数量 |
| **19** | `button` | `minus_qty` | -10 件 | `{ action: 'shop_buy_adjust_qty', delta: -10 }` | 减少 10 件拟购数量 |
| **20** | `button` | `minus_qty` | -1 件 | `{ action: 'shop_buy_adjust_qty', delta: -1 }` | 减少 1 件拟购数量 |
| **21** | `button` | `cross_red` | MIN (归一) | `{ action: 'shop_buy_adjust_qty', delta: 'min' }` | 重置为购买 1 件 |
| **22** | `button` | `book` / `price_tag` | **拟购数量与输入** | `{ action: 'shop_buy_qty_input' }` | 铁砧输入自定义数字，自动截断超出背包空间部分 |
| **23** | `button` | `check_green` | MAX (最大) | `{ action: 'shop_buy_adjust_qty', delta: 'max' }` | 取 `min(库存, 背包上限, 余额可购)` |
| **24** | `button` | `plus_qty` | +1 件 | `{ action: 'shop_buy_adjust_qty', delta: 1 }` | 增加 1 件 (受背包空间拦截) |
| **25** | `button` | `plus_qty` | +10 件 | `{ action: 'shop_buy_adjust_qty', delta: 10 }` | 增加 10 件 (受背包空间拦截) |
| **26** | `button` | `plus_qty` | +64 件 | `{ action: 'shop_buy_adjust_qty', delta: 64 }` | 增加 64 件 (受背包空间拦截) |
| **29** | `display` | 货币图标 | 个人余额 | 无 | 显示玩家当前持有的对应货币数量 |
| **31** | `button` | `emerald` | **确认购买** | `{ action: 'shop_confirm_buy' }` | 执行扣款、扣库存、分批存入背包 |
| **33** | `display` | `warehouse` | 背包可容纳上限 | 无 | 动态计算背包还可装入多少个此物品 |
| **P0~P35**| `storage` | 玩家背包物品 | 玩家行囊 | 无 | 直观展示购买前后的背包槽位分布 |

---

## 3. 背包容量算法与服务端防御

```java
public int calculateMaxInventoryCapacity(Player player, ItemStack targetItem) {
    int capacity = 0;
    int maxStack = targetItem.getMaxStackSize();
    ItemStack[] storage = player.getInventory().getStorageContents(); // 36 格
    for (ItemStack slot : storage) {
        if (slot == null || slot.getType().isAir()) {
            capacity += maxStack;
        } else if (slot.isSimilar(targetItem)) {
            capacity += Math.max(0, maxStack - slot.getAmount());
        }
    }
    return capacity;
}
```

在执行购买时，服务端必须做三道硬性校验：
1. `buyQty <= shop.getStock()`
2. `buyQty <= calculateMaxInventoryCapacity(player, shop.getTargetItem())`
3. `playerEconomy.has(player, buyQty * shop.getUnitPrice())`
任意一道校验失败立即取消事件并给玩家发送提示。
