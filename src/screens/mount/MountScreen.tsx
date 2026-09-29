import React from 'react';
import { useGui } from '../../core/GuiContext';
import { zh_CN } from '../../i18n/zh_CN';
import {
  CompanionTemplate,
  CompanionTemplateConfig,
} from '../pet/CompanionTemplate';

const MOUNT_CONFIG: CompanionTemplateConfig = {
  mode: 'mount',
  title: zh_CN.screens.mount,
  emptyTitle: '§7🦅 兽栏中暂无已驯服坐骑',
  emptyLore: [
    '§8可通过皇家马厩任务、庆典活动或世界首领获取坐骑缰绳。',
  ],
  activeBadgeText: '骑乘',
  activeButtonActivateLabel: '§b🏇 骑乘 / 设为默认坐骑',
  activeButtonRecallLabel: '§e⛺ 解除骑乘休息',
  equipSlotTitle: '坐骑专属鞍具槽',
  equipPlaceholderIcon: 'mount_saddle',
  showSpeedAndSkin: true,
};

export const MountScreen: React.FC = () => {
  const { state } = useGui();
  const { mounts, selectedMountId, currentPage, equipSlotCount } = state.mount;

  return (
    <CompanionTemplate
      config={MOUNT_CONFIG}
      companions={mounts}
      selectedId={selectedMountId}
      currentPage={currentPage}
      equipSlotCount={equipSlotCount}
    />
  );
};
