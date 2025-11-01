import fs from 'fs';
import path from 'path';

const basePath = '/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5';

console.log('🔍 Scanning all sprite sizes...\n');

// Read all sprite files for different sizes
const sizes = ['24x32', '48x64_scale2x'];
const mapping = {
  metadata: {
    generated: new Date().toISOString(),
    basePath: '/assets/cabbit-0.5',
    sizes: {}
  },
  characters: {}
};

sizes.forEach(size => {
  console.log(`Scanning ${size}...`);

  const peoplePath = path.join(basePath, `sprite/people/PNG/${size}`);
  const characterPath = path.join(basePath, `sprite/character/PNG/${size}`);

  const peopleExists = fs.existsSync(peoplePath);
  const characterExists = fs.existsSync(characterPath);

  let peopleSprites = [];
  let characterSprites = [];

  if (peopleExists) {
    peopleSprites = fs.readdirSync(peoplePath).filter(f => f.endsWith('.png'));
  }

  if (characterExists) {
    characterSprites = fs.readdirSync(characterPath).filter(f => f.endsWith('.png'));
  }

  mapping.metadata.sizes[size] = {
    people: peopleSprites.length,
    characters: characterSprites.length,
    total: peopleSprites.length + characterSprites.length
  };

  console.log(`  - People: ${peopleSprites.length}`);
  console.log(`  - Characters: ${characterSprites.length}`);
  console.log(`  - Total: ${peopleSprites.length + characterSprites.length}\n`);

  // Add to mapping
  [...peopleSprites, ...characterSprites].forEach(sprite => {
    const baseName = sprite.replace('.png', '');
    const category = peopleSprites.includes(sprite) ? 'people' : 'character';

    if (!mapping.characters[baseName]) {
      mapping.characters[baseName] = {
        name: baseName,
        category: category,
        sprites: {},
        facesets: []
      };
    }

    mapping.characters[baseName].sprites[size] =
      `sprite/${category}/PNG/${size}/${sprite}`;
  });
});

// Add faceset information (from previous mapping)
const oldMappingPath = path.join(basePath, 'character-mapping.json');
if (fs.existsSync(oldMappingPath)) {
  const oldMapping = JSON.parse(fs.readFileSync(oldMappingPath, 'utf-8'));

  Object.keys(mapping.characters).forEach(charId => {
    const oldChar = oldMapping.people[charId] || oldMapping.characters[charId];
    if (oldChar && oldChar.facesets) {
      mapping.characters[charId].facesets = oldChar.facesets;
    }
  });
}

// Create index
mapping.index = {
  allCharacterIds: Object.keys(mapping.characters).sort(),
  bySize: {},
  recommendedSize: '24x32',
  sizeComparison: {
    '24x32': {
      recommendation: 'Best for AI Town - closest to 32x32, minimal conversion needed',
      pros: ['Closest to 32x32', 'Lightweight', 'Good performance', 'Most characters'],
      cons: ['Slightly narrower (24 vs 32 width)'],
      conversionDifficulty: 'Easy'
    },
    '48x64_scale2x': {
      recommendation: 'High resolution - needs 50% scaling',
      pros: ['High detail', 'Best visual quality'],
      cons: ['Needs scaling', 'Larger files', 'Performance impact', 'Style mismatch with 32x32'],
      conversionDifficulty: 'Hard'
    }
  }
};

// Add characters available in each size
sizes.forEach(size => {
  mapping.index.bySize[size] = Object.keys(mapping.characters).filter(charId =>
    mapping.characters[charId].sprites[size]
  );
});

// Save mapping
const outputPath = path.join(basePath, 'character-sizes-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

console.log(`✅ Multi-size mapping saved to: ${outputPath}\n`);
console.log('📊 Summary:\n');
console.log(`Total unique characters: ${Object.keys(mapping.characters).length}`);
console.log('\nBy size:');
Object.entries(mapping.metadata.sizes).forEach(([size, counts]) => {
  console.log(`  ${size.padEnd(20)}: ${counts.total} sprites`);
});

console.log(`\n💡 Recommended size: ${mapping.index.recommendedSize}`);
console.log('   Reason: Closest to AI Town\'s 32x32 format\n');

// Show characters available in both sizes
const both = Object.keys(mapping.characters).filter(charId =>
  mapping.characters[charId].sprites['24x32'] &&
  mapping.characters[charId].sprites['48x64_scale2x']
);

console.log(`Characters available in both sizes: ${both.length}`);
