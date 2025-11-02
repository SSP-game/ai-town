#!/bin/bash
# Generate spritesheet configuration files for all Karmenis characters

SPRITE_DIR="/Users/kang/GitHub/ai-twon-exp-3/data/spritesheets"
CHARS_DIR="/Users/kang/github/ai-twon-exp-3/public/assets/karmenis-characters"

# Get all character names (without .png extension)
cd "$CHARS_DIR"
for png_file in *.png; do
  char_name="${png_file%.png}"

  # Create spritesheet config file with safe filename (replace special chars)
  safe_name=$(echo "$char_name" | tr ' ' '_')

  cat > "${SPRITE_DIR}/${safe_name}.ts" << 'EOF'
import { SpritesheetData } from './types';

export const data: SpritesheetData = {
  frames: {
    // Row 1: Down/Front (y=0) - Karmenis format
    down: {
      frame: { x: 0, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    down2: {
      frame: { x: 32, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    down3: {
      frame: { x: 64, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },

    // Row 2: Left (y=32)
    left: {
      frame: { x: 0, y: 32, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left2: {
      frame: { x: 32, y: 32, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left3: {
      frame: { x: 64, y: 32, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },

    // Row 3: Right (y=64)
    right: {
      frame: { x: 0, y: 64, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right2: {
      frame: { x: 32, y: 64, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    right3: {
      frame: { x: 64, y: 64, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },

    // Row 4: Up/Back (y=96)
    up: {
      frame: { x: 0, y: 96, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up2: {
      frame: { x: 32, y: 96, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    up3: {
      frame: { x: 64, y: 96, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
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
EOF

  echo "Created ${safe_name}.ts"
done

echo "✅ Created spritesheet files for all Karmenis characters"
