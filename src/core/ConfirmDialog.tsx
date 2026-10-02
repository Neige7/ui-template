import React from 'react';
import { useGui } from './GuiContext';
import { MinecraftText } from './MinecraftText';
import { Slot } from './Slot';

export const ConfirmDialog: React.FC = () => {
  const { state, debugMode } = useGui();
  const dialog = state.ui.confirmDialog;
  if (!dialog) return null;

  const slots = Array.from({ length: 27 }, (_, idx) => idx);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 7, 12, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 8000,
      }}
    >
      <div
        className={`mc-gui-frame ${debugMode ? 'mc-debug-grid-active' : ''}`}
        style={{ boxShadow: '0 0 0 2px #d4a64a, 0 20px 50px rgba(0,0,0,0.9)' }}
      >
        <div className="mc-gui-header">
          <MinecraftText text={`§c§l⚠ 二次确认 · ${dialog.title}`} />
          <span className="mc-debug-layer-tag">ConfirmSubGUI (3×9)</span>
        </div>

        {/* 标题栏下金色分隔线 (与主容器一致) */}
        <div className="mc-gui-header-rule" aria-hidden="true" />

        <div
          className="mc-slot-grid"
          style={{ height: 'calc(3 * var(--slot-size))' }}
        >
          {slots.map((idx) => {
            if (idx === 11) {
              return (
                <Slot
                  key={idx}
                  slot={`CONFIRM_${idx}`}
                  item={{
                    id: 'confirm_yes',
                    name: dialog.confirmText || '§a§l✔ 确认执行操作',
                    icon: 'check_green',
                    rarity: 'uncommon',
                    category: 'other',
                    amount: 1,
                    maxStack: 1,
                    lore: [],
                  }}
                  customTooltip={{
                    title: dialog.confirmText || '§a§l✔ 确认执行操作',
                    lore: [
                      ...dialog.description,
                      '',
                      '§a▶ 左键点击立即确认并执行',
                    ],
                  }}
                  payload={{
                    action: 'confirm_dialog_accept',
                    forwardedAction: dialog.onConfirmAction,
                  }}
                />
              );
            }

            if (idx === 13) {
              return (
                <Slot
                  key={idx}
                  slot={`CONFIRM_${idx}`}
                  state="selected"
                  item={{
                    id: 'confirm_info',
                    name: `§e${dialog.title}`,
                    icon: 'scroll_quest',
                    rarity: 'legendary',
                    category: 'other',
                    amount: 1,
                    maxStack: 1,
                    lore: [],
                  }}
                  customTooltip={{
                    title: `§6📋 操作说明: ${dialog.title}`,
                    lore: dialog.description,
                  }}
                  payload={{ action: 'confirm_dialog_info' }}
                />
              );
            }

            if (idx === 15) {
              return (
                <Slot
                  key={idx}
                  slot={`CONFIRM_${idx}`}
                  item={{
                    id: 'confirm_no',
                    name: dialog.cancelText || '§c§l✖ 取消并返回',
                    icon: 'cross_red',
                    rarity: 'mythic',
                    category: 'other',
                    amount: 1,
                    maxStack: 1,
                    lore: [],
                  }}
                  customTooltip={{
                    title: dialog.cancelText || '§c§l✖ 取消并返回',
                    lore: ['§7放弃本次操作并返回原界面', '', '§c▶ 左键点击取消'],
                  }}
                  payload={{ action: 'confirm_dialog_cancel' }}
                />
              );
            }

            return (
              <Slot
                key={idx}
                slot={`CONFIRM_${idx}`}
                state="hidden"
              />
            );
          })}
        </div>

        <div
          style={{
            padding: 'calc(3px * var(--gui-scale))',
            textAlign: 'center',
            fontSize: 'calc(4.5px * var(--gui-scale))',
          }}
        >
          {dialog.description.map((line, i) => (
            <div key={i}>
              <MinecraftText text={line} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
