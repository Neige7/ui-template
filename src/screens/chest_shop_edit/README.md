# 6.8 箱子商店 · 商品管理与配置界面 (Chest Shop Edit GUI)

## 1. 界面定位与核心规格
- **容器规格**：6 行 × 9 列 = 54 槽位（标准 Double Chest 大箱子容器 `generic_54.png`）+ 下方 36 格玩家背包 (`P0~P35`)。
- **渲染分层**：
  - `background`：箱子网格底板、控制面板凹凸边框、装饰分隔槽。
  - `dynamic_text`：顶部标题、店主标识、结算货币、单价与超大库存数值汇总、状态提示横幅。
  - `items`：核心待上架/已上架商品图标、同行单价调整按钮、背包/仓库存入与取出按钮、下架按钮。
- **核心业务铁律**：
  - **单品限制**：每个箱子商店只能上架 1 个物品。
  - **超大库存**：突破原版 64 堆叠上限，支持按配置上限（如 5,000 件）存储 300 件或更多物品。
  - **初始待上架**：未上架时槽位 13 显示「待上架占位」，引导玩家点击背包物品。
  - **背包与仓库联动**：在编辑界面可直观看到玩家全部行囊 (`P0~P35`)，并可将同类商品在商店、背包和玩家仓库之间转移。

---

## 2. 槽位分布与动作契约表

| 槽位编号 | 槽位类型 | 默认图标 | 显示名称 | 交互动作 (`GuiAction.payload`) | 说明与 MC 服务端逻辑 |
|---|---|---|---|---|---|
| **0** | `display` | `chest_shop` | 商店配置信息 | 无 | 显示店主、当前状态、容量上限说明 |
| **2** | `tab` | `coin_gold` | 结算货币: 金币 | `{ action: 'shop_set_currency', currency: 'gold' }` | 切换为 Vault 金币经济 |
| **3** | `tab` | `gem_star` | 结算货币: 点券 | `{ action: 'shop_set_currency', currency: 'gems' }` | 切换为 PlayerPoints 点券经济 |
| **4** | `tab` | `emerald` | 结算货币: 绿宝石 | `{ action: 'shop_set_currency', currency: 'emerald' }` | 切换为原生绿宝石物币经济 |
| **6** | `hub_nav` | `cart_buy` | 切换购买视角 | `{ action: 'nav_screen:shop_buy' }` | 打开买家购买演示视角 |
| **8** | `display` | `pane_gray` | 装饰边框 | 无 | 保持顶部控制区的边框布局 |
| **10** | `button` | `minus_qty` | -100 单价 | `{ action: 'shop_adjust_price', delta: -100 }` | 单价减少 100，与 -10/-1/+1/+10/+100 同行 |
| **11** | `button` | `minus_qty` | -10 单价 | `{ action: 'shop_adjust_price', delta: -10 }` | 单价减少 10 |
| **12** | `button` | `minus_qty` | -1 单价 | `{ action: 'shop_adjust_price', delta: -1 }` | 单价减少 1 (最低为 1) |
| **13** | `storage` | `empty_slot` / 商品 | **核心上架槽位** | `{ action: 'shop_target_slot' }` | **初始显示待上架**；左键提示，右键下架退回库存 |
| **14** | `button` | `plus_qty` | +1 单价 | `{ action: 'shop_adjust_price', delta: 1 }` | 单价增加 1 |
| **15** | `button` | `plus_qty` | +10 单价 | `{ action: 'shop_adjust_price', delta: 10 }` | 单价增加 10 |
| **21** | `button` | `price_tag` | 直接输入单价 | `{ action: 'shop_price_input' }` | 唤起 `AnvilGUI` 铁砧直接输入单价值 |
| **23** | `display` | `lock` | 库存容量上限 | 无 | 显示最大容量上限（如 5,000 件） |
| **16** | `button` | `plus_qty` | +100 单价 | `{ action: 'shop_adjust_price', delta: 100 }` | 单价增加 100，与 -100/-10/-1/+1/+10 同行 |
| **28** | `button` | `arrow_right` | 存入 64 件 | `{ action: 'shop_deposit_from_inv', mode: 'stack' }` | 从背包扣除 64 个同类物品充入商店库存 |
| **29** | `button` | `arrow_right` | 背包全部存入 | `{ action: 'shop_deposit_from_inv', mode: 'all' }` | 批量充入，无法超过商店库存数量限制，超出部分保留在背包 |
| **30** | `button` | `arrow_left` | 取出 64 件 | `{ action: 'shop_withdraw_to_inv', mode: 'stack' }` | 从商店扣减 64 件库存并装入背包 |
| **31** | `button` | `arrow_left` | 全部取出至背包 | `{ action: 'shop_withdraw_to_inv', mode: 'all' }` | 将库存最大化取出至背包直至背包满 |
| **32** | `button` | `arrow_right` | 从仓库存入 64 件 | `{ action: 'shop_deposit_from_warehouse', mode: 'stack' }` | 从玩家仓库扣除 64 个同类物品充入商店库存 |
| **33** | `button` | `arrow_right` | 仓库全部存入 | `{ action: 'shop_deposit_from_warehouse', mode: 'all' }` | 批量充入，无法超过商店库存数量限制，超出部分保留在仓库 |
| **34** | `button` | `arrow_left` | 取出 64 件至仓库 | `{ action: 'shop_withdraw_to_warehouse', mode: 'stack' }` | 从商店扣减 64 件库存并装入玩家仓库 |
| **35** | `button` | `arrow_left` | 全部取出至仓库 | `{ action: 'shop_withdraw_to_warehouse', mode: 'all' }` | 将库存最大化取出至玩家仓库，受仓库容量限制 |
| **41** | `button` | `ore_mythril` | 快捷设为300件 | `{ action: 'shop_set_stock_quick', amount: 300 }` | 演示快捷填充超大数量 (300 件) |
| **42** | `button` | `cross_red` | 下架商品 | `{ action: 'shop_unlist' }` | 撤销上架，退回全部库存至玩家背包 |
| **P0~P35**| `storage` | 玩家背包物品 | 玩家行囊物品 | `handlePlayerInventoryClick` | **空闲时点击任意物品即刻完成上架**；上架后点击同类物品存入库存 |

