import fs from 'fs';
import path from 'path';

const basePath = '/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5';

// Read all sprite and faceset files
const peopleSprites = fs.readdirSync(path.join(basePath, 'sprite/people/PNG/48x64_scale2x'))
  .filter(f => f.endsWith('.png'))
  .sort();

const characterSprites = fs.readdirSync(path.join(basePath, 'sprite/character/PNG/48x64_scale2x'))
  .filter(f => f.endsWith('.png'))
  .sort();

const peopleFaces = fs.readdirSync(path.join(basePath, 'faceset/people/PNG/original'))
  .filter(f => f.endsWith('.png'))
  .sort();

const characterFaces = fs.readdirSync(path.join(basePath, 'faceset/character/PNG/original'))
  .filter(f => f.endsWith('.png'))
  .sort();

// Helper function to extract base name (remove emotion suffixes for facesets)
function getBaseName(filename) {
  // Remove .png extension
  const base = filename.replace('.png', '');

  // For facesets, remove emotion suffixes
  const emotions = ['-angry', '-blush', '-dislike', '-happy', '-like', '-neutral', '-smirk', '-surprised'];
  for (const emotion of emotions) {
    if (base.endsWith(emotion)) {
      return base.substring(0, base.length - emotion.length);
    }
  }

  return base;
}

// Function to find matching faceset for a sprite
function findMatchingFaceset(spriteName, facesets) {
  const spriteBase = getBaseName(spriteName);

  // Look for exact match first
  const exactMatches = facesets.filter(f => getBaseName(f) === spriteBase);
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Look for partial match
  const partialMatches = facesets.filter(f => {
    const faceBase = getBaseName(f);
    return spriteBase.includes(faceBase) || faceBase.includes(spriteBase);
  });

  return partialMatches.length > 0 ? partialMatches : null;
}

// Create character mapping
const characterMapping = {
  metadata: {
    generated: new Date().toISOString(),
    basePath: '/assets/cabbit-0.5',
    totalPeopleSprites: peopleSprites.length,
    totalCharacterSprites: characterSprites.length,
    totalPeopleFaces: peopleFaces.length,
    totalCharacterFaces: characterFaces.length,
  },
  people: {},
  characters: {}
};

// Map people sprites to facesets
console.log('Mapping people sprites...');
peopleSprites.forEach(sprite => {
  const baseName = getBaseName(sprite);
  const matchingFaces = findMatchingFaceset(sprite, peopleFaces);

  characterMapping.people[baseName] = {
    sprite: `sprite/people/PNG/48x64_scale2x/${sprite}`,
    facesets: matchingFaces ? matchingFaces.map(f => `faceset/people/PNG/original/${f}`) : [],
    category: 'people'
  };
});

// Map character sprites to facesets
console.log('Mapping character sprites...');
characterSprites.forEach(sprite => {
  const baseName = getBaseName(sprite);
  const matchingFaces = findMatchingFaceset(sprite, characterFaces);

  characterMapping.characters[baseName] = {
    sprite: `sprite/character/PNG/48x64_scale2x/${sprite}`,
    facesets: matchingFaces ? matchingFaces.map(f => `faceset/character/PNG/original/${f}`) : [],
    category: 'character'
  };
});

// Create a simplified index for quick lookup
characterMapping.index = {
  allCharacterIds: [
    ...Object.keys(characterMapping.people),
    ...Object.keys(characterMapping.characters)
  ],
  byGender: {
    female: [],
    male: [],
    unknown: []
  },
  byType: {}
};

// Categorize by gender based on naming conventions
[...Object.keys(characterMapping.people), ...Object.keys(characterMapping.characters)].forEach(id => {
  if (id.includes('-f-') || id.toLowerCase().includes('female')) {
    characterMapping.index.byGender.female.push(id);
  } else if (id.includes('-m-') || id.toLowerCase().includes('male')) {
    characterMapping.index.byGender.male.push(id);
  } else {
    // Try to detect from common female/male names
    const femalePrefixes = ['amanda', 'angela', 'claris', 'helena', 'linda', 'lyuba', 'molly', 'ruby', 'aristocrate-f', 'dancer-f', 'fighter-f', 'cleric-f'];
    const malePrefixes = ['evan', 'nathan', 'roland', 'aristocrate-m', 'bard', 'cleric-m'];

    const lowerCaseId = id.toLowerCase();
    if (femalePrefixes.some(prefix => lowerCaseId.startsWith(prefix))) {
      characterMapping.index.byGender.female.push(id);
    } else if (malePrefixes.some(prefix => lowerCaseId.startsWith(prefix))) {
      characterMapping.index.byGender.male.push(id);
    } else {
      characterMapping.index.byGender.unknown.push(id);
    }
  }

  // Extract character type (cleric, fighter, mage, etc.)
  const typeMatch = id.match(/(aristocrate|bard|cleric|fighter|mage|ranger|soldier|witch|healer|dancer|clown|cultist)/i);
  if (typeMatch) {
    const type = typeMatch[1].toLowerCase();
    if (!characterMapping.index.byType[type]) {
      characterMapping.index.byType[type] = [];
    }
    characterMapping.index.byType[type].push(id);
  }
});

// Save to JSON file
const outputPath = path.join(basePath, 'character-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(characterMapping, null, 2));

console.log(`\n✅ Character mapping saved to: ${outputPath}`);
console.log(`\nStats:`);
console.log(`- Total people sprites: ${peopleSprites.length}`);
console.log(`- Total character sprites: ${characterSprites.length}`);
console.log(`- Total unique characters: ${characterMapping.index.allCharacterIds.length}`);
console.log(`- Female characters: ${characterMapping.index.byGender.female.length}`);
console.log(`- Male characters: ${characterMapping.index.byGender.male.length}`);
console.log(`- Unknown gender: ${characterMapping.index.byGender.unknown.length}`);
console.log(`\nCharacter types found:`);
Object.keys(characterMapping.index.byType).forEach(type => {
  console.log(`  - ${type}: ${characterMapping.index.byType[type].length}`);
});
