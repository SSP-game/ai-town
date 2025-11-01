#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const mappingPath = '/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/character-mapping.json';
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
🎮 AI Town Character Query Tool

Usage: node query_characters.mjs <command> [options]

Commands:
  list <type>           List all characters of a specific type
                        Types: fighter, mage, cleric, ranger, bard, etc.

  gender <m|f>          List characters by gender
                        Options: m (male), f (female)

  random [type] [gender] Get a random character
                        Examples:
                          random              - Any random character
                          random fighter      - Random fighter
                          random fighter f    - Random female fighter

  emotions <name>       Show all emotions for a character
                        Example: emotions Angela-mage-001

  stats                 Show statistics

  types                 List all available character types

  search <keyword>      Search characters by name

Examples:
  node query_characters.mjs list fighter
  node query_characters.mjs random mage f
  node query_characters.mjs emotions Lyuba-mage-001
  node query_characters.mjs search aristocrate
`);
}

function showStats() {
  console.log('\n📊 Character Statistics\n');
  console.log(`Total Characters: ${mapping.index.allCharacterIds.length}`);
  console.log(`\nBy Category:`);
  console.log(`  - People: ${Object.keys(mapping.people).length}`);
  console.log(`  - Named Characters: ${Object.keys(mapping.characters).length}`);
  console.log(`\nBy Gender:`);
  console.log(`  - Female: ${mapping.index.byGender.female.length}`);
  console.log(`  - Male: ${mapping.index.byGender.male.length}`);
  console.log(`  - Unknown: ${mapping.index.byGender.unknown.length}`);
  console.log(`\nBy Type:`);
  Object.entries(mapping.index.byType)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, ids]) => {
      console.log(`  - ${type.padEnd(12)}: ${ids.length}`);
    });
}

function listTypes() {
  console.log('\n🎭 Available Character Types:\n');
  Object.keys(mapping.index.byType)
    .sort()
    .forEach(type => {
      console.log(`  - ${type}`);
    });
}

function listByType(type) {
  const characters = mapping.index.byType[type.toLowerCase()];
  if (!characters) {
    console.log(`❌ Type "${type}" not found. Use "types" command to see available types.`);
    return;
  }

  console.log(`\n🎭 ${type.toUpperCase()} Characters (${characters.length}):\n`);
  characters.forEach(id => {
    const char = mapping.people[id] || mapping.characters[id];
    const gender = mapping.index.byGender.female.includes(id) ? '♀' :
                   mapping.index.byGender.male.includes(id) ? '♂' : '?';
    const emotionCount = char.facesets.length;
    console.log(`  ${gender} ${id.padEnd(40)} (${emotionCount} faceset${emotionCount !== 1 ? 's' : ''})`);
  });
}

function listByGender(gender) {
  const genderKey = gender.toLowerCase() === 'm' || gender.toLowerCase() === 'male' ? 'male' :
                    gender.toLowerCase() === 'f' || gender.toLowerCase() === 'female' ? 'female' :
                    'unknown';

  const characters = mapping.index.byGender[genderKey];
  console.log(`\n${genderKey === 'male' ? '♂' : genderKey === 'female' ? '♀' : '?'} ${genderKey.toUpperCase()} Characters (${characters.length}):\n`);

  characters.forEach(id => {
    const char = mapping.people[id] || mapping.characters[id];
    const emotionCount = char.facesets.length;
    console.log(`  ${id.padEnd(40)} (${emotionCount} faceset${emotionCount !== 1 ? 's' : ''})`);
  });
}

function getRandom(type, gender) {
  let pool = mapping.index.allCharacterIds;

  // Filter by type if specified
  if (type) {
    const typeChars = mapping.index.byType[type.toLowerCase()];
    if (!typeChars) {
      console.log(`❌ Type "${type}" not found.`);
      return;
    }
    pool = typeChars;
  }

  // Filter by gender if specified
  if (gender) {
    const genderKey = gender.toLowerCase() === 'm' || gender.toLowerCase() === 'male' ? 'male' :
                      gender.toLowerCase() === 'f' || gender.toLowerCase() === 'female' ? 'female' :
                      'unknown';
    pool = pool.filter(id => mapping.index.byGender[genderKey].includes(id));
  }

  if (pool.length === 0) {
    console.log('❌ No characters found matching criteria.');
    return;
  }

  const randomId = pool[Math.floor(Math.random() * pool.length)];
  const char = mapping.people[randomId] || mapping.characters[randomId];
  const genderSymbol = mapping.index.byGender.female.includes(randomId) ? '♀' :
                       mapping.index.byGender.male.includes(randomId) ? '♂' : '?';

  console.log(`\n🎲 Random Character Selected:\n`);
  console.log(`ID: ${randomId} ${genderSymbol}`);
  console.log(`Category: ${char.category}`);
  console.log(`Sprite: ${char.sprite}`);
  console.log(`Facesets (${char.facesets.length}):`);
  if (char.facesets.length === 0) {
    console.log('  (none)');
  } else {
    char.facesets.forEach(faceset => {
      const emotion = faceset.match(/-(\w+)\.png$/)?.[1] || 'default';
      console.log(`  - ${emotion}: ${faceset}`);
    });
  }
}

function showEmotions(characterId) {
  const char = mapping.people[characterId] || mapping.characters[characterId];
  if (!char) {
    console.log(`❌ Character "${characterId}" not found.`);
    return;
  }

  console.log(`\n😊 Emotions for ${characterId}:\n`);
  console.log(`Sprite: ${char.sprite}`);
  console.log(`\nFacesets (${char.facesets.length}):`);

  if (char.facesets.length === 0) {
    console.log('  (no facesets available)');
  } else {
    char.facesets.forEach(faceset => {
      const emotion = faceset.match(/-(\w+)\.png$/)?.[1] || 'default';
      console.log(`  - ${emotion.padEnd(10)}: ${faceset}`);
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

  results.forEach(id => {
    const char = mapping.people[id] || mapping.characters[id];
    const genderSymbol = mapping.index.byGender.female.includes(id) ? '♀' :
                         mapping.index.byGender.male.includes(id) ? '♂' : '?';
    console.log(`  ${genderSymbol} ${id.padEnd(40)} (${char.facesets.length} facesets)`);
  });
}

// Main command router
switch (command) {
  case 'list':
    if (!args[1]) {
      console.log('❌ Please specify a type. Use "types" command to see available types.');
    } else {
      listByType(args[1]);
    }
    break;

  case 'gender':
    if (!args[1]) {
      console.log('❌ Please specify gender: m (male) or f (female)');
    } else {
      listByGender(args[1]);
    }
    break;

  case 'random':
    getRandom(args[1], args[2]);
    break;

  case 'emotions':
    if (!args[1]) {
      console.log('❌ Please specify a character ID.');
    } else {
      showEmotions(args[1]);
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
