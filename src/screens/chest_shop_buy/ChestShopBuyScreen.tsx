import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import {
  calculateMaxInventoryCapacity,
  getPlayerCurrencyBalance,
} from '../../mock/server';
import { ShopCurrencyType } from '../../types';

const CURRENCY_CONFIG: Record<
  ShopCurrencyType,
  { label: string; icon: string; name: string; symbol: string; color: string }
> = {
  gold: { label: '金币 (Vault)', icon: 'coin_gold', name: '金币', symbol: '🪙', color: '§6' },
  gems: { label: '点券 (Points)', icon: 'gem_star', name: '点券', symbol: '💎', color: '§b' },
  emerald: { label: '绿宝石 (Emerald)', icon: 'emerald', name: '绿宝石', symbol: '❇️', color: '§a' },
};

export const ChestShopBuyScreen: React.FC = () => {
  const { state } = useGui();
  const shop = state.chestShop;
  const targetItem = shop.targetItem;
  const currentCurrency = CURRENCY_CONFIG[shop.currency];

  const maxInventorySpace = targetItem
    ? calculateMaxInventoryCapacity(state.player.inventory, targetItem)
    : 0;
  const playerBalance = getPlayerCurrencyBalance(state.player, shop.currency);
  const totalPrice = shop.buyAmount * shop.unitPrice;

  const hasEnoughStock = targetItem ? shop.stock >= shop.buyAmount : false;
  const hasEnoughSpace = maxInventorySpace >= shop.buyAmount;
  const hasEnoughBalance = playerBalance >= totalPrice;
  const canBuy =
    Boolean(targetItem) &&
    shop.buyAmount > 0 &&
    hasEnoughStock &&
    hasEnoughSpace &&
    hasEnoughBalance;

  const renderBorderSlot = (slotNum: number) => (
    <Slot
      key={slotNum}
      slot={slotNum}
      screen="shop_buy"
      state="disabled"
      item={{
        id: `pane_buy_${slotNum}`,
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
      screen="shop_buy"
      title={zh_CN.screens.shop_buy}
      rows={6}
      subtitleRight={`§7店主: §6${shop.ownerName} §7| 结算: ${currentCurrency.symbol} ${currentCurrency.name}`}
      footerBanner={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <MinecraftText
              text={
                !targetItem
                  ? '§c提示：当前商店暂未上架任何商品，请前往店主编辑界面进行上架！'
                  : !hasEnoughSpace
                  ? `§c⚠️ 背包空间不足！当前选定 ${shop.buyAmount} 件，但背包仅可装入 ${maxInventorySpace} 件。`
                  : !hasEnoughStock
                  ? `§c⚠️ 商店库存不足！当前库存仅剩 ${shop.stock} 件。`
                  : !hasEnoughBalance
                  ? `§c⚠️ 余额不足！总价需 ${totalPrice.toLocaleString()} ${currentCurrency.name}，尚缺 ${(totalPrice - playerBalance).toLocaleString()}。`
                  : `§a✔ 条件满足：拟购 §e${shop.buyAmount} 件 §7| 总计: §6${totalPrice.toLocaleString()} ${currentCurrency.name} §7| 购买后直接进入下方背包`
              }
            />
          </div>
          <div>
            <MinecraftText
              text={`§7背包可容纳: ${maxInventorySpace > 0 ? `§a${maxInventorySpace}` : '§c已满'} 件`}
            />
          </div>
        </div>
      }
      playerInventoryHint="§7下方为您的玩家行囊 (P0~P35)，购买成功后的商品将直接自动堆叠或装入空格"
    >
      {/* ================= 行 0 (槽位 0~8): 商店标语、单价与快捷入口 ================= */}
      {/* 槽位 0: 商店与店主看板 */}
      <Slot
        slot={0}
        screen="shop_buy"
        item={{
          id: 'shop_buy_header',
          name: `§6§l[ ${shop.shopTitle} §6§l]`,
          icon: 'chest_shop',
          rarity: 'legendary',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: `§6★ ${shop.shopTitle}`,
          lore: [
            `§7店主玩家: §f${shop.ownerName}`,
            '§7品质保障 · 全服超大容量箱子商店',
            '§f--------------------------------',
            `§7结算货币: ${currentCurrency.color}${currentCurrency.label}`,
            `§7当前在售: ${targetItem ? `§f${targetItem.name}` : '§c暂未上架'}`,
            `§7可用库存: §b${shop.stock} 件`,
          ],
        }}
      />

      {renderBorderSlot(1)}
      {renderBorderSlot(2)}
      {renderBorderSlot(3)}

      {/* 槽位 4: 货币与单价标价牌 */}
      <Slot
        slot={4}
        screen="shop_buy"
        badgeText="售价"
        badgeColor="#ffd369"
        item={{
          id: 'shop_price_board',
          name: `§e§l单价: §f${shop.unitPrice} ${currentCurrency.symbol} ${currentCurrency.name} / 件`,
          icon: currentCurrency.icon,
          rarity: 'epic',
          category: 'other',
          amount: Math.min(64, Math.max(1, shop.unitPrice % 65)),
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§e🏷 商品单价牌',
          lore: [
            `§7结算货币类型: ${currentCurrency.color}${currentCurrency.label}`,
            `§7单件售价: §e${shop.unitPrice.toLocaleString()} ${currentCurrency.name}`,
            '§f--------------------------------',
            `§7拟购 ${shop.buyAmount} 件合计: §6${totalPrice.toLocaleString()} ${currentCurrency.name}`,
          ],
        }}
      />

      {renderBorderSlot(5)}
      {renderBorderSlot(6)}
      {renderBorderSlot(7)}

      {/* 槽位 8: 切换至店主管理视角 */}
      <Slot
        slot={8}
        screen="shop_buy"
        item={{
          id: 'btn_to_admin',
          name: '§6§l⚙ 切换至店主管理视角',
          icon: 'chest_gold',
          rarity: 'legendary',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§6⚙ 店主管理面板',
          lore: [
            '§7切换至箱子商店的商品编辑与库存管理界面。',
            '§7可上架新商品、编辑单价、调整超大库存 (如 300 件)。',
            '§a▶ 左键点击即刻切换',
          ],
        }}
        payload={{ action: 'nav_screen:shop_edit' }}
      />

      {/* ================= 行 1 (槽位 9~17): 居中商品展示槽位 ================= */}
      {renderBorderSlot(9)}
      {renderBorderSlot(10)}
      {renderBorderSlot(11)}
      {renderBorderSlot(12)}

      {/* 槽位 13: 核心在售商品展示槽位 */}
      {targetItem ? (
        <Slot
          slot={13}
          screen="shop_buy"
          item={targetItem}
          state="normal"
          badgeText="在售"
          badgeColor="#55ff55"
          customTooltip={{
            title: `§a★ 在售商品: ${targetItem.name}`,
            lore: [
              `§7单件价格: §e${shop.unitPrice} ${currentCurrency.name} (${currentCurrency.symbol})`,
              `§7商店当前库存: §b${shop.stock} 件 §7/ §3${shop.maxStock} 件`,
              `§7您的背包余量: ${maxInventorySpace > 0 ? `§a还可以容纳 ${maxInventorySpace} 件` : '§c背包已满 (0件)'}`,
              '§f--------------------------------',
              '§7下方按钮调节购买数量，可直接编辑，但不可超过背包上限！',
            ],
          }}
        />
      ) : (
        <Slot
          slot={13}
          screen="shop_buy"
          item={{
            id: 'empty_buy_target',
            name: '§c§l[ 商店暂未上架商品 ]',
            icon: 'empty_slot',
            rarity: 'mythic',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          badgeText="无货"
          badgeColor="#ff5555"
          customTooltip={{
            title: '§c⌛ 商店暂未上架商品',
            lore: [
              '§7店主尚未在编辑界面上架任何出售物品。',
              '§f--------------------------------',
              '§a▶ 点击右上角槽位 8 切换至店主管理界面进行上架',
            ],
          }}
          payload={{ action: 'nav_screen:shop_edit' }}
        />
      )}

      {renderBorderSlot(14)}
      {renderBorderSlot(15)}
      {renderBorderSlot(16)}
      {renderBorderSlot(17)}

      {/* ================= 行 2 (槽位 18~26): 购买数量修改调节器 (+-号与直接编辑) ================= */}
      {/* 槽位 18: -64 */}
      <Slot
        slot={18}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'buy_m64',
          name: '§c-64 件',
          icon: 'minus_qty',
          rarity: 'common',
          category: 'other',
          amount: 64,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§c-64 购买数量',
          lore: ['§7减少 64 件拟购数量 (最低为 1 件)', '§e▶ 左键点击扣减'],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: -64 }}
      />

      {/* 槽位 19: -10 */}
      <Slot
        slot={19}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'buy_m10',
          name: '§c-10 件',
          icon: 'minus_qty',
          rarity: 'common',
          category: 'other',
          amount: 10,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§c-10 购买数量',
          lore: ['§7减少 10 件拟购数量', '§e▶ 左键点击扣减'],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: -10 }}
      />

      {/* 槽位 20: -1 */}
      <Slot
        slot={20}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'buy_m1',
          name: '§c-1 件',
          icon: 'minus_qty',
          rarity: 'common',
          category: 'other',
          amount: 1,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§c-1 购买数量',
          lore: ['§7减少 1 件拟购数量', '§e▶ 左键点击扣减'],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: -1 }}
      />

      {/* 槽位 21: MIN (归一) */}
      <Slot
        slot={21}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        badgeText="MIN"
        badgeColor="#8e96b8"
        item={{
          id: 'buy_min',
          name: '§7§lMIN: 归为 1 件',
          icon: 'cross_red',
          rarity: 'common',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§7最小数量 (MIN)',
          lore: ['§7将拟购数量重置为最少 1 件', '§e▶ 左键点击重置'],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: 'min' }}
      />

      {/* 槽位 22: 核心拟购数量展示与直接编辑 (受背包空间严格约束) */}
      <Slot
        slot={22}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        badgeText={String(shop.buyAmount)}
        badgeColor="#ffd369"
        item={{
          id: 'buy_qty_input',
          name: `§b§l当前选定数量: §e${shop.buyAmount} 件`,
          icon: 'price_tag',
          rarity: 'legendary',
          category: 'other',
          amount: Math.min(64, Math.max(1, shop.buyAmount % 65)),
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§b🛒 拟购买数量 (点击直接编辑)',
          lore: [
            `§7当前选定数量: §e${shop.buyAmount} 件`,
            `§7支付总计: §6${totalPrice.toLocaleString()} ${currentCurrency.name}`,
            '§f--------------------------------',
            `§a背包可容纳上限: §f${maxInventorySpace} 件`,
            `§3商店当前库存: §f${shop.stock} 件`,
            '§f--------------------------------',
            '§a▶ 点击打开铁砧弹窗，直接键盘输入数量',
            '§c※ 注意：输入数量绝对不能超过背包容纳上限！',
          ],
        }}
        payload={{ action: 'shop_buy_qty_input' }}
      />

      {/* 槽位 23: MAX (最大购买数量) */}
      <Slot
        slot={23}
        screen="shop_buy"
        state={targetItem && maxInventorySpace > 0 ? 'normal' : 'disabled'}
        badgeText="MAX"
        badgeColor="#55ff55"
        item={{
          id: 'buy_max',
          name: '§a§lMAX: 最大可购数量',
          icon: 'check_green',
          rarity: 'rare',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§a⚡ 一键设为最大可购数量 (MAX)',
          lore: [
            `§7取「商店库存(${shop.stock})」与「背包上限(${maxInventorySpace})」极小值：`,
            `§a▶ 当前最大可购买: §e${Math.min(shop.stock, maxInventorySpace)} 件`,
            '§e▶ 左键点击一键拉满',
          ],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: 'max' }}
      />

      {/* 槽位 24: +1 */}
      <Slot
        slot={24}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'buy_p1',
          name: '§a+1 件',
          icon: 'plus_qty',
          rarity: 'common',
          category: 'other',
          amount: 1,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a+1 购买数量',
          lore: [
            '§7增加 1 件拟购数量',
            `§8受背包空间限制 (上限: ${maxInventorySpace} 件)`,
            '§e▶ 左键点击增加',
          ],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: 1 }}
      />

      {/* 槽位 25: +10 */}
      <Slot
        slot={25}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'buy_p10',
          name: '§a+10 件',
          icon: 'plus_qty',
          rarity: 'common',
          category: 'other',
          amount: 10,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a+10 购买数量',
          lore: [
            '§7增加 10 件拟购数量',
            `§8受背包空间限制 (上限: ${maxInventorySpace} 件)`,
            '§e▶ 左键点击增加',
          ],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: 10 }}
      />

      {/* 槽位 26: +64 */}
      <Slot
        slot={26}
        screen="shop_buy"
        state={targetItem ? 'normal' : 'disabled'}
        item={{
          id: 'buy_p64',
          name: '§a+64 件',
          icon: 'plus_qty',
          rarity: 'common',
          category: 'other',
          amount: 64,
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§a+64 购买数量 (一组)',
          lore: [
            '§7增加 64 件拟购数量',
            `§8受背包空间限制 (上限: ${maxInventorySpace} 件)`,
            '§e▶ 左键点击增加',
          ],
        }}
        payload={{ action: 'shop_buy_adjust_qty', delta: 64 }}
      />

      {/* ================= 行 3 (槽位 27~35): 余额看板、确认购买大按钮、背包上限指示 ================= */}
      {renderBorderSlot(27)}
      {renderBorderSlot(28)}

      {/* 槽位 29: 持币余额 */}
      <Slot
        slot={29}
        screen="shop_buy"
        badgeText="余额"
        badgeColor="#ffd369"
        item={{
          id: 'player_balance_slot',
          name: `§e§l当前余额: §f${playerBalance.toLocaleString()} ${currentCurrency.name}`,
          icon: currentCurrency.icon,
          rarity: 'rare',
          category: 'other',
          amount: 1,
          maxStack: 1,
          lore: [],
        }}
        customTooltip={{
          title: '§e💰 个人持币账户',
          lore: [
            `§7当前持有: §e${playerBalance.toLocaleString()} ${currentCurrency.name}`,
            `§7预计支出: §6${totalPrice.toLocaleString()} ${currentCurrency.name}`,
            `§7交易后剩余: ${
              playerBalance >= totalPrice
                ? `§a${(playerBalance - totalPrice).toLocaleString()} ${currentCurrency.name}`
                : `§c不足 (缺 ${(totalPrice - playerBalance).toLocaleString()})`
            }`,
          ],
        }}
      />

      {renderBorderSlot(30)}

      {/* 槽位 31: 确认购买结算核心大按钮 */}
      <Slot
        slot={31}
        screen="shop_buy"
        state={canBuy ? 'normal' : 'disabled'}
        badgeText={canBuy ? '购买' : '不可买'}
        badgeColor={canBuy ? '#55ff55' : '#ff5555'}
        item={{
          id: 'btn_confirm_buy',
          name: canBuy ? '§a§l[ 确认购买结算 ]' : '§c§l[ 暂时无法购买 ]',
          icon: canBuy ? 'emerald' : 'cross_red',
          rarity: canBuy ? 'legendary' : 'common',
          category: 'other',
          amount: Math.min(64, Math.max(1, shop.buyAmount % 65)),
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: canBuy ? '§a§l[ 确认扣款并购买 ]' : '§c§l[ 购买条件未满足 ]',
          lore: [
            `§7商品名称: §f${targetItem ? targetItem.name : '无'}`,
            `§7购买数量: §e${shop.buyAmount} 件`,
            `§7单件单价: §e${shop.unitPrice} ${currentCurrency.name}`,
            `§7支付总额: §6${totalPrice.toLocaleString()} ${currentCurrency.name}`,
            '§f--------------------------------',
            `§71. 商店库存状态: ${hasEnoughStock ? '§a充足' : `§c不足 (剩${shop.stock})`}`,
            `§72. 背包空间校验: ${hasEnoughSpace ? '§a通过' : `§c超限 (仅能装${maxInventorySpace})`}`,
            `§73. 账户余额校验: ${hasEnoughBalance ? '§a充足' : '§c余额不足'}`,
            '§f--------------------------------',
            canBuy
              ? '§a▶ 左键点击立即扣款，商品将自动入库至下方背包！'
              : '§c※ 请调整数量或清理背包后重试',
          ],
        }}
        payload={{ action: 'shop_confirm_buy' }}
      />

      {renderBorderSlot(32)}

      {/* 槽位 33: 背包剩余容纳空间指示 */}
      <Slot
        slot={33}
        screen="shop_buy"
        badgeText="空间"
        badgeColor={maxInventorySpace > 0 ? '#55ffff' : '#ff5555'}
        item={{
          id: 'inventory_space_slot',
          name: `§3§l背包上限: §a${maxInventorySpace} 件`,
          icon: 'warehouse',
          rarity: 'rare',
          category: 'other',
          amount: Math.min(64, Math.max(1, maxInventorySpace % 65)),
          maxStack: 64,
          lore: [],
        }}
        customTooltip={{
          title: '§3🎒 背包空间上限指示',
          lore: [
            `§7根据您当前 36 格背包实时计算：`,
            `§7最多还能装入 §a${maxInventorySpace} 件 §7该物品。`,
            '§f--------------------------------',
            '§7数量调节器与直接输入已被严格限位：',
            '§7绝对不允许选择超过该数量的商品！',
          ],
        }}
      />

      {renderBorderSlot(34)}
      {renderBorderSlot(35)}

      {/* ================= 行 4 & 5 (槽位 36~53): 总价动态核算条与装饰 ================= */}
      {Array.from({ length: 18 }, (_, idx) => {
        const slotNum = 36 + idx;
        if (slotNum === 40) {
          return (
            <Slot
              key={slotNum}
              slot={slotNum}
              screen="shop_buy"
              state="normal"
              badgeText="核算"
              badgeColor="#ffd369"
              item={{
                id: 'calc_summary_slot',
                name: `§e核算: §b${shop.buyAmount} 件 §7× §e${shop.unitPrice} = §6${totalPrice.toLocaleString()} ${currentCurrency.name}`,
                icon: 'book',
                rarity: 'epic',
                category: 'other',
                amount: 1,
                maxStack: 1,
                lore: [],
              }}
              customTooltip={{
                title: '§e🧾 订单核算明细',
                lore: [
                  `§7拟购件数: §b${shop.buyAmount} 件`,
                  `§7单件价格: §e${shop.unitPrice.toLocaleString()} ${currentCurrency.name}`,
                  `§7总计费用: §6${totalPrice.toLocaleString()} ${currentCurrency.name}`,
                  '§f--------------------------------',
                  '§8确认购买后将按原版 64 堆叠规则装入背包',
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
