# Cabbit Character Assets - Character Mapping

## 📁 Overview

This directory contains a comprehensive collection of character assets from the Cabbit 0.5 asset pack, including:

- **180 unique characters** with sprites and facesets
- **148 people sprites** (various NPCs, civilians, etc.)
- **32 named character sprites** (heroes, specific characters)
- **152 people facesets**
- **203 character facesets** (including emotion variants)

## 📄 character-mapping.json

The `character-mapping.json` file provides a complete mapping between character sprites and their corresponding facesets.

### File Structure

```json
{
  "metadata": {
    "generated": "timestamp",
    "basePath": "/assets/cabbit-0.5",
    "totalPeopleSprites": 148,
    "totalCharacterSprites": 32,
    "totalPeopleFaces": 152,
    "totalCharacterFaces": 203
  },
  "people": {
    "character-id": {
      "sprite": "path/to/sprite.png",
      "facesets": ["path/to/faceset1.png", "path/to/faceset2.png"],
      "category": "people"
    }
  },
  "characters": {
    "character-id": {
      "sprite": "path/to/sprite.png",
      "facesets": ["path/to/faceset-neutral.png", "path/to/faceset-happy.png", ...],
      "category": "character"
    }
  },
  "index": {
    "allCharacterIds": ["id1", "id2", ...],
    "byGender": {
      "female": [...],
      "male": [...],
      "unknown": [...]
    },
    "byType": {
      "fighter": [...],
      "mage": [...],
      "cleric": [...]
    }
  }
}
```

## 🎭 Character Categories

### By Type (11 types)

| Type | Count | Description |
|------|-------|-------------|
| **aristocrate** | 14 | Noble characters |
| **bard** | 2 | Musicians and entertainers |
| **cleric** | 10 | Healers and priests |
| **clown** | 2 | Jesters and entertainers |
| **cultist** | 3 | Mysterious cult members |
| **dancer** | 2 | Performers |
| **fighter** | 16 | Warriors and soldiers |
| **mage** | 10 | Magic users |
| **ranger** | 9 | Archers and scouts |
| **soldier** | 4 | Military characters |
| **witch** | 1 | Dark magic user |

### By Gender

- **Female characters**: 73
- **Male characters**: 74
- **Unknown/Neutral**: 33

## 🎨 Named Characters (with Emotion Variants)

The following characters have multiple emotional expressions:

### Female Characters
- **Amanda** (3 skin tones)
- **Angela** (mage, 8 emotions)
- **Claris** (healer, 8 emotions)
- **Helena** (fighter, 8 emotions)
- **Linda** (witch, 8 emotions)
- **Lyuba** (multiple classes: base, cleric, fighter, mage, ranger - 8 emotions each)
- **Molly** (soldier, 2 variants, 8 emotions each)
- **Ruby** (ranger, 8 emotions)

### Male Characters
- **Evan** (healer, 8 emotions)
- **Nathan** (mage, 8 emotions)
- **Roland** (soldier, 2 variants, 8 emotions each)
- **Vasily** (fighter, 8 emotions)
- **Yan** (multiple classes: cleric, fighter, mage, ranger - 8 emotions each)

## 😊 Emotion Variants

Characters with faceset emotions include:
- angry
- blush
- dislike
- happy
- like
- neutral
- smirk
- surprised

## 🔍 Usage Examples

### Example 1: Get a random female fighter

```javascript
import characterMapping from './character-mapping.json';

// Get all female fighters
const femaleFighters = characterMapping.index.byType.fighter.filter(id =>
  characterMapping.index.byGender.female.includes(id)
);

// Pick a random one
const randomId = femaleFighters[Math.floor(Math.random() * femaleFighters.length)];

// Get character data
const character = characterMapping.people[randomId] || characterMapping.characters[randomId];

console.log(`Sprite: ${character.sprite}`);
console.log(`Facesets: ${character.facesets.join(', ')}`);
```

### Example 2: Get a character with emotions

```javascript
// Get Angela (mage) with all emotions
const angela = characterMapping.characters['Angela-mage-001'];

console.log('Angela sprite:', angela.sprite);
console.log('Available emotions:');
angela.facesets.forEach(faceset => {
  const emotion = faceset.match(/-(\w+)\.png$/)?.[1] || 'neutral';
  console.log(`  - ${emotion}: ${faceset}`);
});
```

### Example 3: Filter by type and gender

```javascript
// Get all male mages
const maleMages = characterMapping.index.byType.mage.filter(id =>
  characterMapping.index.byGender.male.includes(id)
);

maleMages.forEach(id => {
  const char = characterMapping.people[id] || characterMapping.characters[id];
  console.log(`${id}: ${char.sprite}`);
});
```

## 📂 Directory Structure

```
cabbit-0.5/
├── character-mapping.json          # This mapping file
├── README.md                        # This file
├── sprite/
│   ├── people/PNG/48x64_scale2x/   # 148 people sprites
│   └── character/PNG/48x64_scale2x/ # 32 named character sprites
└── faceset/
    ├── people/PNG/original/         # 152 people facesets
    └── character/PNG/original/      # 203 character facesets (with emotions)
```

## 🎮 Integration with AI Town

To integrate these characters into your AI Town application:

1. **Load the mapping file** in your application
2. **Select characters** based on your needs (type, gender, etc.)
3. **Convert sprites** from 48x64 to 32x32 if needed (current game uses 32x32)
4. **Create spritesheet data** following the format in `data/spritesheets/*.ts`
5. **Add character definitions** to `data/characters.ts`

## 🔄 Regenerating the Mapping

To regenerate the `character-mapping.json` file:

```bash
node /Users/kang/GitHub/ai-twon-exp-3/generate_character_mapping.mjs
```

This will scan all sprite and faceset directories and create an updated mapping.

## 📝 Notes

- All paths in the mapping are relative to `/assets/cabbit-0.5/`
- Sprites are in 48x64 pixel format (2x scale)
- Facesets are in original resolution
- Some sprites may not have matching facesets (empty `facesets` array)
- Named characters (in `characters` category) typically have emotion variants
- People characters (in `people` category) typically have only one faceset

## 🎨 Asset Credits

These assets are from the Cabbit 0.5 asset pack. Please ensure you have proper licensing for their use in your project.

---

Generated: 2025-11-01
Total Characters: 180
