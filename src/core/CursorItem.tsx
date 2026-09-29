import React, { useEffect, useState } from 'react';
import { useGui } from './GuiContext';
import { ItemIcon } from './ItemIcon';

export const CursorItem: React.FC = () => {
  const { state } = useGui();
  const cursorItem = state.player.cursorItem;
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    if (!cursorItem) return;
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [cursorItem]);

  if (!cursorItem) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x - 18}px`,
        top: `${pos.y - 18}px`,
        width: 'var(--slot-size)',
        height: 'var(--slot-size)',
        pointerEvents: 'none',
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.85))',
      }}
    >
      <ItemIcon icon={cursorItem.icon} rarity={cursorItem.rarity} />
      {cursorItem.amount > 1 && (
        <span className="mc-item-amount">{cursorItem.amount}</span>
      )}
    </div>
  );
};
