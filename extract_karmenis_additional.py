#!/usr/bin/env python3
"""
Extract and convert additional Karmenis 48x48 characters to 32x32 format.
Handles right-bottom and right-top folders where author logos occupy some character positions.
"""

from PIL import Image
import os

def extract_characters_from_sheet(input_path, output_dir, skip_positions=None):
    """
    Extract individual 48x48 characters from a spritesheet and resize to 32x32.

    Args:
        input_path: Path to input PNG file
        output_dir: Directory to save extracted characters
        skip_positions: List of (col, row) tuples to skip (0-indexed)
    """
    if skip_positions is None:
        skip_positions = []

    img = Image.open(input_path)
    width, height = img.size

    # Each character is 48x48, arranged in rows of 3 frames × 4 directions
    char_width = 48 * 3  # 144 pixels per character (3 animation frames)
    char_height = 48 * 4  # 192 pixels per character (4 directions)

    cols = width // char_width
    rows = height // char_height

    print(f"Processing {input_path}")
    print(f"Image size: {width}x{height}")
    print(f"Characters grid: {cols} columns × {rows} rows")

    characters = []
    for row in range(rows):
        for col in range(cols):
            # Skip if this position contains author logo or should be skipped
            if (col, row) in skip_positions:
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

            characters.append(char_img_resized)
            print(f"  Extracted character at position ({col}, {row})")

    return characters

def main():
    base_dir = "/Users/kang/github/ai-twon-exp-3/public/assets/karmenis's 48x48"
    output_base_dir = "/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-characters"

    # Ensure output directory exists
    os.makedirs(output_base_dir, exist_ok=True)

    # Process right-bottom folder
    # According to user: right-bottom has logos occupying both right-top AND right-bottom positions
    # This means logos are at positions (1,0) and (1,1) for a 2×2 grid
    right_bottom_dir = os.path.join(base_dir, "right-bottom")
    right_bottom_files = sorted([f for f in os.listdir(right_bottom_dir) if f.endswith('.png')])

    print(f"\n=== Processing right-bottom folder ===")
    print(f"Found {len(right_bottom_files)} files")

    all_characters = []
    for filename in right_bottom_files:
        input_path = os.path.join(right_bottom_dir, filename)
        # Skip positions where author logos are (right-top and right-bottom)
        # Assuming 2×2 grid: skip (1,0) and (1,1)
        characters = extract_characters_from_sheet(input_path, output_base_dir, skip_positions=[(1, 0), (1, 1)])
        all_characters.extend(characters)

    # Process right-top folder
    # According to user: right-top has logo occupying right-top position
    # This means logo is at position (1,0) for a 2×2 grid
    right_top_dir = os.path.join(base_dir, "right-top")
    right_top_files = sorted([f for f in os.listdir(right_top_dir) if f.endswith('.png')])

    print(f"\n=== Processing right-top folder ===")
    print(f"Found {len(right_top_files)} files")

    for filename in right_top_files:
        input_path = os.path.join(right_top_dir, filename)
        # Skip position where author logo is (right-top)
        # Assuming 2×2 grid: skip (1,0)
        characters = extract_characters_from_sheet(input_path, output_base_dir, skip_positions=[(1, 0)])
        all_characters.extend(characters)

    # Save extracted characters as kar9, kar10, kar11, etc.
    print(f"\n=== Saving {len(all_characters)} extracted characters ===")
    for i, char_img in enumerate(all_characters, start=9):  # Start from kar9
        output_filename = f"kar{i}.png"
        output_path = os.path.join(output_base_dir, output_filename)
        char_img.save(output_path)
        print(f"Saved {output_filename}")

    print(f"\n✅ Successfully extracted and converted {len(all_characters)} characters!")
    print(f"Characters saved as kar9 through kar{8 + len(all_characters)}")

if __name__ == "__main__":
    main()
