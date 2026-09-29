import { createContext, useContext } from 'react';
import { GuiAction, ServerState } from '../types';

export interface TooltipPayload {
  title: string;
  lore: string[];
  slotId: string | number;
  x: number;
  y: number;
}

export interface GuiContextValue {
  state: ServerState;
  dispatchAction: (action: GuiAction) => void;
  debugMode: boolean;
  setTooltip: (payload: TooltipPayload | null) => void;
}

export const GuiContext = createContext<GuiContextValue | null>(null);

export function useGui(): GuiContextValue {
  const ctx = useContext(GuiContext);
  if (!ctx) {
    throw new Error('useGui 必须在 GuiContext.Provider 内部使用');
  }
  return ctx;
}
