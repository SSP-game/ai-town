#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const mappingPath = '/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/character-mapping.json';
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
🎮 AI Town Enhanced Character Query Tool

Usage: node query_characters_enhanced.mjs <command> [options]

Commands:
  list <type>           List all characters of a specific type
  gender <m|f>          List characters by gender
  skin <tone>           List characters by skin tone (black, brown, light)
  age <group>           List characters by age (adult, child, old)
  hair <color>          List characters by hair color (blonde, brunette)
  size <24x32|48x64>    List characters available in specific size

  random [filters]      Get a random character with optional filters
                        Filters: type=<type> gender=<m|f> skin=<tone> age=<group>
                        Example: random type=mage gender=f skin=light

  info <id>             Show detailed info for a character
  compare <id1> <id2>   Compare two characters
  stats                 Show statistics
  types                 List all available character types
  search <keyword>      Search characters by name

Examples:
  node query_characters_enhanced.mjs list townfolk
  node query_characters_enhanced.mjs skin brown
  node query_characters_enhanced.mjs age adult
  node query_characters_enhanced.mjs random type=fighter gender=f skin=light
  node query_characters_enhanced.mjs info aristocrate-f-001-brown-blonde
  node query_characters_enhanced.mjs size 24x32
`);
}

function showStats() {
  console.log('\n📊 Character Statistics\n');
  console.log(`Total Characters: ${mapping.metadata.totalCharacters}`);
  console.log(`Recommended Size: ${mapping.metadata.recommendedSize}`);

  console.log(`\n📏 Available Sizes:`);
  mapping.metadata.availableSizes.forEach(size => {
    console.log(`  - ${size}: ${mapping.index.bySize[size].length} characters`);
  });

  console.log(`\n👤 By Gender:`);
  Object.entries(mapping.index.byGender).forEach(([gender, ids]) => {
    const symbol = gender === 'female' ? '♀' : gender === 'male' ? '♂' : '?';
    console.log(`  ${symbol} ${gender.padEnd(10)}: ${ids.length}`);
  });

  console.log(`\n👶 By Age Group:`);
  Object.entries(mapping.index.byAgeGroup).forEach(([age, ids]) => {
    if (ids.length > 0) {
      console.log(`  ${age.padEnd(12)}: ${ids.length}`);
    }
  });

  console.log(`\n🎨 By Skin Tone:`);
  Object.entries(mapping.index.bySkinTone).forEach(([tone, ids]) => {
    if (ids.length > 0) {
      console.log(`  ${tone.padEnd(12)}: ${ids.length}`);
    }
  });

  console.log(`\n💇 By Hair Color:`);
  Object.entries(mapping.index.byHairColor).forEach(([color, ids]) => {
    if (ids.length > 0 && color !== 'unspecified') {
      console.log(`  ${color.padEnd(12)}: ${ids.length}`);
    }
  });

  console.log(`\n🎭 By Type (top 10):`);
  Object.entries(mapping.index.byType)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([type, ids]) => {
      console.log(`  ${type.padEnd(15)}: ${ids.length}`);
    });

  console.log(`\n😊 Special:`);
  console.log(`  With facesets : ${mapping.index.withFacesets.length}`);
  console.log(`  With emotions : ${mapping.index.withEmotions.length}`);
}

function listTypes() {
  console.log('\n🎭 Available Character Types:\n');
  Object.keys(mapping.index.byType)
    .sort()
    .forEach(type => {
      console.log(`  - ${type} (${mapping.index.byType[type].length})`);
    });
}

function listByType(type) {
  const characters = mapping.index.byType[type.toLowerCase()] ||
                     mapping.index.byType[type];
  if (!characters) {
    console.log(`❌ Type "${type}" not found. Use "types" command to see available types.`);
    return;
  }

  console.log(`\n🎭 ${type.toUpperCase()} Characters (${characters.length}):\n`);
  characters.forEach(id => {
    const char = mapping.characters[id];
    const attr = char.attributes;
    const genderSymbol = attr.gender === 'female' ? '♀' : attr.gender === 'male' ? '♂' : '?';
    const info = [];
    if (attr.skinTone) info.push(attr.skinTone);
    if (attr.hairColor) info.push(attr.hairColor + ' hair');
    if (attr.ageGroup) info.push(attr.ageGroup);
    if (attr.style) info.push(attr.style);

    console.log(`  ${genderSymbol} ${id.padEnd(45)} ${info.join(', ')}`);
  });
}

function listBySkin(tone) {
  const toneKey = tone.toLowerCase();
  const characters = mapping.index.bySkinTone[toneKey];

  if (!characters || characters.length === 0) {
    console.log(`❌ No characters found with skin tone "${tone}"`);
    console.log('Available tones:', Object.keys(mapping.index.bySkinTone).filter(k => k !== 'unspecified').join(', '));
    return;
  }

  console.log(`\n🎨 Characters with ${tone.toUpperCase()} skin (${characters.length}):\n`);
  characters.forEach(id => {
    const char = mapping.characters[id];
    const attr = char.attributes;
    const genderSymbol = attr.gender === 'female' ? '♀' : attr.gender === 'male' ? '♂' : '?';
    console.log(`  ${genderSymbol} ${id.padEnd(45)} [${attr.type}]`);
  });
}

function listByAge(ageGroup) {
  const ageKey = ageGroup.toLowerCase();
  const characters = mapping.index.byAgeGroup[ageKey];

  if (!characters || characters.length === 0) {
    console.log(`❌ No characters found with age group "${ageGroup}"`);
    console.log('Available age groups:', Object.keys(mapping.index.byAgeGroup).filter(k => k !== 'unspecified').join(', '));
    return;
  }

  console.log(`\n👶 ${ageGroup.toUpperCase()} Characters (${characters.length}):\n`);
  characters.forEach(id => {
    const char = mapping.characters[id];
    const attr = char.attributes;
    const genderSymbol = attr.gender === 'female' ? '♀' : attr.gender === 'male' ? '♂' : '?';
    console.log(`  ${genderSymbol} ${id.padEnd(45)} [${attr.type}, ${attr.skinTone || 'unspecified'}]`);
  });
}

function listBySize(size) {
  const characters = mapping.index.bySize[size];

  if (!characters) {
    console.log(`❌ Size "${size}" not available`);
    console.log('Available sizes:', mapping.metadata.availableSizes.join(', '));
    return;
  }

  console.log(`\n📏 Characters available in ${size} (${characters.length}):\n`);
  characters.slice(0, 20).forEach(id => {
    const char = mapping.characters[id];
    console.log(`  ${id.padEnd(45)} [${char.category}]`);
  });

  if (characters.length > 20) {
    console.log(`\n  ... and ${characters.length - 20} more`);
  }
}

function getRandom(filterArgs) {
  let pool = mapping.index.allCharacterIds;
  const filters = {};

  // Parse filters
  filterArgs.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key && value) {
      filters[key.toLowerCase()] = value.toLowerCase();
    }
  });

  // Apply filters
  if (filters.type) {
    const typeChars = mapping.index.byType[filters.type];
    if (!typeChars) {
      console.log(`❌ Type "${filters.type}" not found.`);
      return;
    }
    pool = pool.filter(id => typeChars.includes(id));
  }

  if (filters.gender) {
    const genderKey = filters.gender === 'm' || filters.gender === 'male' ? 'male' :
                      filters.gender === 'f' || filters.gender === 'female' ? 'female' : 'unknown';
    pool = pool.filter(id => mapping.index.byGender[genderKey].includes(id));
  }

  if (filters.skin) {
    const skinChars = mapping.index.bySkinTone[filters.skin];
    if (skinChars) {
      pool = pool.filter(id => skinChars.includes(id));
    }
  }

  if (filters.age) {
    const ageChars = mapping.index.byAgeGroup[filters.age];
    if (ageChars) {
      pool = pool.filter(id => ageChars.includes(id));
    }
  }

  if (pool.length === 0) {
    console.log('❌ No characters found matching criteria.');
    return;
  }

  const randomId = pool[Math.floor(Math.random() * pool.length)];
  showInfo(randomId, '🎲 Random Character Selected');
}

function showInfo(characterId, title = '📋 Character Information') {
  const char = mapping.characters[characterId];
  if (!char) {
    console.log(`❌ Character "${characterId}" not found.`);
    return;
  }

  const attr = char.attributes;
  const genderSymbol = attr.gender === 'female' ? '♀' : attr.gender === 'male' ? '♂' : '?';

  console.log(`\n${title}\n`);
  console.log(`ID: ${characterId} ${genderSymbol}`);
  console.log(`Category: ${char.category}`);
  console.log(`\nAttributes:`);
  console.log(`  Type:       ${attr.type || 'N/A'}`);
  console.log(`  Gender:     ${attr.gender || 'N/A'}`);
  console.log(`  Age Group:  ${attr.ageGroup || 'N/A'}`);
  console.log(`  Skin Tone:  ${attr.skinTone || 'N/A'}`);
  console.log(`  Hair Color: ${attr.hairColor || 'N/A'}`);
  console.log(`  Variant:    ${attr.variant || 'N/A'}`);
  if (attr.style) console.log(`  Style:      ${attr.style}`);
  if (attr.color) console.log(`  Color:      ${attr.color}`);
  if (attr.extra.length > 0) console.log(`  Extra:      ${attr.extra.join(', ')}`);

  console.log(`\nAvailable Sprites:`);
  Object.entries(char.sprites).forEach(([size, path]) => {
    console.log(`  ${size}: ${path}`);
  });

  console.log(`\nFacesets (${char.facesets.length}):`);
  if (char.facesets.length === 0) {
    console.log('  (none)');
  } else {
    char.facesets.forEach(faceset => {
      const emotion = faceset.match(/-(\w+)\.png$/)?.[1] || 'default';
      console.log(`  - ${emotion}: ${faceset}`);
    });
  }
}

function search(keyword) {
  const results = mapping.index.allCharacterIds.filter(id =>
    id.toLowerCase().includes(keyword.toLowerCase())
  );

  console.log(`\n🔍 Search results for "${keyword}" (${results.length} found):\n`);

  if (results.length === 0) {
    console.log('  (no matches)');
    return;
  }

  results.slice(0, 30).forEach(id => {
    const char = mapping.characters[id];
    const attr = char.attributes;
    const genderSymbol = attr.gender === 'female' ? '♀' : attr.gender === 'male' ? '♂' : '?';
    console.log(`  ${genderSymbol} ${id.padEnd(45)} [${attr.type}, ${attr.skinTone || '?'}]`);
  });

  if (results.length > 30) {
    console.log(`\n  ... and ${results.length - 30} more`);
  }
}

// Main command router
switch (command) {
  case 'list':
    if (!args[1]) {
      console.log('❌ Please specify a type.');
    } else {
      listByType(args[1]);
    }
    break;

  case 'gender':
    if (!args[1]) {
      console.log('❌ Please specify gender: m or f');
    } else {
      const genderKey = args[1] === 'm' || args[1] === 'male' ? 'male' :
                        args[1] === 'f' || args[1] === 'female' ? 'female' : null;
      if (genderKey) {
        listByType(''); // Will show all, filter by gender
        const chars = mapping.index.byGender[genderKey];
        console.log(`\n${genderKey === 'male' ? '♂' : '♀'} ${genderKey.toUpperCase()} Characters (${chars.length}):\n`);
        chars.slice(0, 30).forEach(id => {
          const char = mapping.characters[id];
          console.log(`  ${id.padEnd(45)} [${char.attributes.type}]`);
        });
      }
    }
    break;

  case 'skin':
    if (!args[1]) {
      console.log('❌ Please specify skin tone: black, brown, light');
    } else {
      listBySkin(args[1]);
    }
    break;

  case 'age':
    if (!args[1]) {
      console.log('❌ Please specify age group: adult, child, old');
    } else {
      listByAge(args[1]);
    }
    break;

  case 'size':
    if (!args[1]) {
      console.log('❌ Please specify size: 24x32 or 48x64_scale2x');
    } else {
      listBySize(args[1]);
    }
    break;

  case 'random':
    getRandom(args.slice(1));
    break;

  case 'info':
    if (!args[1]) {
      console.log('❌ Please specify a character ID.');
    } else {
      showInfo(args[1]);
    }
    break;

  case 'stats':
    showStats();
    break;

  case 'types':
    listTypes();
    break;

  case 'search':
    if (!args[1]) {
      console.log('❌ Please specify a search keyword.');
    } else {
      search(args[1]);
    }
    break;

  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
