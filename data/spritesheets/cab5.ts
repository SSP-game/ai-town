import { SpritesheetData } from './types';

// Cabbit character: fighter-f-001-light (Female Fighter, Light skin)
// 24x32 sprite format - 4 rows x 3 columns

export const data: SpritesheetData = {
  frames: {
    down: {
      frame: { x: 0, y: 64, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    down2: {
      frame: { x: 24, y: 64, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    down3: {
      frame: { x: 48, y: 64, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left: {
      frame: { x: 0, y: 96, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left2: {
      frame: { x: 24, y: 96, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left3: {
      frame: { x: 48, y: 96, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right: {
      frame: { x: 0, y: 32, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right2: {
      frame: { x: 24, y: 32, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right3: {
      frame: { x: 48, y: 32, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up: {
      frame: { x: 0, y: 0, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up2: {
      frame: { x: 24, y: 0, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up3: {
      frame: { x: 48, y: 0, w: 24, h: 32 },
      sourceSize: { w: 24, h: 32 },
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
