#!/usr/bin/env python3
"""Generate import statements and character definitions for characters.ts"""

# Generate imports
print("// Karmenis character spritesheets")
for i in range(1, 70):
    print(f"import {{ data as kar{i}SpritesheetData }} from './spritesheets/kar{i}';")

print("\n// Character definitions")
for i in range(1, 70):
    print(f"  {{")
    print(f"    name: 'kar{i}',")
    print(f"    textureUrl: './assets/cabbit-characters/kar{i}.png',")
    print(f"    spritesheetData: kar{i}SpritesheetData,")
    print(f"    speed: 0.2,")
    print(f"  }},")
