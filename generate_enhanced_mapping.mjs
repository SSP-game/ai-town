import fs from 'fs';
import path from 'path';

const basePath = '/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5';

console.log('🔍 Generating enhanced character mapping...\n');

// Helper function to parse character filename
function parseCharacterName(filename) {
  // Remove .png extension
  const name = filename.replace('.png', '');
  const parts = name.split('-');

  const parsed = {
    fullName: name,
    type: null,          // aristocrate, fighter, mage, etc.
    ageGroup: null,      // adult, child, young, old
    gender: null,        // m, f
    variant: null,       // 001, 002, etc.
    skinTone: null,      // black, brown, light
    hairColor: null,     // blonde, brunette, etc.
    style: null,         // alt (alternative style)
    color: null,         // blue, red (for robes, etc.)
    extra: []            // any other attributes
  };

  // Pattern matching
  let i = 0;

  // Check for townfolk pattern: townfolk-adult/child-...
  if (parts[0] === 'townfolk') {
    parsed.type = 'townfolk';
    i = 1;

    if (parts[i] && ['adult', 'child', 'young'].includes(parts[i])) {
      parsed.ageGroup = parts[i];
      i++;
    }
  } else {
    // Regular pattern: type-gender-variant-...
    parsed.type = parts[0];
    i = 1;
  }

  // Parse gender
  if (parts[i] === 'f' || parts[i] === 'm') {
    parsed.gender = parts[i] === 'f' ? 'female' : 'male';
    i++;
  }

  // Parse variant number (001, 002, etc.)
  if (parts[i] && /^\d{3}$/.test(parts[i])) {
    parsed.variant = parts[i];
    i++;
  }

  // Parse remaining attributes
  while (i < parts.length) {
    const part = parts[i];

    // Check for known attributes
    if (['black', 'brown', 'light', 'dark', 'pale'].includes(part)) {
      if (!parsed.skinTone) {
        parsed.skinTone = part;
      } else {
        parsed.extra.push(part);
      }
    } else if (['blonde', 'brunette', 'redhead', 'white', 'gray'].includes(part)) {
      parsed.hairColor = part;
    } else if (part === 'alt') {
      parsed.style = 'alternative';
    } else if (part === 'old') {
      parsed.ageGroup = 'old';
    } else if (['blue', 'red', 'green', 'purple', 'yellow'].includes(part)) {
      parsed.color = part;
    } else {
      parsed.extra.push(part);
    }

    i++;
  }

  return parsed;
}

// Read sprite files from all sizes
const sizes = ['24x32', '48x64_scale2x'];
const allCharacters = new Map();

sizes.forEach(size => {
  console.log(`Scanning ${size}...`);

  const peoplePath = path.join(basePath, `sprite/people/PNG/${size}`);
  const characterPath = path.join(basePath, `sprite/character/PNG/${size}`);

  // Process people sprites
  if (fs.existsSync(peoplePath)) {
    const peopleSprites = fs.readdirSync(peoplePath).filter(f => f.endsWith('.png'));

    peopleSprites.forEach(sprite => {
      const baseName = sprite.replace('.png', '');

      if (!allCharacters.has(baseName)) {
        allCharacters.set(baseName, {
          id: baseName,
          category: 'people',
          attributes: parseCharacterName(sprite),
          sprites: {},
          facesets: []
        });
      }

      allCharacters.get(baseName).sprites[size] = `sprite/people/PNG/${size}/${sprite}`;
    });
  }

  // Process character sprites
  if (fs.existsSync(characterPath)) {
    const characterSprites = fs.readdirSync(characterPath).filter(f => f.endsWith('.png'));

    characterSprites.forEach(sprite => {
      const baseName = sprite.replace('.png', '');

      if (!allCharacters.has(baseName)) {
        allCharacters.set(baseName, {
          id: baseName,
          category: 'character',
          attributes: parseCharacterName(sprite),
          sprites: {},
          facesets: []
        });
      }

      allCharacters.get(baseName).sprites[size] = `sprite/character/PNG/${size}/${sprite}`;
    });
  }
});

// Add faceset information
const peopleFacesPath = path.join(basePath, 'faceset/people/PNG/original');
const characterFacesPath = path.join(basePath, 'faceset/character/PNG/original');

function getBaseName(filename) {
  const base = filename.replace('.png', '');
  const emotions = ['-angry', '-blush', '-dislike', '-happy', '-like', '-neutral', '-smirk', '-surprised'];
  for (const emotion of emotions) {
    if (base.endsWith(emotion)) {
      return base.substring(0, base.length - emotion.length);
    }
  }
  return base;
}

function findMatchingFaceset(charId, facesets) {
  return facesets.filter(f => getBaseName(f) === charId);
}

if (fs.existsSync(peopleFacesPath)) {
  const peopleFaces = fs.readdirSync(peopleFacesPath).filter(f => f.endsWith('.png'));

  allCharacters.forEach((char, id) => {
    if (char.category === 'people') {
      const matches = findMatchingFaceset(id, peopleFaces);
      if (matches.length > 0) {
        char.facesets = matches.map(f => `faceset/people/PNG/original/${f}`);
      }
    }
  });
}

if (fs.existsSync(characterFacesPath)) {
  const characterFaces = fs.readdirSync(characterFacesPath).filter(f => f.endsWith('.png'));

  allCharacters.forEach((char, id) => {
    if (char.category === 'character') {
      const matches = findMatchingFaceset(id, characterFaces);
      if (matches.length > 0) {
        char.facesets = matches.map(f => `faceset/character/PNG/original/${f}`);
      }
    }
  });
}

