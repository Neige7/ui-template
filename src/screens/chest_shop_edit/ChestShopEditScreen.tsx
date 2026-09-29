import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import { ShopCurrencyType } from '../../types';

const CURRENCY_CONFIG: Record<
  ShopCurrencyType,
  { label: string; icon: string; symbol: string; color: string }
> = {
  gold: { label: '金币 (Vault)', icon: 'coin_gold', symbol: '🪙 金币', color: '§6' },
  gems: { label: '点券 (PlayerPoints)', icon: 'gem_star', symbol: '💎 点券', color: '§b' },
  emerald: { label: '绿宝石 (原版)', icon: 'emerald', symbol: '❇️ 绿宝石', color: '§a' },
};

export const ChestShopEditScreen: React.FC = () => {
  const { state } = useGui();
  const shop = state.chestShop;
  const targetItem = shop.targetItem;
  const currentCurrency = CURRENCY_CONFIG[shop.currency];

  const renderBorderSlot = (slotNum: number) => (
    <Slot
      key={slotNum}
      slot={slotNum}
      screen="shop_edit"
      state="disabled"
      item={{
        id: `pane_${slotNum}`,
        name: '§8 ',
        icon: 'pane_gray',
        rarity: 'common',
        category: 'other',
        amount: 1,
        maxStack: 1,
        lore: [],
      }}
      customTooltip={{
        title: '§8[箱子商店边框]',
        lore: ['§7此槽位为界面背景装饰板'],
      }}
    />
  );

  return (
    <GuiFrame
      screen="shop_edit"
      title={zh_CN.screens.shop_edit}
      rows={6}
      subtitleRight={`§7店主: §6${shop.ownerName} §7| 状态: ${targetItem ? '§a已上架' : '§c待上架'}`}
      footerBanner={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <MinecraftText
              text={
                targetItem
                  ? `§a已上架: §f${targetItem.name} §7| 单价: §e${shop.unitPrice} ${currentCurrency.symbol} §7| 库存: §b${shop.stock}/${shop.maxStock} 件`
                  : '§e💡 提示：当前商店为空，请在下方玩家背包 (P0~P35) 中点击任意物品进行上架！'
              }
            />
          </div>
          <div>
            <MinecraftText text="§7右键槽位13可下架商品 §7| Shift可批量存取" />
          </div>
        </div>
      }
      playerInventoryHint="§e点击背包内任意物品进行上架或存入库存 §7| §bShift+左键快速放入"
    >
      {/* ================= 行 0 (槽位 0~8): 基础状态与货币选择 ================= */}
      {/* 槽位 0: 商店信息 */}
      <Slot
        slot={0}
        screen="shop_edit"
        item={{
          id: 'shop_info',
          name: '§6§l[ 箱子商店属性看板 ]',
          icon: 'chest_shop',
          rarity: 'legendary',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§6★ 箱子商店属性看板',
          lore: [
            `§7店主姓名: §f${shop.ownerName}`,
            `§7上架状态: ${targetItem ? '§a正常销售中' : '§c待上架商品'}`,
            `§7当前结算货币: ${currentCurrency.color}${currentCurrency.label}`,
            `§7当前单件售价: §e${shop.unitPrice} ${currentCurrency.symbol}`,
            `§7当前超大库存: §b${shop.stock} §7/ §3${shop.maxStock} 件`,
            '§f--------------------------------',
            '§8支持超大库存容量，摆脱原版 64 堆叠限制',
          ],
        }}
      />

      {renderBorderSlot(1)}

      {/* 槽位 2: 货币选择 - 金币 */}
      <Slot
        slot={2}
        screen="shop_edit"
        state={shop.currency === 'gold' ? 'selected' : 'normal'}
        badgeText={shop.currency === 'gold' ? '★' : undefined}
        badgeColor="#ffd369"
        item={{
          id: 'curr_gold',
          name: shop.currency === 'gold' ? '§6§l● 结算货币: 金币 (当前选中)' : '§7○ 结算货币: 金币 (Vault)',
          icon: 'coin_gold',
          rarity: shop.currency === 'gold' ? 'legendary' : 'common',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§6🪙 结算货币: 金币 (Vault)',
          lore: [
            '§7使用服务器 Vault 经济系统金币结算。',
            '§7玩家在购买时将从其金币账户扣除。',
            '§e▶ 左键点击切换至金币结算',
          ],
        }}
        payload={{ action: 'shop_set_currency', currency: 'gold' }}
      />

      {/* 槽位 3: 货币选择 - 点券 */}
      <Slot
        slot={3}
        screen="shop_edit"
        state={shop.currency === 'gems' ? 'selected' : 'normal'}
        badgeText={shop.currency === 'gems' ? '★' : undefined}
        badgeColor="#55ffff"
        item={{
          id: 'curr_gems',
          name: shop.currency === 'gems' ? '§b§l● 结算货币: 点券 (当前选中)' : '§7○ 结算货币: 点券 (Points)',
          icon: 'gem_star',
          rarity: shop.currency === 'gems' ? 'epic' : 'common',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§b💎 结算货币: 点券 (PlayerPoints)',
          lore: [
            '§7使用 PlayerPoints 充值点券或星钻结算。',
            '§7适合高级定制装备或稀有材料交易。',
            '§e▶ 左键点击切换至点券结算',
          ],
        }}
        payload={{ action: 'shop_set_currency', currency: 'gems' }}
      />

      {/* 槽位 4: 货币选择 - 绿宝石 */}
      <Slot
        slot={4}
        screen="shop_edit"
        state={shop.currency === 'emerald' ? 'selected' : 'normal'}
        badgeText={shop.currency === 'emerald' ? '★' : undefined}
        badgeColor="#55ff55"
        item={{
          id: 'curr_emerald',
          name: shop.currency === 'emerald' ? '§a§l● 结算货币: 绿宝石 (当前选中)' : '§7○ 结算货币: 绿宝石 (原生)',
          icon: 'emerald',
          rarity: shop.currency === 'emerald' ? 'rare' : 'common',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§a❇️ 结算货币: 绿宝石',
          lore: [
            '§7使用原版绿宝石作为物理货币进行交易。',
            '§7购买时将直接扣除买家背包内的绿宝石。',
            '§e▶ 左键点击切换至绿宝石结算',
          ],
        }}
        payload={{ action: 'shop_set_currency', currency: 'emerald' }}
      />

      {renderBorderSlot(5)}

      {/* 槽位 6: 前往买家购买视角 */}
      <Slot
        slot={6}
        screen="shop_edit"
        item={{
          id: 'btn_preview_buy',
          name: '§a§l🛒 切换至买家购买视角',
          icon: 'cart_buy',
          rarity: 'rare',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§a🛒 体验买家购买视角',
          lore: [
            '§7以普通玩家的视角打开该箱子商店。',
            '§7可实时测试数量加减、单价展示、背包空间上限约束与购买结算。',
            '§a▶ 左键点击即刻切换',
          ],
        }}
        payload={{ action: 'nav_screen:shop_buy' }}
      />

      {renderBorderSlot(7)}

      {/* 槽位 8: 返回角色行囊 */}
      <Slot
        slot={8}
        screen="shop_edit"
        item={{
          id: 'btn_back_hub',
          name: '§e返回角色行囊 (Hub)',
          icon: 'chest_plate',
          rarity: 'rare',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§e⬅ 返回角色行囊',
          lore: ['§7关闭商店管理面板，回到个人背包与导航中心', '§a▶ 左键点击返回'],
        }}
        payload={{ action: 'nav_screen:inventory' }}
      />

      {/* ================= 行 1 (槽位 9~17): 单价微调与核心展示槽位 ================= */}
      {renderBorderSlot(9)}
      {renderBorderSlot(10)}

      {/* 槽位 11: -10 单价 */}
      <Slot
        slot={11}
        screen="shop_edit"
        item={{
          id: 'price_m10',
          name: '§c-10 单价',
          icon: 'minus_qty',
          rarity: 'common',
          category: 'other',
          amount: 10,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§c-10 单件售价',
          lore: [`§7当前单价: §e${shop.unitPrice}`, '§e▶ 左键点击单价 -10'],
        }}
        payload={{ action: 'shop_adjust_price', delta: -10 }}
      />

      {/* 槽位 12: -1 单价 */}
      <Slot
        slot={12}
        screen="shop_edit"
        item={{
          id: 'price_m1',
          name: '§c-1 单价',
          icon: 'minus_qty',
          rarity: 'common',
          category: 'other',
          amount: 1,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§c-1 单件售价',
          lore: [`§7当前单价: §e${shop.unitPrice}`, '§e▶ 左键点击单价 -1'],
        }}
        payload={{ action: 'shop_adjust_price', delta: -1 }}
      />

      {/* 槽位 13: 核心上架商品槽位 (初始为空显示待上架) */}
      {targetItem ? (
        <Slot
          slot={13}
          screen="shop_edit"
          item={targetItem}
          state="normal"
          badgeText="在售"
          badgeColor="#55ff55"
          customTooltip={{
            title: `§a★ 已上架商品: ${targetItem.name}`,
            lore: [
              `§7当前结算货币: ${currentCurrency.symbol}`,
              `§7设定单件价格: §e${shop.unitPrice} ${currentCurrency.label}`,
              `§7当前超大库存: §b${shop.stock} §7/ §3${shop.maxStock} 件`,
              '§f--------------------------------',
              '§e▶ 点击下方背包物品可存入同类库存',
              '§c▶ 右键点击此槽位下架商品并退还库存',
            ],
          }}
          payload={{ action: 'shop_target_slot' }}
        />
      ) : (
        <Slot
          slot={13}
          screen="shop_edit"
          item={{
            id: 'waiting_slot',
            name: '§e§l[ 待上架商品槽位 ]',
            icon: 'empty_slot',
            rarity: 'mythic',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          badgeText="空"
          badgeColor="#ff5555"
          customTooltip={{
            title: '§c⌛ [ 待上架商品槽位 ]',
            lore: [
              '§7当前箱子商店暂无任何商品！',
              '§f--------------------------------',
              '§a▶ 请在下方玩家背包 (P0~P35) 中',
              '§a  点击任意想要出售的物品进行上架！',
              '§8上架后可设定单价、货币类型与超大库存',
            ],
          }}
          payload={{ action: 'shop_target_slot' }}
        />
      )}

      {/* 槽位 14: +1 单价 */}
      <Slot
        slot={14}
        screen="shop_edit"
        item={{
          id: 'price_p1',
          name: '§a+1 单价',
          icon: 'plus_qty',
          rarity: 'common',
          category: 'other',
          amount: 1,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a+1 单件售价',
          lore: [`§7当前单价: §e${shop.unitPrice}`, '§e▶ 左键点击单价 +1'],
        }}
        payload={{ action: 'shop_adjust_price', delta: 1 }}
      />

      {/* 槽位 15: +10 单价 */}
      <Slot
        slot={15}
        screen="shop_edit"
        item={{
          id: 'price_p10',
          name: '§a+10 单价',
          icon: 'plus_qty',
          rarity: 'common',
          category: 'other',
          amount: 10,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a+10 单件售价',
          lore: [`§7当前单价: §e${shop.unitPrice}`, '§e▶ 左键点击单价 +10'],
        }}
        payload={{ action: 'shop_adjust_price', delta: 10 }}
      />

      {renderBorderSlot(16)}
      {renderBorderSlot(17)}

      {/* ================= 行 2 (槽位 18~26): 单价精调与直接输入 ================= */}
      {renderBorderSlot(18)}

      {/* 槽位 19: -100 单价 */}
      <Slot
        slot={19}
        screen="shop_edit"
        item={{
          id: 'price_m100',
          name: '§c-100 单价',
          icon: 'minus_qty',
          rarity: 'uncommon',
          category: 'other',
          amount: 1,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§c-100 单件售价',
          lore: [`§7当前单价: §e${shop.unitPrice}`, '§e▶ 左键点击单价 -100'],
        }}
        payload={{ action: 'shop_adjust_price', delta: -100 }}
      />

      {renderBorderSlot(20)}

      {/* 槽位 21: 直接输入自定义单价 */}
      <Slot
        slot={21}
        screen="shop_edit"
        item={{
          id: 'btn_price_input',
          name: `§e§l当前单价: §f${shop.unitPrice} ${currentCurrency.symbol}`,
          icon: 'price_tag',
          rarity: 'legendary',
          category: 'other',
          amount: Math.min(64, Math.max(1, shop.unitPrice % 65)),
          maxStack: 64,
          lore: [],
        }}
        badgeText="输入"
        badgeColor="#ffd369"
        customTooltip={{
          title: '§e💰 自定义单价输入 (铁砧)',
          lore: [
            `§7当前售价: §e${shop.unitPrice} ${currentCurrency.symbol}`,
            '§f--------------------------------',
            '§a▶ 点击打开铁砧输入框，键入任意正整数单价',
          ],
        }}
        payload={{ action: 'shop_price_input' }}
      />

      {/* 槽位 22: 直接输入自定义库存 */}
      <Slot
        slot={22}
        screen="shop_edit"
        item={{
          id: 'btn_stock_input',
          name: `§b§l当前库存: §f${shop.stock} §7/ §3${shop.maxStock}`,
          icon: 'chest_gold',
          rarity: 'epic',
          category: 'other',
          amount: Math.min(64, Math.max(1, shop.stock % 65)),
          maxStack: 64,
          lore: [],
        }}
        badgeText="库存"
        badgeColor="#55ffff"
        customTooltip={{
          title: '§b📦 自定义超大库存设定 (铁砧)',
          lore: [
            `§7当前库存数量: §b${shop.stock} 件`,
            `§7库存存储上限: §3${shop.maxStock} 件`,
            '§f--------------------------------',
            '§a▶ 点击直接输入超大数量 (如 300 件)',
          ],
        }}
        payload={{ action: 'shop_stock_input' }}
      />

      {/* 槽位 23: 库存容量上限 */}
      <Slot
        slot={23}
        screen="shop_edit"
        item={{
          id: 'btn_capacity_info',
          name: `§3容量上限: §b${shop.maxStock} 件`,
          icon: 'lock',
          rarity: 'rare',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§3🔒 超大库存容量上限',
          lore: [
            `§7此商店最大可同时容纳 §b${shop.maxStock} 件 §7同类商品。`,
            '§7完全突破 Minecraft 64 堆叠限制。',
          ],
        }}
      />

      {renderBorderSlot(24)}

      {/* 槽位 25: +100 单价 */}
      <Slot
        slot={25}
        screen="shop_edit"
        item={{
          id: 'price_p100',
          name: '§a+100 单价',
          icon: 'plus_qty',
          rarity: 'uncommon',
          category: 'other',
          amount: 1,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a+100 单件售价',
          lore: [`§7当前单价: §e${shop.unitPrice}`, '§e▶ 左键点击单价 +100'],
        }}
        payload={{ action: 'shop_adjust_price', delta: 100 }}
      />

      {renderBorderSlot(26)}

      {/* ================= 行 3 (槽位 27~35): 超大库存存入/取出/下架 ================= */}
      {renderBorderSlot(27)}

      {/* 槽位 28: 从背包存入 64 件 */}
      <Slot
        slot={28}
        screen="shop_edit"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'btn_dep_64',
          name: '§a从背包存入 +64',
          icon: 'arrow_right',
          rarity: 'rare',
          category: 'other',
          amount: 64,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a➕ 从背包存入 64 件同类物品',
          lore: [
            '§7在玩家背包中寻找同类商品并转移 64 件至商店。',
            '§e▶ 左键点击执行存入',
          ],
        }}
        payload={{ action: 'shop_deposit_from_inv', mode: 'stack' }}
      />

      {/* 槽位 29: 背包同类全部存入 */}
      <Slot
        slot={29}
        screen="shop_edit"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'btn_dep_all',
          name: '§a背包同类全部存入',
          icon: 'arrow_right',
          rarity: 'epic',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§a⚡ 背包同类全部存入',
          lore: [
            '§7一键将背包内所有该商品存入商店库存。',
            '§e▶ 左键点击一键全部存入',
          ],
        }}
        payload={{ action: 'shop_deposit_from_inv', mode: 'all' }}
      />

      {/* 槽位 30: 从商店取出 64 件 */}
      <Slot
        slot={30}
        screen="shop_edit"
        state={targetItem && shop.stock > 0 ? 'normal' : 'disabled'}
        item={{
          id: 'btn_wdr_64',
          name: '§b从商店取出 -64',
          icon: 'arrow_left',
          rarity: 'rare',
          category: 'other',
          amount: 64,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§b➖ 从商店取出 64 件至背包',
          lore: [
            '§7将商店库存中的 64 件商品取出装入背包空闲槽位。',
            '§e▶ 左键点击取出',
          ],
        }}
        payload={{ action: 'shop_withdraw_to_inv', mode: 'stack' }}
      />

      {/* 槽位 31: 全部取出至背包 */}
      <Slot
        slot={31}
        screen="shop_edit"
        state={targetItem && shop.stock > 0 ? 'normal' : 'disabled'}
        item={{
          id: 'btn_wdr_all',
          name: '§b全部取出至背包',
          icon: 'arrow_left',
          rarity: 'epic',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§b📦 全部取出至背包',
          lore: [
            '§7尽可能将商店全部库存取出装入玩家背包。',
            '§e▶ 左键点击批量取出',
          ],
        }}
        payload={{ action: 'shop_withdraw_to_inv', mode: 'all' }}
      />

      {/* 槽位 32: 一键设为 300 件 (超大库存演示) */}
      <Slot
        slot={32}
        screen="shop_edit"
        state={targetItem ? 'normal' : 'disabled'}
        badgeText="300"
        badgeColor="#d066ff"
        item={{
          id: 'btn_quick_300',
          name: '§d§l一键设为 300 件 (演示)',
          icon: 'ore_mythril',
          rarity: 'epic',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§d⚡ 快速填充超大库存: 300 件',
          lore: [
            '§7专为本次需求演示提供：',
            '§7快速将商店库存直接设为 §d300 件§7，验证超大存储与买家端上限校验！',
            '§a▶ 左键点击填充为 300 件',
          ],
        }}
        payload={{ action: 'shop_set_stock_quick', amount: 300 }}
      />

      {renderBorderSlot(33)}

      {/* 槽位 34: 下架商品并退还库存 */}
      <Slot
        slot={34}
        screen="shop_edit"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'btn_unlist',
          name: '§c§l[ 下架商品 ]',
          icon: 'cross_red',
          rarity: 'mythic',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§c❌ 下架当前商品',
          lore: [
            '§7下架商品并将所有库存退回至玩家背包。',
            '§7商店将恢复为初始待上架状态。',
            '§c▶ 左键点击确认下架',
          ],
        }}
        payload={{ action: 'shop_unlist' }}
      />

      {renderBorderSlot(35)}

      {/* ================= 行 4 & 5 (槽位 36~53): 操作提示与底栏装饰 ================= */}
      {Array.from({ length: 18 }, (_, idx) => {
        const slotNum = 36 + idx;
        if (slotNum === 40) {
          return (
            <Slot
              key={slotNum}
              slot={slotNum}
              screen="shop_edit"
              state="normal"
              badgeText="指引"
              badgeColor="#55ff55"
              item={{
                id: 'guide_slot',
                name: '§a§l[ 上架操作指南 ]',
                icon: 'book',
                rarity: 'rare',
                category: 'other',
                amount: 1,
                maxStack: 1,
                lore: [],
              }}
              customTooltip={{
                title: '§a📖 箱子商店使用指南',
                lore: [
                  '§f1. 初始状态为待上架，点击下方行囊任意物品即可上架。',
                  '§f2. 箱子商店仅支持单品销售，上架后点击同类物品可补充库存。',
                  '§f3. 支持直接输入单价与超大库存 (如 300 件)。',
                  '§f4. 切换到买家视角可体验数量调整与背包容量防御。',
                ],
              }}
            />
          );
        }
        return renderBorderSlot(slotNum);
      })}
    </GuiFrame>
  );
};
