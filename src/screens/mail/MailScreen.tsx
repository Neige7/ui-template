import React from 'react';
import { GuiFrame } from '../../core/GuiFrame';
import { useGui } from '../../core/GuiContext';
import { MinecraftText } from '../../core/MinecraftText';
import { PagerSlot } from '../../core/Pager';
import { Slot } from '../../core/Slot';
import { zh_CN } from '../../i18n/zh_CN';
import { Mail, MailTab } from '../../types';

export const MailScreen: React.FC = () => {
  const { state } = useGui();
  const {
    activeTab,
    currentPage,
    selectedMailId,
    mails,
    cdkInput,
    cdkStatus,
    cdkRewardItems,
    cdkMessage,
    draft,
  } = state.mail;

  const sysUnread = mails.filter(
    (m) => m.type === 'system' && !m.read && !m.expired
  ).length;
  const plrUnread = mails.filter(
    (m) => m.type === 'player' && !m.read && !m.expired
  ).length;

  const topTabs: {
    key: MailTab;
    slot: number;
    label: string;
    icon: string;
    unread?: number;
  }[] = [
    {
      key: 'system',
      slot: 0,
      label: '系统邮件',
      icon: sysUnread > 0 ? 'mail_unread' : 'mail_read',
      unread: sysUnread,
    },
    {
      key: 'player',
      slot: 1,
      label: '玩家邮件',
      icon: plrUnread > 0 ? 'mail_unread' : 'mail_read',
      unread: plrUnread,
    },
    { key: 'cdk', slot: 2, label: 'CDK 兑换', icon: 'gem_star' },
    { key: 'send', slot: 3, label: '发送邮件', icon: 'scroll_quest' },
  ];

  // 系统或玩家邮件列表数据
  const isMailListMode = activeTab === 'system' || activeTab === 'player';
  const filteredMails = isMailListMode
    ? mails.filter((m) => m.type === activeTab)
    : [];
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMails.length / pageSize));
  const pageMails = filteredMails.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedMail: Mail | null = isMailListMode
    ? filteredMails.find((m) => m.id === selectedMailId) ||
      filteredMails[0] ||
      null
    : null;

  const listSlotNumbers = [9, 10, 11, 12, 13, 18, 19, 20, 21, 22];

  const renderSlot = (slotNum: number) => {
    // 1. 顶部槽位 0~3: 四个 Tab
    const tab = topTabs.find((t) => t.slot === slotNum);
    if (tab) {
      const isSelected = activeTab === tab.key;
      const badge =
        tab.unread && tab.unread > 0
          ? `●${tab.unread}`
          : isSelected
          ? '★'
          : undefined;
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="mail"
          state={isSelected ? 'selected' : 'normal'}
          badgeText={badge}
          badgeColor={tab.unread && tab.unread > 0 ? '#ff5555' : '#ffd369'}
          item={{
            id: `mtab_${tab.key}`,
            name: isSelected ? `§6§l${tab.label}` : `§7${tab.label}`,
            icon: tab.icon,
            rarity: isSelected ? 'legendary' : 'common',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: isSelected
              ? `§6★ ${tab.label} (当前标签页)`
              : `§f切换至「${tab.label}」`,
            lore: [
              tab.unread
                ? `§c● 当前有 ${tab.unread} 封未读邮件！`
                : '§7点击切换至此子视图',
              '§a▶ 左键点击切换',
            ],
          }}
          payload={{ action: `mail_tab:${tab.key}` }}
        />
      );
    }

    // 槽位 8: 返回角色行囊 Hub
    if (slotNum === 8) {
      return (
        <Slot
          key={slotNum}
          slot={slotNum}
          screen="mail"
          item={{
            id: 'back_hub',
            name: '§e返回角色行囊 (Hub)',
            icon: 'chest_plate',
            rarity: 'rare',
            category: 'other',
            amount: 1,
            maxStack: 1,
            lore: [],
          }}
          customTooltip={{
            title: '§e⬅ 返回角色行囊 (Hub)',
            lore: ['§7返回角色背包主界面'],
          }}
          payload={{ action: 'nav_screen:inventory' }}
        />
      );
    }

    // ==================== 模式 A: 系统邮件 / 玩家邮件 ====================
    if (isMailListMode) {
      const listIdx = listSlotNumbers.indexOf(slotNum);
      if (listIdx !== -1) {
        if (filteredMails.length === 0 && slotNum === 11) {
          return (
            <Slot
              key={slotNum}
              slot={slotNum}
              screen="mail"
              state="disabled"
              placeholderIcon="mail_read"
              badgeText="空"
              customTooltip={{
                title: '§7📭 当前收件箱没有任何邮件',
                lore: ['§8有新的系统通知或好友来信时将在此处显示。'],
              }}
            />
          );
        }

        const mail = pageMails[listIdx];
        if (!mail) {
          return <Slot key={slotNum} slot={slotNum} screen="mail" state="normal" />;
        }

        const isSelected = selectedMail?.id === mail.id;
        const hasUnclaimedAtt =
          !mail.claimed &&
          !mail.expired &&
          (mail.attachments.length > 0 || (mail.attachedGold || 0) > 0);

        let badge = mail.read ? '已读' : '●未读';
        let badgeColor = mail.read ? '#888888' : '#ff5555';
        if (mail.expired) {
          badge = '已过期';
          badgeColor = '#777777';
        } else if (hasUnclaimedAtt) {
          badge = mail.read ? '🎁附件' : '●附件';
          badgeColor = '#ffd369';
        }

        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state={isSelected ? 'selected' : 'normal'}
            badgeText={badge}
            badgeColor={badgeColor}
            item={{
              id: mail.id,
              name: mail.expired ? `§8${mail.title}` : mail.title,
              icon: mail.expired
                ? 'mail_read'
                : !mail.read
                ? 'mail_unread'
                : 'mail_read',
              rarity: mail.expired
                ? 'common'
                : hasUnclaimedAtt
                ? 'legendary'
                : 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: mail.title,
              lore: [
                `§7发件人: §b${mail.sender}`,
                `§7状态: ${
                  mail.expired
                    ? '§8[已过期 · 标灰不可领]'
                    : mail.read
                    ? '§a[已读]'
                    : '§c[●未读]'
                } §7| 有效期: §e${mail.expireAt}`,
                `§7附件状态: ${
                  mail.claimed
                    ? '§8已领取'
                    : mail.attachments.length > 0 || mail.attachedGold
                    ? `§6包含 ${mail.attachments.length} 件物品 / ${mail.attachedGold || 0} 金币`
                    : '§8无附件'
                }`,
                '',
                ...mail.content,
                '',
                '§a▶ 左键点击阅读邮件并查看右侧附件',
              ],
            }}
            payload={{ action: 'select_mail', mailId: mail.id }}
          />
        );
      }

      // 槽位 15: 选中邮件正文详情槽
      if (slotNum === 15) {
        if (!selectedMail) {
          return (
            <Slot
              key={slotNum}
              slot={slotNum}
              screen="mail"
              state="disabled"
              placeholderIcon="mail_read"
              customTooltip={{
                title: '§8未选择邮件',
                lore: ['§7请在左侧点击选择一封邮件查看详情。'],
              }}
            />
          );
        }
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state="selected"
            badgeText={selectedMail.expired ? '过期' : '详情'}
            item={{
              id: `detail_${selectedMail.id}`,
              name: selectedMail.title,
              icon: 'book',
              rarity: selectedMail.expired ? 'common' : 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: selectedMail.title,
              lore: [
                `§7发件人: §b${selectedMail.sender}`,
                `§7剩余有效期: §e${selectedMail.expireAt}`,
                ...(selectedMail.attachedGold
                  ? [`§7随信金币: §6+${selectedMail.attachedGold} 金币`]
                  : []),
                '',
                ...selectedMail.content,
              ],
            }}
          />
        );
      }

      // 槽位 24, 25, 26: 选中邮件附件槽
      if (slotNum >= 24 && slotNum <= 26) {
        const attIdx = slotNum - 24;
        const attItem =
          selectedMail && !selectedMail.claimed
            ? selectedMail.attachments[attIdx] || null
            : null;
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state={selectedMail?.expired ? 'disabled' : 'normal'}
            item={attItem}
            badgeText={
              selectedMail?.claimed
                ? '已领'
                : attItem
                ? '附件'
                : undefined
            }
            badgeColor={selectedMail?.claimed ? '#888888' : '#ffd369'}
            customTooltip={
              !attItem
                ? {
                    title: `§8邮件附件槽 #${attIdx + 1} (${
                      selectedMail?.claimed ? '已领取' : '空'
                    })`,
                    lore: ['§7点击右下角「领取附件」按钮可将附件收取至背包。'],
                  }
                : undefined
            }
          />
        );
      }

      // 分页槽位 (36, 37, 38)
      if (slotNum === 36) {
        return (
          <PagerSlot
            key={slotNum}
            type="prev"
            slot={36}
            screen="mail"
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      }
      if (slotNum === 37) {
        return (
          <PagerSlot
            key={slotNum}
            type="indicator"
            slot={37}
            screen="mail"
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      }
      if (slotNum === 38) {
        return (
          <PagerSlot
            key={slotNum}
            type="next"
            slot={38}
            screen="mail"
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      }

      // 批量与单封邮件操作槽位 (41: 一键领取, 42: 删除已读(二次确认), 43: 领取附件, 44: 删除邮件)
      if (slotNum === 41) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText="全领"
            badgeColor="#55ff55"
            item={{
              id: 'btn_mail_claim_all',
              name: '§a🎁 一键领取全部附件',
              icon: 'check_green',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§a🎁 批量操作：一键领取',
              lore: [
                '§7自动收取当前分类下所有未过期邮件的附件与金币。',
                '§e若背包空间不足，将自动停止并给出提示。',
                '§a▶ 左键点击立即执行',
              ],
            }}
            payload={{ action: 'mail_claim_all' }}
          />
        );
      }

      if (slotNum === 42) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText="清已读"
            badgeColor="#ffaa00"
            item={{
              id: 'btn_mail_del_read',
              name: '§e🧹 批量删除已读邮件',
              icon: 'cross_red',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§e🧹 批量操作：删除已读 (需二次确认)',
              lore: [
                '§7清理所有已读且已领完附件（含已过期）的邮件。',
                '§c▶ 左键点击打开二次确认弹窗',
              ],
            }}
            payload={{ action: 'mail_delete_read' }}
          />
        );
      }

      if (slotNum === 43 && selectedMail) {
        const canClaim =
          !selectedMail.expired &&
          !selectedMail.claimed &&
          (selectedMail.attachments.length > 0 ||
            (selectedMail.attachedGold || 0) > 0);
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state={canClaim ? 'normal' : 'disabled'}
            badgeText={
              selectedMail.expired
                ? '已过期'
                : selectedMail.claimed
                ? '已领'
                : '领取'
            }
            item={{
              id: 'btn_mail_claim_one',
              name: canClaim ? '§a✔ 领取本封邮件附件' : '§8无待领附件 / 已过期',
              icon: 'check_green',
              rarity: canClaim ? 'uncommon' : 'common',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: canClaim
                ? '§a✔ 领取当前邮件附件'
                : selectedMail.expired
                ? '§c✖ 邮件已过期，附件无法领取'
                : '§8附件已领取或无附件',
              lore: [
                canClaim
                  ? '§7校验下方背包空间充足后，将附件发放至背包。'
                  : '§8不可操作',
              ],
            }}
            payload={{ action: 'mail_claim_single' }}
          />
        );
      }

      if (slotNum === 44 && selectedMail) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText="删除"
            badgeColor="#ff5555"
            item={{
              id: 'btn_mail_del_one',
              name: '§c🗑 删除本封邮件',
              icon: 'cross_red',
              rarity: 'mythic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§c🗑 删除当前选中邮件',
              lore: [
                '§7若仍有未领取的正常附件，系统将提醒您先领取再删除。',
                '§c▶ 左键点击删除',
              ],
            }}
            payload={{ action: 'mail_delete_single' }}
          />
        );
      }
    }

    // ==================== 模式 B: CDK 兑换 (含四种结果状态场景) ====================
    if (activeTab === 'cdk') {
      if (slotNum === 11) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state="selected"
            badgeText="铁砧输入"
            badgeColor="#55ffff"
            item={{
              id: 'cdk_input_slot',
              name: `§b⌨ 当前兑换码: §e${cdkInput || '点击输入'}`,
              icon: 'search',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§b⌨ CDK 铁砧输入框: §e${cdkInput || '(空)'}`,
              lore: [
                '§8[MC输入源: 铁砧输入 AnvilGUI / 模组 GuiTextField]',
                '§7输入礼包码后自动校验并展示兑换结果。',
                '',
                '§a▶ 左键点击打开铁砧输入框输入 CDK',
              ],
            }}
            payload={{ action: 'cdk_open_input' }}
          />
        );
      }

      // 槽位 19, 20, 21, 22: 四种 CDK 结果状态一键测试槽 (满足验收标准 P5)
      const cdkPresets: Record<
        number,
        { code: string; label: string; badge: string; color: string; desc: string }
      > = {
        19: {
          code: 'RPG-2026-STAR',
          label: '§a[测试场景 1] 兑换成功码',
          badge: '成功码',
          color: '#55ff55',
          desc: '触发「成功 (success)」状态并发放虚空护符与魔晶奖励',
        },
        20: {
          code: 'INVALID-CODE-999',
          label: '§c[测试场景 2] 无效兑换码',
          badge: '无效码',
          color: '#ff5555',
          desc: '触发「无效 (invalid)」结果状态提示',
        },
        21: {
          code: 'VIP-USED-888',
          label: '§e[测试场景 3] 已使用兑换码',
          badge: '已使用',
          color: '#ffff55',
          desc: '触发「已使用 (used)」结果状态提示',
        },
        22: {
          code: 'OLD-2024-GIFT',
          label: '§8[测试场景 4] 已过期兑换码',
          badge: '已过期',
          color: '#aaaaaa',
          desc: '触发「已过期 (expired)」结果状态提示',
        },
      };

      if (cdkPresets[slotNum]) {
        const p = cdkPresets[slotNum];
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText={p.badge}
            badgeColor={p.color}
            item={{
              id: `cdk_preset_${slotNum}`,
              name: p.label,
              icon: 'scroll_quest',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `${p.label} (${p.code})`,
              lore: [`§7${p.desc}`, '', '§a▶ 左键点击立即模拟兑换该 CDK'],
            }}
            payload={{ action: 'cdk_preset', code: p.code }}
          />
        );
      }

      // 槽位 15: CDK 兑换状态结果展示槽
      if (slotNum === 15) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state="selected"
            badgeText={cdkStatus.toUpperCase()}
            item={{
              id: 'cdk_result_status',
              name: `§6兑换状态: ${cdkStatus.toUpperCase()}`,
              icon:
                cdkStatus === 'success'
                  ? 'check_green'
                  : cdkStatus === 'idle'
                  ? 'book'
                  : 'cross_red',
              rarity: cdkStatus === 'success' ? 'legendary' : 'common',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§6📋 CDK 兑换结果 (${cdkStatus})`,
              lore: [cdkMessage],
            }}
          />
        );
      }

      // 槽位 24, 25: 兑换成功奖励预览
      if (slotNum === 24 || slotNum === 25) {
        const rewardItem = cdkRewardItems[slotNum - 24] || null;
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            item={rewardItem}
            badgeText={rewardItem ? '奖励' : undefined}
            badgeColor="#55ff55"
            customTooltip={
              !rewardItem
                ? {
                    title: '§8CDK 奖励展示槽',
                    lore: ['§7当 CDK 兑换成功时，在此展示获得的奖励物品。'],
                  }
                : undefined
            }
          />
        );
      }
    }

    // ==================== 模式 C: 发送邮件 (含收件人/标题/正文/4格附件槽/邮费/二次确认) ====================
    if (activeTab === 'send') {
      if (slotNum === 10) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText="收件人"
            item={{
              id: 'draft_recipient',
              name: `§b👤 收件人: §f${draft.recipient || '(未填)'}`,
              icon: 'helmet_gold',
              rarity: 'rare',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§b👤 收件人: §f${draft.recipient || '(空)'}`,
              lore: [
                '§8[MC输入源: 铁砧 AnvilGUI]',
                '§a▶ 左键点击修改收件人玩家名称',
              ],
            }}
            payload={{ action: 'mail_edit_draft_field', field: 'recipient' }}
          />
        );
      }

      if (slotNum === 11) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText="标题"
            item={{
              id: 'draft_title',
              name: `§e📌 标题: §f${draft.title || '(未填)'}`,
              icon: 'scroll_quest',
              rarity: 'uncommon',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§e📌 邮件标题: §f${draft.title || '(空)'}`,
              lore: [
                '§8[MC输入源: 铁砧 AnvilGUI]',
                '§a▶ 左键点击修改邮件标题',
              ],
            }}
            payload={{ action: 'mail_edit_draft_field', field: 'title' }}
          />
        );
      }

      if (slotNum === 12) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText="正文"
            item={{
              id: 'draft_content',
              name: '§a📝 编辑邮件正文内容',
              icon: 'book',
              rarity: 'epic',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§a📝 邮件正文内容',
              lore: [
                `§f"${draft.content || '(空)'}"`,
                '',
                '§8[MC输入源: 聊天栏捕获 AsyncPlayerChatEvent / 书与笔]',
                '§a▶ 左键点击编辑正文',
              ],
            }}
            payload={{ action: 'mail_edit_draft_field', field: 'content' }}
          />
        );
      }

      // 槽位 15: 邮费说明槽
      if (slotNum === 15) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            badgeText={`${draft.postage}G`}
            item={{
              id: 'draft_postage',
              name: `§6🪙 固定邮费: ${draft.postage} 金币`,
              icon: 'coin_gold',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: `§6🪙 信使邮资说明: ${draft.postage} 金币`,
              lore: [
                `§7您当前持有: §6${state.player.gold.toLocaleString()} 金币`,
                '§7发送邮件前将校验收件人、标题、正文及邮费余额。',
              ],
            }}
          />
        );
      }

      // 槽位 21, 22, 23, 24: 4 个待发送附件暂存槽
      if (slotNum >= 21 && slotNum <= 24) {
        const attIdx = slotNum - 21;
        const item = draft.attachments[attIdx];
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            item={item}
            badgeText={`附${attIdx + 1}`}
            badgeColor="#55ffff"
            customTooltip={
              !item
                ? {
                    title: `§b📦 发件附件暂存槽 #${attIdx + 1} (空)`,
                    lore: [
                      '§7可从下方玩家背包拿起未绑定物品放入，',
                      '§7或在背包中按 §aShift+左键 §7快速添加附件。',
                      '§c⚠ 拾取绑定物品禁止邮寄。',
                    ],
                  }
                : undefined
            }
            actionHints={['§e左键:放入或取回暂存附件']}
            payload={{ action: 'mail_draft_attachment', attIdx }}
          />
        );
      }

      // 槽位 43: 确认发送邮件按钮 (需二次确认)
      if (slotNum === 43) {
        return (
          <Slot
            key={slotNum}
            slot={slotNum}
            screen="mail"
            state="selected"
            badgeText="发送"
            badgeColor="#55ff55"
            item={{
              id: 'btn_mail_send',
              name: '§a§l✉ 立即发送邮件 (二次确认)',
              icon: 'check_green',
              rarity: 'legendary',
              category: 'other',
              amount: 1,
              maxStack: 1,
              lore: [],
            }}
            customTooltip={{
              title: '§a§l✉ 立即发送玩家邮件 (需二次确认)',
              lore: [
                `§7收件人: §b${draft.recipient || '(未填)'}`,
                `§7标题: §f${draft.title || '(未填)'}`,
                `§7附件数: §e${draft.attachments.filter(Boolean).length} / 4 件`,
                `§7邮费: §6${draft.postage} 金币`,
                '',
                '§a▶ 左键点击校验字段并弹出发送确认框',
              ],
            }}
            payload={{ action: 'mail_send_submit' }}
          />
        );
      }
    }

    return <Slot key={slotNum} slot={slotNum} screen="mail" state="hidden" />;
  };

  return (
    <GuiFrame
      screen="mail"
      title={zh_CN.screens.mail}
      rows={5}
      subtitleRight={`§e未读: §c${sysUnread + plrUnread} 封`}
      footerBanner={
        activeTab === 'cdk' ? (
          <MinecraftText text={cdkMessage} />
        ) : activeTab === 'send' ? (
          <MinecraftText
            text={`§7草稿 -> 收件人: §b${draft.recipient} §7| 标题: §f${draft.title} §7| 邮费: §6${draft.postage}G`}
          />
        ) : selectedMail ? (
          <MinecraftText
            text={`${selectedMail.title} §7(发件人: §b${selectedMail.sender} §7| 有效期: §e${selectedMail.expireAt}§7)`}
          />
        ) : (
          <MinecraftText text="§7📭 当前分类暂无邮件" />
        )
      }
    >
      {Array.from({ length: 45 }, (_, i) => renderSlot(i))}
    </GuiFrame>
  );
};
