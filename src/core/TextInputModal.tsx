import React, { useEffect, useState } from 'react';
import { zh_CN } from '../i18n/zh_CN';
import { useGui } from './GuiContext';
import { MinecraftText } from './MinecraftText';

export const TextInputModal: React.FC = () => {
  const { state, dispatchAction } = useGui();
  const modal = state.ui.textInputModal;
  const [value, setValue] = useState('');

  useEffect(() => {
    if (modal) {
      setValue(modal.defaultValue || '');
    }
  }, [modal]);

  if (!modal) return null;

  const sourceLabel = zh_CN.inputSources[modal.mcSource];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchAction({
      ...modal.targetAction,
      payload: {
        ...(typeof modal.targetAction.payload === 'object' && modal.targetAction.payload
          ? modal.targetAction.payload
          : {}),
        inputText: value.trim(),
      },
    });
  };

  const handleCancel = () => {
    dispatchAction({
      screen: state.currentScreen,
      slot: 'MODAL_CANCEL',
      click: 'left',
      payload: { action: 'text_input_cancel' },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 7, 12, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 8500,
      }}
    >
      <div
        className="mc-gui-frame"
        style={{
          width: '440px',
          padding: '16px',
          boxShadow: '0 0 0 2px #55ffff, 0 20px 50px rgba(0,0,0,0.9)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 700 }}>
            <MinecraftText text={modal.title} />
          </span>
          <span className="mc-debug-layer-tag">MC Input Bridge</span>
        </div>

        {/* 标注 MC 输入来源 (A7 约束) */}
        <div
          style={{
            background: '#171a29',
            border: '1px solid #3c4569',
            padding: '8px 10px',
            marginBottom: '12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: '#98a4d4',
          }}
        >
          <div style={{ color: '#ffd369', marginBottom: '2px' }}>
            📌 MC 移植输入源标注: {sourceLabel}
          </div>
          <div style={{ fontSize: '11px', color: '#7e88b0' }}>
            • 模组客户端方案：直接渲染原生 GuiTextField 控件并通过 CustomPayload 发包
            <br />• 纯插件容器回退：通过 {modal.mcSource.toUpperCase()} 捕获字符串后回调刷新容器
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            maxLength={modal.maxLength}
            placeholder={modal.placeholder}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: '#10121c',
              border: '2px solid #5c6282',
              color: '#ffffff',
              fontFamily: 'var(--font-pixel)',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '8px',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#8e96b8',
              marginBottom: '12px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>最大长度限制: {value.length} / {modal.maxLength} 字符</span>
            <span>支持回车立即提交</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="wb-btn" onClick={handleCancel}>
              取消 (ESC)
            </button>
            <button type="submit" className="wb-btn active">
              确认提交 (Enter)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
