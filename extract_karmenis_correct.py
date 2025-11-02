#!/usr/bin/env python3
"""
Extract and convert Karmenis 48x48 characters to 32x32 format.
Handles different logo positions for different folders.
"""

from PIL import Image
import os
import re

def extract_characters_from_sheet(input_path, filename, output_dir, logo_position):
    """
    Extract individual 48x48 characters from a spritesheet and resize to 32x32.

    Args:
        input_path: Path to input PNG file
        filename: Original filename for naming output files
        output_dir: Directory to save extracted characters
        logo_position: Tuple (col, row) where logo is located (0-indexed)
    """
    img = Image.open(input_path)
    width, height = img.size

    # Each character is 48x48, arranged in rows of 3 frames × 4 directions
    char_width = 48 * 3  # 144 pixels per character (3 animation frames)
    char_height = 48 * 4  # 192 pixels per character (4 directions)

    cols = width // char_width
    rows = height // char_height

    # Extract base name from filename (remove extension and _by_karmenis_xxx part)
    base_name = filename.replace('.png', '')
    base_name = re.sub(r'___sprite_mv_by_karmenis_\w+$', '', base_name)

    print(f"Processing {filename}")
    print(f"  Base name: {base_name}")
    print(f"  Image size: {width}x{height}")
    print(f"  Grid: {cols} columns × {rows} rows")
    print(f"  Logo position: {logo_position}")

    char_num = 1
    for row in range(rows):
        for col in range(cols):
            # Skip if this position contains author logo
            if (col, row) == logo_position:
                print(f"  Skipping position ({col}, {row}) - author logo")
                continue

            # Extract the character (3x4 grid of 48x48 frames)
            left = col * char_width
            top = row * char_height
            right = left + char_width
            bottom = top + char_height

            char_img = img.crop((left, top, right, bottom))

            # Resize from 144x192 to 96x128 (each frame from 48x48 to 32x32)
            char_img_resized = char_img.resize((96, 128), Image.Resampling.LANCZOS)

            # Save with naming pattern: basename_char{num}.png
            output_filename = f"{base_name}_char{char_num}.png"
            output_path = os.path.join(output_dir, output_filename)
            char_img_resized.save(output_path)
            print(f"  Saved {output_filename}")

            char_num += 1

def main():
    base_dir = "/Users/kang/github/ai-twon-exp-3/public/assets/karmenis's 48x48"
    output_dir = "/Users/kang/github/ai-twon-exp-3/public/assets/karmenis-characters"

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Process right-bottom folder (logo at position (3, 1) - right-bottom corner)
    print("\n" + "="*60)
    print("Processing right-bottom folder")
    print("="*60)
    right_bottom_dir = os.path.join(base_dir, "right-bottom")
    right_bottom_files = sorted([f for f in os.listdir(right_bottom_dir) if f.endswith('.png')])

    for filename in right_bottom_files:
        input_path = os.path.join(right_bottom_dir, filename)
        extract_characters_from_sheet(input_path, filename, output_dir, logo_position=(3, 1))

    # Process right-top folder (logo at position (3, 0) - right-top corner)
    print("\n" + "="*60)
    print("Processing right-top folder")
    print("="*60)
    right_top_dir = os.path.join(base_dir, "right-top")
    right_top_files = sorted([f for f in os.listdir(right_top_dir) if f.endswith('.png')])

    for filename in right_top_files:
        input_path = os.path.join(right_top_dir, filename)
        extract_characters_from_sheet(input_path, filename, output_dir, logo_position=(3, 0))

    print("\n" + "="*60)
    print("✅ Extraction complete!")
    print("="*60)
    print(f"Characters saved to: {output_dir}")

if __name__ == "__main__":
    main()
