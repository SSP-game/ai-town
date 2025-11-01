# Cabbit Assets Integration Guide for AI Town

## 📦 What You Have

您现在有 **180个角色资源** 可用，包括：

- **148个** 普通角色（people）- 各种NPC、平民等
- **32个** 命名角色（characters）- 英雄、特定角色（带多种表情）
- **完整的精灵图和头像映射** - 存储在 `character-mapping.json`

### 📊 资源统计

```
总角色数：180
├─ 女性角色：73
├─ 男性角色：74
└─ 性别未知：33

角色类型（11种）：
├─ 战士 (Fighter): 16
├─ 贵族 (Aristocrate): 14
├─ 牧师 (Cleric): 10
├─ 法师 (Mage): 10
├─ 游侠 (Ranger): 9
├─ 士兵 (Soldier): 4
├─ 邪教徒 (Cultist): 3
├─ 吟游诗人 (Bard): 2
├─ 小丑 (Clown): 2
├─ 舞者 (Dancer): 2
└─ 女巫 (Witch): 1
```

## 📁 文件位置

### 已创建的文件

1. **`/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/character-mapping.json`**
   - 完整的角色映射文件（精灵图↔头像）
   - 包含180个角色的完整数据

2. **`/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/README.md`**
   - 详细的资源说明文档
   - 使用示例和集成指南

3. **`/Users/kang/GitHub/ai-twon-exp-3/generate_character_mapping.mjs`**
   - 生成映射文件的脚本
   - 可重新扫描和更新映射

4. **`/Users/kang/GitHub/ai-twon-exp-3/query_characters.mjs`**
   - 交互式查询工具
   - 可按类型、性别、名称搜索角色

### 原始资源位置

- **精灵图**：`/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/sprite/`
  - `people/PNG/48x64_scale2x/` - 148个角色精灵图
  - `character/PNG/48x64_scale2x/` - 32个命名角色精灵图

- **头像**：`/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/faceset/`
  - `people/PNG/original/` - 152个角色头像
  - `character/PNG/original/` - 203个头像（包含表情变化）

## 🔧 如何使用查询工具

### 基本命令

```bash
# 查看统计信息
node query_characters.mjs stats

# 列出所有角色类型
node query_characters.mjs types

# 列出特定类型的角色
node query_characters.mjs list fighter
node query_characters.mjs list mage

# 按性别筛选
node query_characters.mjs gender f  # 女性角色
node query_characters.mjs gender m  # 男性角色

# 获取随机角色
node query_characters.mjs random              # 任意随机角色
node query_characters.mjs random fighter      # 随机战士
node query_characters.mjs random mage f       # 随机女法师

# 查看角色的所有表情
node query_characters.mjs emotions Angela-mage-001

# 搜索角色
node query_characters.mjs search aristocrate
node query_characters.mjs search lyuba
```

### 示例输出

```bash
$ node query_characters.mjs random mage f

🎲 Random Character Selected:

ID: Angela-mage-001 ♀
Category: character
Sprite: sprite/character/PNG/48x64_scale2x/Angela-mage-001.png
Facesets (8):
  - angry: faceset/character/PNG/original/Angela-mage-001-angry.png
  - happy: faceset/character/PNG/original/Angela-mage-001-happy.png
  - neutral: faceset/character/PNG/original/Angela-mage-001-neutral.png
  ...
```

## 🎮 集成到 AI Town

### 方法1：快速预览（使用现有尺寸）

Cabbit资源是 **48x64像素**，而AI Town当前使用 **32x32像素**。

您可以先测试显示这些角色（可能需要调整大小）：

```typescript
// 在 data/characters.ts 中添加
import { data as angelaSpritesheetData } from './spritesheets/angela';

export const characters = [
  // ... 现有角色
  {
    name: 'angela',
    textureUrl: '/assets/cabbit-0.5/sprite/character/PNG/48x64_scale2x/Angela-mage-001.png',
    spritesheetData: angelaSpritesheetData,
    speed: 0.2,
  },
];
```

### 方法2：转换为32x32格式（推荐）

1. **使用图像编辑工具调整大小**
   ```bash
   # 使用 ImageMagick 批量转换
   convert Angela-mage-001.png -resize 32x32 angela-32x32.png
   ```

