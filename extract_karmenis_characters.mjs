#!/usr/bin/env node

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

const sourceDir = "/Users/kang/github/ai-twon-exp-3/public/assets/karmenis's 48x48/6 persons";
const outputDir = "/Users/kang/GitHub/ai-twon-exp-3/public/assets/karmenis-characters";

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Karmenis sprite layout for "6 persons" files:
// - 9 columns x 8 rows total (432px x 384px)
// - Each character: 3 columns x 4 rows (144px x 192px at 48x48 per frame)
// - Characters positions: [0,0], [1,0], [2,0], [0,1], [1,1], [2,1]
//   (columns 0-2, rows 0-1, skipping logo areas)
// - Logo at: column 3 (right-top and right-bottom)

const characterPositions = [
  { col: 0, row: 0, name: 'char1' }, // Top-left
  { col: 1, row: 0, name: 'char2' }, // Top-middle
  { col: 2, row: 0, name: 'char3' }, // Top-right (before logo)
  { col: 0, row: 1, name: 'char4' }, // Bottom-left
  { col: 1, row: 1, name: 'char5' }, // Bottom-middle
  { col: 2, row: 1, name: 'char6' }, // Bottom-right (before logo)
];

async function extractAndScaleCharacter(sourceImage, charPos, outputPath) {
  const FRAME_SIZE = 48; // Source frame size
  const CHAR_COLS = 3;   // Frames per character (horizontal)
  const CHAR_ROWS = 4;   // Frames per character (vertical)
  const TARGET_SIZE = 32; // Target frame size

  // Calculate source position
  const srcX = charPos.col * CHAR_COLS * FRAME_SIZE;
  const srcY = charPos.row * CHAR_ROWS * FRAME_SIZE;
  const srcWidth = CHAR_COLS * FRAME_SIZE;  // 144px
  const srcHeight = CHAR_ROWS * FRAME_SIZE; // 192px

  // Create target canvas (32x32 frames)
  const targetWidth = CHAR_COLS * TARGET_SIZE;  // 96px
  const targetHeight = CHAR_ROWS * TARGET_SIZE; // 128px
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Extract and scale the character
  ctx.imageSmoothingEnabled = false; // Pixel-perfect scaling
  ctx.drawImage(
    sourceImage,
    srcX, srcY, srcWidth, srcHeight,  // Source
    0, 0, targetWidth, targetHeight    // Destination
  );

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Extracted: ${path.basename(outputPath)}`);
}

async function processFile(filename) {
  const sourcePath = path.join(sourceDir, filename);
  const baseNameMatch = filename.match(/^(.+)___sprite/);
  const baseName = baseNameMatch ? baseNameMatch[1] : filename.replace('.png', '');

  console.log(`\n📄 Processing: ${filename}`);
  console.log(`   Base name: ${baseName}`);

  const image = await loadImage(sourcePath);

  for (const charPos of characterPositions) {
    const outputFilename = `${baseName}_${charPos.name}.png`;
    const outputPath = path.join(outputDir, outputFilename);
    await extractAndScaleCharacter(image, charPos, outputPath);
  }
}

async function main() {
  console.log('🎨 Karmenis Character Extractor\n');
  console.log(`Source: ${sourceDir}`);
  console.log(`Output: ${outputDir}\n`);

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png'));

  console.log(`Found ${files.length} PNG files\n`);

  for (const file of files) {
    await processFile(file);
  }

  console.log('\n✨ All characters extracted and scaled to 32x32!');
  console.log(`Total characters: ${files.length * 6}`);
}

main().catch(console.error);
