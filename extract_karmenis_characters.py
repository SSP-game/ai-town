#!/usr/bin/env python3

from PIL import Image
import os

source_dir = "/Users/kang/github/ai-twon-exp-3/public/assets/karmenis's 48x48/6 persons"
output_dir = "/Users/kang/GitHub/ai-twon-exp-3/public/assets/karmenis-characters"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Karmenis sprite layout for "6 persons" files:
# - 9 columns x 8 rows total (432px x 384px)
# - Each character: 3 columns x 4 rows (144px x 192px at 48x48 per frame)
# - Characters positions: columns 0-2, rows 0-1 (6 characters total)

character_positions = [
    {'col': 0, 'row': 0, 'name': 'char1'},  # Top-left
    {'col': 1, 'row': 0, 'name': 'char2'},  # Top-middle
    {'col': 2, 'row': 0, 'name': 'char3'},  # Top-right
    {'col': 0, 'row': 1, 'name': 'char4'},  # Bottom-left
    {'col': 1, 'row': 1, 'name': 'char5'},  # Bottom-middle
    {'col': 2, 'row': 1, 'name': 'char6'},  # Bottom-right
]

def extract_and_scale_character(source_image, char_pos, output_path):
    FRAME_SIZE = 48  # Source frame size
    CHAR_COLS = 3    # Frames per character (horizontal)
    CHAR_ROWS = 4    # Frames per character (vertical)
    TARGET_SIZE = 32 # Target frame size

    # Calculate source position
    src_x = char_pos['col'] * CHAR_COLS * FRAME_SIZE
    src_y = char_pos['row'] * CHAR_ROWS * FRAME_SIZE
    src_width = CHAR_COLS * FRAME_SIZE   # 144px
    src_height = CHAR_ROWS * FRAME_SIZE  # 192px

    # Extract the character region
    char_image = source_image.crop((
        src_x, src_y,
        src_x + src_width,
        src_y + src_height
    ))

    # Scale to 32x32 frames (96px x 128px total)
    target_width = CHAR_COLS * TARGET_SIZE   # 96px
    target_height = CHAR_ROWS * TARGET_SIZE  # 128px

    # Use NEAREST for pixel-perfect scaling
    scaled_image = char_image.resize(
        (target_width, target_height),
        Image.Resampling.NEAREST
    )

    # Save
    scaled_image.save(output_path, 'PNG')
    print(f"✅ Extracted: {os.path.basename(output_path)}")

def process_file(filename):
    source_path = os.path.join(source_dir, filename)

    # Extract base name (remove "___sprite_mv_by_karmenis_XXX.png")
    base_name = filename.split('___sprite')[0]

    print(f"\n📄 Processing: {filename}")
    print(f"   Base name: {base_name}")

    source_image = Image.open(source_path)

    for char_pos in character_positions:
        output_filename = f"{base_name}_{char_pos['name']}.png"
        output_path = os.path.join(output_dir, output_filename)
        extract_and_scale_character(source_image, char_pos, output_path)

def main():
    print('🎨 Karmenis Character Extractor\n')
    print(f'Source: {source_dir}')
    print(f'Output: {output_dir}\n')

    files = [f for f in os.listdir(source_dir) if f.endswith('.png')]
    print(f'Found {len(files)} PNG files\n')

    for file in files:
        process_file(file)

    print(f'\n✨ All characters extracted and scaled to 32x32!')
    print(f'Total characters: {len(files) * 6}')

if __name__ == '__main__':
    main()