// Create comprehensive index
const charactersObj = Object.fromEntries(allCharacters);

const mapping = {
  metadata: {
    generated: new Date().toISOString(),
    basePath: '/assets/cabbit-0.5',
    totalCharacters: allCharacters.size,
    availableSizes: sizes,
    recommendedSize: '24x32',
    namingConvention: {
      pattern: 'type-[ageGroup]-gender-variant-skinTone-[hairColor|style|color]',
      examples: [
        'aristocrate-f-001-brown-blonde = aristocrat, female, variant 001, brown skin, blonde hair',
        'townfolk-adult-f-003-alt-light = townfolk, adult, female, variant 003, alternative style, light skin',
        'fighter-m-002-black = fighter, male, variant 002, black skin'
      ],
      attributes: {
        type: 'Character class or role (aristocrate, fighter, mage, townfolk, etc.)',
        ageGroup: 'Age category (adult, child, young, old) - optional',
        gender: 'Gender (f=female, m=male)',
        variant: 'Variant number (001, 002, 003, etc.)',
        skinTone: 'Skin color (black, brown, light, dark, pale)',
        hairColor: 'Hair color (blonde, brunette, redhead, white, gray) - optional',
        style: 'Style variant (alt=alternative) - optional',
        color: 'Outfit/robe color (blue, red, green, etc.) - optional'
      }
    }
  },
  characters: charactersObj,
  index: {
    allCharacterIds: Array.from(allCharacters.keys()).sort(),
    byType: {},
    byGender: {
      female: [],
      male: [],
      unknown: []
    },
    byAgeGroup: {
      adult: [],
      child: [],
      young: [],
      old: [],
      unspecified: []
    },
    bySkinTone: {
      black: [],
      brown: [],
      light: [],
      dark: [],
      pale: [],
      unspecified: []
    },
    byHairColor: {
      blonde: [],
      brunette: [],
      redhead: [],
      white: [],
      gray: [],
      unspecified: []
    },
    bySize: {},
    withFacesets: [],
    withEmotions: []
  }
};

// Build indexes
allCharacters.forEach((char, id) => {
  const attr = char.attributes;

  // By type
  if (attr.type) {
    if (!mapping.index.byType[attr.type]) {
      mapping.index.byType[attr.type] = [];
    }
    mapping.index.byType[attr.type].push(id);
  }

  // By gender
  if (attr.gender === 'female') {
    mapping.index.byGender.female.push(id);
  } else if (attr.gender === 'male') {
    mapping.index.byGender.male.push(id);
  } else {
    mapping.index.byGender.unknown.push(id);
  }

  // By age group
  const ageGroup = attr.ageGroup || 'unspecified';
  mapping.index.byAgeGroup[ageGroup].push(id);

  // By skin tone
  const skinTone = attr.skinTone || 'unspecified';
  if (mapping.index.bySkinTone[skinTone]) {
    mapping.index.bySkinTone[skinTone].push(id);
  }

  // By hair color
  const hairColor = attr.hairColor || 'unspecified';
  if (mapping.index.byHairColor[hairColor]) {
    mapping.index.byHairColor[hairColor].push(id);
  }

  // Characters with facesets
  if (char.facesets.length > 0) {
    mapping.index.withFacesets.push(id);

    // Characters with emotions (multiple facesets)
    if (char.facesets.length > 1) {
      mapping.index.withEmotions.push(id);
    }
  }
});

// By size
sizes.forEach(size => {
  mapping.index.bySize[size] = Array.from(allCharacters.keys()).filter(id =>
    allCharacters.get(id).sprites[size]
  );
});

// Save mapping
const outputPath = path.join(basePath, 'character-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

console.log(`\n✅ Enhanced mapping saved to: ${outputPath}\n`);
console.log('📊 Statistics:\n');
console.log(`Total characters: ${allCharacters.size}`);
console.log(`\nBy size:`);
sizes.forEach(size => {
  console.log(`  ${size.padEnd(20)}: ${mapping.index.bySize[size].length}`);
});
console.log(`\nBy gender:`);
console.log(`  Female:              ${mapping.index.byGender.female.length}`);
console.log(`  Male:                ${mapping.index.byGender.male.length}`);
console.log(`  Unknown:             ${mapping.index.byGender.unknown.length}`);
console.log(`\nBy age group:`);
Object.entries(mapping.index.byAgeGroup).forEach(([age, ids]) => {
  console.log(`  ${age.padEnd(20)}: ${ids.length}`);
});
console.log(`\nBy skin tone:`);
Object.entries(mapping.index.bySkinTone).forEach(([tone, ids]) => {
  console.log(`  ${tone.padEnd(20)}: ${ids.length}`);
});
console.log(`\nBy hair color:`);
Object.entries(mapping.index.byHairColor).forEach(([color, ids]) => {
  if (ids.length > 0) {
    console.log(`  ${color.padEnd(20)}: ${ids.length}`);
  }
});
console.log(`\nCharacter types (${Object.keys(mapping.index.byType).length}):`);
Object.entries(mapping.index.byType)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([type, ids]) => {
    console.log(`  ${type.padEnd(20)}: ${ids.length}`);
  });
console.log(`\nWith facesets:        ${mapping.index.withFacesets.length}`);
console.log(`With emotions:        ${mapping.index.withEmotions.length}`);
