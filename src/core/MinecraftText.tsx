import React from 'react';

const MC_COLOR_MAP: Record<string, string> = {
  '0': '#000000', // Black
  '1': '#0000AA', // Dark Blue
  '2': '#00AA00', // Dark Green
  '3': '#00AAAA', // Dark Aqua
  '4': '#AA0000', // Dark Red
  '5': '#AA00AA', // Dark Purple
  '6': '#FFAA00', // Gold
  '7': '#AAAAAA', // Gray
  '8': '#555555', // Dark Gray
  '9': '#5555FF', // Blue
  a: '#55FF55',   // Green
  b: '#55FFFF',   // Aqua
  c: '#FF5555',   // Red
  d: '#FF55FF',   // Light Purple
  e: '#FFFF55',   // Yellow
  f: '#FFFFFF',   // White
};

export interface TextSegment {
  text: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export function parseMinecraftText(input: string, defaultColor = '#FFFFFF'): TextSegment[] {
  if (!input) return [];
  const segments: TextSegment[] = [];
  let currentColor = defaultColor;
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;
  let buffer = '';

  const flush = () => {
    if (buffer.length > 0) {
      segments.push({
        text: buffer,
        color: currentColor,
        bold,
        italic,
        underline,
        strikethrough,
      });
      buffer = '';
    }
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if ((ch === '§' || ch === '&') && i + 1 < input.length) {
      const code = input[i + 1].toLowerCase();
      if (MC_COLOR_MAP[code]) {
        flush();
        currentColor = MC_COLOR_MAP[code];
        bold = false;
        italic = false;
        underline = false;
        strikethrough = false;
        i++;
        continue;
      } else if (code === 'l') {
        flush();
        bold = true;
        i++;
        continue;
      } else if (code === 'o') {
        flush();
        italic = true;
        i++;
        continue;
      } else if (code === 'n') {
        flush();
        underline = true;
        i++;
        continue;
      } else if (code === 'm') {
        flush();
        strikethrough = true;
        i++;
        continue;
      } else if (code === 'r') {
        flush();
        currentColor = defaultColor;
        bold = false;
        italic = false;
        underline = false;
        strikethrough = false;
        i++;
        continue;
      }
    }
    buffer += ch;
  }
  flush();
  return segments;
}

export function stripMinecraftCodes(input: string): string {
  return input.replace(/[§&][0-9a-fk-or]/gi, '');
}

/**
 * 计算 MC 像素宽度估算值（中文字符算 2 单位，英文字符算 1 单位）
 * 超过 44 单位在标准 MC 容器 Tooltip 中容易换行或溢出屏幕
 */
export function getMcVisualLength(input: string): number {
  const clean = stripMinecraftCodes(input);
  let len = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    len += code > 255 ? 2 : 1;
  }
  return len;
}

export const MC_SAFE_LINE_UNITS = 44;

interface MinecraftTextProps {
  text: string;
  defaultColor?: string;
  className?: string;
}

export const MinecraftText: React.FC<MinecraftTextProps> = ({
  text,
  defaultColor = '#FFFFFF',
  className,
}) => {
  const segments = parseMinecraftText(text, defaultColor);
  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        const decorations: string[] = [];
        if (seg.underline) decorations.push('underline');
        if (seg.strikethrough) decorations.push('line-through');
        return (
          <span
            key={idx}
            style={{
              color: seg.color,
              fontWeight: seg.bold ? 700 : 400,
              fontStyle: seg.italic ? 'italic' : 'normal',
              textDecoration: decorations.length > 0 ? decorations.join(' ') : undefined,
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </span>
  );
};
