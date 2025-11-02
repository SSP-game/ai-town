import { SpritesheetData } from './types';

// Cabbit 48x64 sprite format
// Layout: 4 rows x 3 columns (144px x 256px total)
// Row 1 (y=0):   up/back   - 3 animation frames
// Row 2 (y=64):  right     - 3 animation frames
// Row 3 (y=128): down/front- 3 animation frames
// Row 4 (y=192): left      - 3 animation frames

export const data: SpritesheetData = {
  frames: {
    // Row 3: Down/Front (y=128)
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

    // Row 4: Left (y=192)
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

    // Row 2: Right (y=64)
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

    // Row 1: Up/Back (y=0)
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
