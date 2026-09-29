import React from 'react';
import { ItemRarity } from '../types';

interface ItemIconProps {
  icon: string;
  rarity?: ItemRarity;
  size?: string;
}

const RARITY_ACCENT: Record<ItemRarity, string> = {
  common: '#9ea4b0',
  uncommon: '#55ff55',
  rare: '#55ffff',
  epic: '#d066ff',
  legendary: '#ffaa00',
  mythic: '#ff5555',
};

/**
 * 16×16 原创奇幻简约 RPG 像素矢量图标（严格对齐 16x16 像素网格）
 */
export const ItemIcon: React.FC<ItemIconProps> = ({ icon, rarity = 'common' }) => {
  const accent = RARITY_ACCENT[rarity] || '#9ea4b0';

  const renderPixelArt = () => {
    switch (icon) {
      case 'sword_mythic':
      case 'sword_legend':
      case 'sword_iron': {
        const bladeColor =
          icon === 'sword_mythic'
            ? '#ff5555'
            : icon === 'sword_legend'
            ? '#ffdd55'
            : '#d8e2ef';
        const hiltColor = icon === 'sword_iron' ? '#8b5a2b' : '#d4a64a';
        return (
          <>
            {/* 剑刃 */}
            <rect x="11" y="2" width="3" height="3" fill={bladeColor} />
            <rect x="9" y="4" width="3" height="3" fill={bladeColor} />
            <rect x="7" y="6" width="3" height="3" fill={bladeColor} />
            <rect x="5" y="8" width="3" height="3" fill={bladeColor} />
            <rect x="12" y="2" width="2" height="2" fill="#ffffff" />
            {/* 护手与剑柄 */}
            <rect x="3" y="7" width="2" height="2" fill={hiltColor} />
            <rect x="7" y="11" width="2" height="2" fill={hiltColor} />
            <rect x="4" y="10" width="3" height="2" fill={hiltColor} />
            <rect x="2" y="12" width="2" height="2" fill="#6b3e1b" />
            <rect x="1" y="13" width="2" height="2" fill={hiltColor} />
          </>
        );
      }

      case 'helmet_gold':
      case 'helmet_iron': {
        const main = icon === 'helmet_gold' ? '#f5b942' : '#aab6c8';
        const trim = icon === 'helmet_gold' ? '#fff1a8' : '#dde6f2';
        return (
          <>
            <rect x="4" y="2" width="8" height="2" fill={trim} />
            <rect x="3" y="4" width="10" height="8" fill={main} />
            <rect x="5" y="7" width="6" height="5" fill="#181a26" />
            <rect x="7" y="6" width="2" height="4" fill={trim} />
            <rect x="2" y="3" width="1" height="4" fill="#55ffff" />
            <rect x="13" y="3" width="1" height="4" fill="#55ffff" />
          </>
        );
      }

      case 'chest_plate': {
        return (
          <>
            <rect x="2" y="3" width="4" height="4" fill="#7c8aa6" />
            <rect x="10" y="3" width="4" height="4" fill="#7c8aa6" />
            <rect x="4" y="4" width="8" height="10" fill="#9eb0cf" />
            <rect x="6" y="5" width="4" height="4" fill="#d4a64a" />
            <rect x="7" y="6" width="2" height="2" fill="#55ffff" />
            <rect x="5" y="11" width="6" height="2" fill="#5b6882" />
          </>
        );
      }

      case 'leggings': {
        return (
          <>
            <rect x="4" y="2" width="8" height="3" fill="#d4a64a" />
            <rect x="4" y="5" width="3" height="9" fill="#8898b5" />
            <rect x="9" y="5" width="3" height="9" fill="#8898b5" />
            <rect x="4" y="11" width="3" height="2" fill="#c0cee6" />
            <rect x="9" y="11" width="3" height="2" fill="#c0cee6" />
          </>
        );
      }

      case 'boots': {
        return (
          <>
            <rect x="3" y="5" width="4" height="6" fill="#8898b5" />
            <rect x="9" y="5" width="4" height="6" fill="#8898b5" />
            <rect x="2" y="11" width="5" height="3" fill="#d4a64a" />
            <rect x="9" y="11" width="5" height="3" fill="#d4a64a" />
          </>
        );
      }

      case 'shield': {
        return (
          <>
            <rect x="3" y="2" width="10" height="9" fill="#d4a64a" />
            <rect x="5" y="11" width="6" height="2" fill="#d4a64a" />
            <rect x="7" y="13" width="2" height="2" fill="#d4a64a" />
            <rect x="4" y="3" width="8" height="7" fill="#2c4a7c" />
            <rect x="7" y="4" width="2" height="6" fill="#ffd369" />
            <rect x="5" y="6" width="6" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'necklace': {
        return (
          <>
            <rect x="4" y="2" width="8" height="2" fill="#d4a64a" />
            <rect x="3" y="4" width="2" height="5" fill="#d4a64a" />
            <rect x="11" y="4" width="2" height="5" fill="#d4a64a" />
            <rect x="5" y="9" width="6" height="2" fill="#d4a64a" />
            <rect x="6" y="10" width="4" height="4" fill="#55ffff" />
            <rect x="7" y="11" width="2" height="2" fill="#ffffff" />
          </>
        );
      }

      case 'ring_ruby':
      case 'ring_sapphire': {
        const gem = icon === 'ring_ruby' ? '#ff4466' : '#44ccff';
        return (
          <>
            <rect x="6" y="2" width="4" height="3" fill={gem} />
            <rect x="7" y="2" width="2" height="1" fill="#ffffff" />
            <rect x="4" y="5" width="8" height="8" fill="#f5b942" />
            <rect x="6" y="7" width="4" height="4" fill="#1e202d" />
          </>
        );
      }

      case 'talisman': {
        return (
          <>
            <rect x="4" y="2" width="8" height="12" fill="#7a2899" />
            <rect x="5" y="3" width="6" height="10" fill="#aa44dd" />
            <rect x="7" y="4" width="2" height="8" fill="#ffd369" />
            <rect x="6" y="6" width="4" height="2" fill="#55ffff" />
          </>
        );
      }

      case 'potion_hp':
      case 'potion_exp':
      case 'potion_mana': {
        const liquid =
          icon === 'potion_hp'
            ? '#ff4455'
            : icon === 'potion_exp'
            ? '#55ff66'
            : '#44aaff';
        return (
          <>
            <rect x="6" y="2" width="4" height="2" fill="#c28d53" />
            <rect x="5" y="4" width="6" height="2" fill="#a8c0d8" />
            <rect x="3" y="6" width="10" height="8" fill="#a8c0d8" />
            <rect x="4" y="7" width="8" height="6" fill={liquid} />
            <rect x="5" y="8" width="2" height="2" fill="#ffffff" />
          </>
        );
      }

      case 'gem_star':
      case 'ore_mythril': {
        const color = icon === 'gem_star' ? '#d066ff' : '#44ddff';
        return (
          <>
            <rect x="7" y="2" width="2" height="12" fill={color} />
            <rect x="2" y="7" width="12" height="2" fill={color} />
            <rect x="4" y="4" width="8" height="8" fill={color} />
            <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
          </>
        );
      }

      case 'scroll_quest':
      case 'book': {
        return (
          <>
            <rect x="3" y="2" width="10" height="12" fill="#e8d4a2" />
            <rect x="2" y="2" width="2" height="12" fill="#b87d3b" />
            <rect x="12" y="2" width="2" height="12" fill="#b87d3b" />
            <rect x="5" y="5" width="6" height="1" fill="#6e4e2e" />
            <rect x="5" y="7" width="6" height="1" fill="#6e4e2e" />
            <rect x="5" y="9" width="4" height="1" fill="#c83e3e" />
          </>
        );
      }

      case 'pet_dragon':
      case 'pet_fox':
      case 'pet_slime':
      case 'pet_owl': {
        const body =
          icon === 'pet_dragon'
            ? '#ff5555'
            : icon === 'pet_fox'
            ? '#ff9933'
            : icon === 'pet_owl'
            ? '#9988cc'
            : '#55ee88';
        return (
          <>
            {/* 耳角 */}
            <rect x="3" y="2" width="2" height="3" fill="#ffd369" />
            <rect x="11" y="2" width="2" height="3" fill="#ffd369" />
            {/* 头部身体 */}
            <rect x="3" y="5" width="10" height="8" fill={body} />
            {/* 眼睛 */}
            <rect x="5" y="7" width="2" height="2" fill="#11131c" />
            <rect x="9" y="7" width="2" height="2" fill="#11131c" />
            <rect x="5" y="7" width="1" height="1" fill="#ffffff" />
            <rect x="9" y="7" width="1" height="1" fill="#ffffff" />
            {/* 肚皮 */}
            <rect x="6" y="10" width="4" height="3" fill="#fff0c2" />
          </>
        );
      }

      case 'mount_griffin':
      case 'mount_wolf':
      case 'mount_steed': {
        const mane =
          icon === 'mount_griffin'
            ? '#ffd369'
            : icon === 'mount_wolf'
            ? '#66ccff'
            : '#e2e6f5';
        return (
          <>
            <rect x="9" y="2" width="4" height="6" fill={mane} />
            <rect x="11" y="4" width="3" height="2" fill="#ff9933" />
            <rect x="3" y="7" width="9" height="5" fill="#7c5836" />
            <rect x="5" y="6" width="4" height="3" fill="#d43f3f" />
            <rect x="3" y="12" width="2" height="3" fill="#e2e6f5" />
            <rect x="9" y="12" width="2" height="3" fill="#e2e6f5" />
          </>
        );
      }

      case 'pet_collar':
      case 'pet_claw':
      case 'pet_charm':
      case 'mount_saddle':
      case 'mount_barding':
      case 'mount_spurs': {
        const badgeColor = icon.startsWith('mount') ? '#55ffff' : '#ff77ff';
        return (
          <>
            <rect x="3" y="4" width="10" height="8" fill="#8b5a2b" />
            <rect x="5" y="6" width="6" height="4" fill={badgeColor} />
            <rect x="7" y="7" width="2" height="2" fill="#ffffff" />
            <rect x="6" y="2" width="4" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'lock': {
        return (
          <>
            <rect x="5" y="3" width="6" height="4" fill="#8b93af" />
            <rect x="6" y="4" width="4" height="3" fill="#191520" />
            <rect x="4" y="7" width="8" height="7" fill="#d45555" />
            <rect x="7" y="9" width="2" height="3" fill="#ffd369" />
          </>
        );
      }

      case 'unlock_plus': {
        return (
          <>
            <rect x="7" y="3" width="2" height="10" fill="#55ff55" />
            <rect x="3" y="7" width="10" height="2" fill="#55ff55" />
            <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
          </>
        );
      }

      case 'search': {
        return (
          <>
            <rect x="4" y="3" width="6" height="6" fill="#55ffff" />
            <rect x="5" y="4" width="4" height="4" fill="#1e202d" />
            <rect x="9" y="9" width="2" height="2" fill="#d4a64a" />
            <rect x="11" y="11" width="3" height="3" fill="#d4a64a" />
          </>
        );
      }

      case 'sort': {
        return (
          <>
            <rect x="3" y="3" width="10" height="2" fill="#d066ff" />
            <rect x="3" y="7" width="7" height="2" fill="#55ffff" />
            <rect x="3" y="11" width="4" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'arrow_left': {
        return (
          <>
            <rect x="8" y="3" width="2" height="10" fill="#ffd369" />
            <rect x="6" y="5" width="2" height="6" fill="#ffd369" />
            <rect x="4" y="7" width="2" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'arrow_right': {
        return (
          <>
            <rect x="6" y="3" width="2" height="10" fill="#ffd369" />
            <rect x="8" y="5" width="2" height="6" fill="#ffd369" />
            <rect x="10" y="7" width="2" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'mail_unread':
      case 'mail_read': {
        const envColor = icon === 'mail_unread' ? '#ffd369' : '#7b829e';
        return (
          <>
            <rect x="2" y="4" width="12" height="9" fill={envColor} />
            <rect x="3" y="5" width="10" height="2" fill="#ffffff" />
            {icon === 'mail_unread' && (
              <rect x="11" y="2" width="3" height="3" fill="#ff4444" />
            )}
          </>
        );
      }

      case 'coin_gold': {
        return (
          <>
            <rect x="4" y="2" width="8" height="12" fill="#ffaa00" />
            <rect x="2" y="4" width="12" height="8" fill="#ffaa00" />
            <rect x="5" y="4" width="6" height="8" fill="#ffd866" />
            <rect x="7" y="5" width="2" height="6" fill="#b87300" />
          </>
        );
      }

      case 'chest_guild':
      case 'warehouse': {
        return (
          <>
            <rect x="2" y="3" width="12" height="10" fill="#9c632d" />
            <rect x="2" y="7" width="12" height="2" fill="#231c16" />
            <rect x="7" y="6" width="2" height="4" fill="#ffd369" />
          </>
        );
      }

      case 'banner_guild': {
        return (
          <>
            <rect x="3" y="2" width="10" height="2" fill="#d4a64a" />
            <rect x="4" y="4" width="8" height="9" fill="#b8324f" />
            <rect x="7" y="5" width="2" height="5" fill="#ffd369" />
            <rect x="6" y="7" width="4" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'check_green': {
        return (
          <>
            <rect x="3" y="8" width="2" height="3" fill="#55ff55" />
            <rect x="5" y="10" width="3" height="3" fill="#55ff55" />
            <rect x="8" y="6" width="3" height="4" fill="#55ff55" />
            <rect x="11" y="3" width="2" height="4" fill="#55ff55" />
          </>
        );
      }

      case 'cross_red': {
        return (
          <>
            <rect x="3" y="3" width="3" height="3" fill="#ff5555" />
            <rect x="10" y="3" width="3" height="3" fill="#ff5555" />
            <rect x="6" y="6" width="4" height="4" fill="#ff5555" />
            <rect x="3" y="10" width="3" height="3" fill="#ff5555" />
            <rect x="10" y="10" width="3" height="3" fill="#ff5555" />
          </>
        );
      }

      case 'chest_shop':
      case 'chest_gold': {
        return (
          <>
            <rect x="2" y="3" width="12" height="10" fill="#a46628" />
            <rect x="3" y="2" width="10" height="2" fill="#ffd369" />
            <rect x="2" y="6" width="12" height="1" fill="#4a2e13" />
            <rect x="7" y="5" width="2" height="3" fill="#ffffff" />
            <rect x="7" y="6" width="2" height="2" fill="#d4a64a" />
            <rect x="3" y="12" width="10" height="1" fill="#4a2e13" />
            <rect x="4" y="8" width="2" height="2" fill="#ffd369" />
            <rect x="10" y="8" width="2" height="2" fill="#ffd369" />
          </>
        );
      }

      case 'emerald': {
        return (
          <>
            <rect x="6" y="1" width="4" height="2" fill="#55ff55" />
            <rect x="4" y="3" width="8" height="2" fill="#22dd44" />
            <rect x="3" y="5" width="10" height="6" fill="#17b037" />
            <rect x="5" y="4" width="3" height="3" fill="#aaffaa" />
            <rect x="5" y="7" width="6" height="3" fill="#0d8525" />
            <rect x="4" y="11" width="8" height="2" fill="#17b037" />
            <rect x="6" y="13" width="4" height="2" fill="#0b5e1b" />
          </>
        );
      }

      case 'cart_buy': {
        return (
          <>
            <rect x="2" y="3" width="3" height="2" fill="#55ffff" />
            <rect x="4" y="5" width="9" height="5" fill="#2d7fc7" />
            <rect x="5" y="6" width="7" height="3" fill="#ffd369" />
            <rect x="4" y="10" width="8" height="2" fill="#184a75" />
            <rect x="5" y="12" width="2" height="2" fill="#ffffff" />
            <rect x="10" y="12" width="2" height="2" fill="#ffffff" />
          </>
        );
      }

      case 'empty_slot':
      case 'barrier': {
        return (
          <>
            <rect x="3" y="3" width="10" height="1" fill="#ff5555" />
            <rect x="3" y="12" width="10" height="1" fill="#ff5555" />
            <rect x="3" y="3" width="1" height="10" fill="#ff5555" />
            <rect x="12" y="3" width="1" height="10" fill="#ff5555" />
            <rect x="5" y="5" width="6" height="6" fill="#aa0000" opacity={0.4} />
            <rect x="7" y="5" width="2" height="6" fill="#ffffff" />
            <rect x="5" y="7" width="6" height="2" fill="#ffffff" />
          </>
        );
      }

      case 'plus_qty': {
        return (
          <>
            <rect x="3" y="3" width="10" height="10" fill="#1a3d24" />
            <rect x="7" y="4" width="2" height="8" fill="#55ff55" />
            <rect x="4" y="7" width="8" height="2" fill="#55ff55" />
          </>
        );
      }

      case 'minus_qty': {
        return (
          <>
            <rect x="3" y="3" width="10" height="10" fill="#3d1a1a" />
            <rect x="4" y="7" width="8" height="2" fill="#ff5555" />
          </>
        );
      }

      case 'price_tag': {
        return (
          <>
            <rect x="4" y="3" width="8" height="9" fill="#e6b422" />
            <rect x="5" y="4" width="6" height="7" fill="#ffd369" />
            <rect x="7" y="5" width="2" height="2" fill="#181a26" />
            <rect x="6" y="8" width="4" height="2" fill="#884400" />
            <rect x="3" y="2" width="3" height="2" fill="#ff5555" />
          </>
        );
      }

      default: {
        // 默认奇幻符文石色块 + 稀有度边框
        return (
          <>
            <rect x="2" y="2" width="12" height="12" fill="#2c314a" />
            <rect x="3" y="3" width="10" height="10" fill={accent} opacity={0.85} />
            <rect x="6" y="6" width="4" height="4" fill="#ffffff" />
          </>
        );
      }
    }
  };

  return (
    <div className="mc-item-icon-wrapper pixelated">
      <svg
        viewBox="0 0 16 16"
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        style={{ display: 'block' }}
      >
        {renderPixelArt()}
      </svg>
    </div>
  );
};
