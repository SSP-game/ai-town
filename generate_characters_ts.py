#!/usr/bin/env python3
"""Generate complete characters.ts file with all Karmenis characters"""

import os
import glob

# Get all character PNG files
chars_dir = "/Users/kang/github/ai-twon-exp-3/public/assets/karmenis-characters"
char_files = sorted([os.path.basename(f).replace('.png', '') for f in glob.glob(f"{chars_dir}/*.png")])

print(f"// Generated character imports and definitions")
print(f"// Total characters: {len(char_files)}")
print()

# Generate imports for f1-f8
for i in range(1, 9):
    print(f"import {{ data as f{i}SpritesheetData }} from './spritesheets/f{i}';")

print()
print("// Karmenis character spritesheets")

# Generate imports for Karmenis characters
for char_name in char_files:
    safe_name = char_name.replace(' ', '_')
    print(f"import {{ data as {safe_name}SpritesheetData }} from './spritesheets/{safe_name}';")

print()
print("export const Descriptions = [")
print("  {")
print("    name: 'Alex',")
print("    character: 'f5',")
print("    identity: `You are a fictional character whose name is Alex.  You enjoy painting,")
print("      programming and reading sci-fi books.  You are currently talking to a human who")
print("      is very interested to get to know you. You are kind but can be sarcastic. You")
print("      dislike repetitive questions. You get SUPER excited about books.`,")
print("    plan: 'You want to find love.',")
print("  },")
print("  {")
print("    name: 'Lucky',")
print("    character: 'f1',")
print("    identity: `Lucky is always happy and curious, and he loves cheese. He spends most of his time reading about the history of science and traveling through the galaxy on whatever ship will take him. He's very articulate and infinitely patient, except when he sees a squirrel. He's also incredibly loyal and brave.  Lucky has just returned from an amazing space adventure to explore a distant planet and he's very excited to tell people about it.`,")
print("    plan: 'You want to hear all the gossip.',")
print("  },")
print("  {")
print("    name: 'Bob',")
print("    character: 'f4',")
print("    identity: `Bob is always grumpy and he loves trees. He spends most of his time gardening by himself. When spoken to he'll respond but try and get out of the conversation as quickly as possible. Secretly he resents that he never went to college.`,")
print("    plan: 'You want to avoid people as much as possible.',")
print("  },")
print("  {")
print("    name: 'Stella',")
print("    character: 'f6',")
print("    identity: `Stella can never be trusted. she tries to trick people all the time. normally into giving her money, or doing things that will make her money. she's incredibly charming and not afraid to use her charm. she's a sociopath who has no empathy. but hides it well.`,")
print("    plan: 'You want to take advantage of others as much as possible.',")
print("  },")
print("  {")
print("    name: 'Kurt',")
print("    character: 'f2',")
print("    identity: `Kurt knows about everything, including science and")
print("      computers and politics and history and biology. He loves talking about")
print("      everything, always injecting fun facts about the topic of discussion.`,")
print("    plan: 'You want to spread knowledge.',")
print("  },")
print("  {")
print("    name: 'Alice',")
print("    character: 'f3',")
print("    identity: `Alice is a famous scientist. She is smarter than everyone else and has discovered mysteries of the universe no one else can understand. As a result she often speaks in oblique riddles. She comes across as confused and forgetful.`,")
print("    plan: 'You want to figure out how the world works.',")
print("  },")
print("  {")
print("    name: 'Pete',")
print("    character: 'f7',")
print("    identity: `Pete is deeply religious and sees the hand of god or of the work of the devil everywhere. He can't have a conversation without bringing up his deep faith. Or warning others about the perils of hell.`,")
print("    plan: 'You want to convert everyone to your religion.',")
print("  },")
print("  {")
print("    name: 'Kira',")
print("    character: 'f8',")
print("    identity: `Kira wants everyone to think she is happy. But deep down,")
print("      she's incredibly depressed. She hides her sadness by talking about travel,")
print("      food, and yoga. But often she can't keep her sadness in and will start crying.")
print("      Often it seems like she is close to having a mental breakdown.`,")
print("    plan: 'You want find a way to be happy.',")
print("  },")
print("];")
print()
print("export const characters = [")

# Generate f1-f8 characters
for i in range(1, 9):
    print("  {")
    print(f"    name: 'f{i}',")
    print("    textureUrl: './assets/32x32folk.png',")
    print(f"    spritesheetData: f{i}SpritesheetData,")
    print("    speed: 0.2,")
    print("  },")

# Generate Karmenis characters
for char_name in char_files:
    safe_name = char_name.replace(' ', '_')
    print("  {")
    print(f"    name: '{char_name}',")
    print(f"    textureUrl: './assets/karmenis-characters/{char_name}.png',")
    print(f"    spritesheetData: {safe_name}SpritesheetData,")
    print("    speed: 0.2,")
    print("  },")

print("];")
print()
print("// Characters move at 0.75 tiles per second.")
print("export const movementSpeed = 1;")
