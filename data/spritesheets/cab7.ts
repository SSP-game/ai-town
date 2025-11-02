import { SpritesheetData } from './types';

// Cabbit character: fighter-f-001-light (Female Fighter, Light skin)
// 48x64 sprite format - 4 rows x 3 columns

export const data: SpritesheetData = {
  frames: {
    down: {
      frame: { x: 0, y: 128, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    down2: {
      frame: { x: 48, y: 128, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    down3: {
      frame: { x: 96, y: 128, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left: {
      frame: { x: 0, y: 192, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left2: {
      frame: { x: 48, y: 192, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left3: {
      frame: { x: 96, y: 192, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right: {
      frame: { x: 0, y: 64, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right2: {
      frame: { x: 48, y: 64, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right3: {
      frame: { x: 96, y: 64, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up: {
      frame: { x: 0, y: 0, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up2: {
      frame: { x: 48, y: 0, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up3: {
      frame: { x: 96, y: 0, w: 48, h: 64 },
      sourceSize: { w: 48, h: 64 },
      spriteSourceSize: { x: 0, y: 0 },
    },
  },
  meta: {
    scale: '1',
  },
  animations: {
    left: ['left', 'left2', 'left3'],
    right: ['right', 'right2', 'right3'],
    up: ['up', 'up2', 'up3'],
    down: ['down', 'down2', 'down3'],
  },
};
