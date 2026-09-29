import { ScreenId } from '../types';

export type AssetCategory =
  | 'background'
  | 'slot'
  | 'button'
  | 'icon'
  | 'bar'
  | 'dialog'
  | 'atlas';

export type EnginePreset = 'minecraft' | 'unity' | 'godot' | 'generic';

export interface NineSliceBorder {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface GuiAsset {
  id: string;
  name: string;
  category: AssetCategory;
  screenId?: ScreenId | 'global';
  width: number;
  height: number;
  description: string;
  nineSlice?: NineSliceBorder;
  tags: string[];
  render: (scale: number, transparent: boolean) => HTMLCanvasElement;
}

export interface AtlasFrame {
  name: string;
  category: AssetCategory;
  x: number;
  y: number;
  w: number;
  h: number;
  nineSlice?: NineSliceBorder;
}

export interface AtlasData {
  canvas: HTMLCanvasElement;
  json: {
    meta: {
      app: string;
      version: string;
      scale: number;
      size: { w: number; h: number };
      format: string;
    };
    frames: Record<string, {
      frame: { x: number; y: number; w: number; h: number };
      sourceSize: { w: number; h: number };
      nineSlice?: NineSliceBorder;
    }>;
  };
}

export interface ExportOptions {
  scale: 1 | 2 | 3 | 4 | 8;
  transparent: boolean;
  enginePreset: EnginePreset;
  includeAtlas: boolean;
  includeLayoutJson: boolean;
  includeEngineTemplates: boolean;
}
