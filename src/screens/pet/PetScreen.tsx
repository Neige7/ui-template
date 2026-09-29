import React from 'react';
import { useGui } from '../../core/GuiContext';
import { zh_CN } from '../../i18n/zh_CN';
import {
  CompanionTemplate,
  CompanionTemplateConfig,
} from './CompanionTemplate';

const PET_CONFIG: CompanionTemplateConfig = {
  mode: 'pet',
  title: zh_CN.screens.pet,
  emptyTitle: '§7🐾 尚未缔结任何灵宠契约',
  emptyLore: [
    '§8可通过副本首领掉落、寻宝或任务奖励获得灵宠蛋。',
  ],
  activeBadgeText: '出战',
  activeButtonActivateLabel: '§a⚔ 设为出战灵宠',
  activeButtonRecallLabel: '§e🌙 收回休息',
  equipSlotTitle: '宠物专属护具槽',
  equipPlaceholderIcon: 'pet_collar',
  showSpeedAndSkin: false,
};

export const PetScreen: React.FC = () => {
  const { state } = useGui();
  const { pets, selectedPetId, currentPage, equipSlotCount } = state.pet;

  return (
    <CompanionTemplate
      config={PET_CONFIG}
      companions={pets}
      selectedId={selectedPetId}
      currentPage={currentPage}
      equipSlotCount={equipSlotCount}
    />
  );
};