---

## 3. Bukkit / Paper 插件端移植契约

```java
@EventHandler
public void onInventoryClick(InventoryClickEvent event) {
    if (!(event.getInventory().getHolder() instanceof ChestShopEditHolder holder)) return;
    event.setCancelled(true);
    Player player = (Player) event.getWhoClicked();
    int rawSlot = event.getRawSlot();

    // 1. 点击玩家背包区 (P0~P35 对应 rawSlot 54..89)
    if (rawSlot >= 54 && rawSlot < 90) {
        ItemStack clicked = event.getCurrentItem();
        if (clicked == null || clicked.getType().isAir()) return;

        if (holder.getShop().getTargetItem() == null) {
            // 初始上架
            holder.getShop().setTargetItem(clicked.clone());
            holder.getShop().setStock(clicked.getAmount());
            event.setCurrentItem(null);
            player.sendMessage("§a[箱子商店] 成功上架商品: " + clicked.getItemMeta().getDisplayName());
            holder.refreshGui();
        } else if (holder.getShop().isSameItem(clicked)) {
            // 补充库存
            int added = holder.getShop().addStock(clicked.getAmount());
            clicked.setAmount(clicked.getAmount() - added);
            holder.refreshGui();
        } else {
            player.sendMessage("§c[箱子商店] 该商店已上架单一物品，请先下架！");
        }
        return;
    }

    // 2. 容器内部槽位
    switch (rawSlot) {
        case 10 -> holder.adjustPrice(-100);
        case 11 -> holder.adjustPrice(-10);
        case 12 -> holder.adjustPrice(-1);
        case 14 -> holder.adjustPrice(+1);
        case 15 -> holder.adjustPrice(+10);
        case 16 -> holder.adjustPrice(+100);
        case 21 -> openAnvilPriceInput(player, holder);
        case 42 -> holder.unlistShop(player);
        case 6  -> ChestShopBuyGui.open(player, holder.getShop());
    }
}
```