2. **创建新的精灵图配置**
   ```typescript
   // data/spritesheets/angela.ts
   import { SpritesheetData } from './types';

   export const data: SpritesheetData = {
     frames: {
       down: { frame: { x: 0, y: 0, w: 32, h: 32 }, ... },
       down2: { frame: { x: 32, y: 0, w: 32, h: 32 }, ... },
       // ... 其他方向
     },
     meta: { ... }
   };
   ```

### 方法3：使用映射JSON动态加载

```typescript
// 加载映射文件
import characterMapping from '@/public/assets/cabbit-0.5/character-mapping.json';

// 获取随机女法师
function getRandomFemaleMage() {
  const femaleMages = characterMapping.index.byType.mage.filter(id =>
    characterMapping.index.byGender.female.includes(id)
  );

  const randomId = femaleMages[Math.floor(Math.random() * femaleMages.length)];
  const character = characterMapping.people[randomId] || characterMapping.characters[randomId];

  return {
    id: randomId,
    sprite: character.sprite,
    facesets: character.facesets
  };
}
```

## 🎨 推荐的集成步骤

### 第一步：选择角色（5分钟）

使用查询工具挑选您想要的角色：

```bash
# 获取5个随机女性角色
node query_characters.mjs random "" f
node query_characters.mjs random "" f
node query_characters.mjs random "" f
node query_characters.mjs random "" f
node query_characters.mjs random "" f
```

### 第二步：准备精灵图（30分钟）

1. 从 `public/assets/cabbit-0.5/sprite/` 复制选中的角色
2. 使用图像编辑工具调整为 32x32 像素
3. 放置到 `public/assets/` 目录

### 第三步：创建精灵图配置（每个角色10分钟）

参考 `data/spritesheets/f1.ts` 创建新的配置文件

### 第四步：更新角色定义（5分钟）

在 `data/characters.ts` 中添加新角色

### 第五步：测试（10分钟）

```bash
npx convex run testing:wipeAllTables
npm run dev
```

## 💡 推荐的角色选择

### 初学者友好（已有头像和表情）

这些角色有完整的表情包（8种表情），适合交互式对话：

**女性角色：**
- Angela (mage) - 法师
- Helena (fighter) - 战士
- Lyuba (多职业) - 全能角色
- Ruby (ranger) - 游侠
- Claris (healer) - 治疗师

**男性角色：**
- Evan (healer) - 治疗师
- Nathan (mage) - 法师
- Roland (soldier) - 士兵
- Vasily (fighter) - 战士
- Yan (多职业) - 全能角色

### 多样化NPC（简单头像）

从 `people` 类别中选择，提供多样性：

```bash
# 查看所有战士
node query_characters.mjs list fighter

# 查看所有法师
node query_characters.mjs list mage
```

## 🔄 维护和更新

### 重新生成映射文件

如果添加了新的资源文件：

```bash
node /Users/kang/GitHub/ai-twon-exp-3/generate_character_mapping.mjs
```

### 备份重要文件

建议备份这些文件：
- `character-mapping.json`
- `generate_character_mapping.mjs`
- `query_characters.mjs`

## 📚 相关资源

- **AI Town角色扩展指南**: `CHARACTER_GUIDE.md`
- **Cabbit资源README**: `/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/README.md`
- **现有角色定义**: `data/characters.ts`
- **精灵图示例**: `data/spritesheets/f1.ts`

## ❓ 常见问题

### Q: 为什么Cabbit资源是48x64而不是32x32？

A: Cabbit使用更高分辨率以获得更好的视觉质量。您需要缩放或调整以匹配AI Town的32x32格式。

### Q: 我可以混合使用不同尺寸的角色吗？

A: 技术上可以，但为了视觉一致性，建议统一使用32x32。

### Q: 如何添加更多表情？

A: 命名角色（如Angela、Lyuba）已经包含8种表情。在`character-mapping.json`中查看`facesets`数组。

### Q: 哪些角色有最多的变体？

A: Lyuba和Yan有多个职业变体（cleric、fighter、mage、ranger），每个都有8种表情。

---

**创建时间**: 2025-11-01
**总角色数**: 180
**文件位置**: `/Users/kang/github/ai-twon-exp-3/public/assets/cabbit-0.5/`
