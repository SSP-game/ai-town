# AI Town 角色扩展指南

## 当前可用角色

### 用户可选择的角色（8个）
您的应用目前有 **8个角色形象** 可供用户选择：

| 角色ID | 当前分配 | 精灵图文件 | 描述 |
|--------|---------|-----------|------|
| f1 | Lucky | data/spritesheets/f1.ts | 快乐好奇的角色，喜欢奶酪 |
| f2 | 未使用 | data/spritesheets/f2.ts | 可用 |
| f3 | Alice | data/spritesheets/f3.ts | 著名科学家 |
| f4 | Bob | data/spritesheets/f4.ts | 爱种树的脾气暴躁的人 |
| f5 | 未使用 | data/spritesheets/f5.ts | 可用 |
| f6 | Stella | data/spritesheets/f6.ts | 狡猾的骗子 |
| f7 | Pete | data/spritesheets/f7.ts | 虔诚的宗教信徒 |
| f8 | 未使用 | data/spritesheets/f8.ts | 可用 |

### 额外的角色精灵图
还有一些额外的精灵图文件：
- `player.ts` - 玩家角色
- `p1.ts`, `p2.ts`, `p3.ts` - 额外的角色选项

---

## 如何扩展角色

### 方法1：使用现有的未使用角色 (最简单)

您可以启用 f2、f5、f8 这些已经存在但被注释掉的角色。

**步骤：**

1. 打开 `data/characters.ts`
2. 取消注释相关角色，例如：

```typescript
{
  name: 'Alex',
  character: 'f5',
  identity: `You are a fictional character whose name is Alex...`,
  plan: 'You want to find love.',
},
```

3. 保存文件
4. 运行 `npx convex run testing:wipeAllTables` 重置数据库
5. 运行 `npm run dev` 启动应用

### 方法2：添加新的角色精灵图

如果您想添加全新的角色形象（例如 f9, f10 等）：

#### 第一步：准备精灵图

1. **获取或创建32x32像素的角色精灵图**
   - 图片格式：PNG
   - 精灵图布局：应包含角色的上、下、左、右四个方向的动画帧
   - 参考：`assets/32x32folk.png`

2. **创建精灵图配置文件**

   在 `data/spritesheets/` 目录创建新文件，例如 `f9.ts`：

```typescript
import { SpritesheetData } from './types';

export const data: SpritesheetData = {
  frames: {
    left: {
      frame: { x: 0, y: 32, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left2: {
      frame: { x: 32, y: 32, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    left3: {
      frame: { x: 64, y: 32, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0 },
    },
    // ... 继续添加 right, right2, right3, up, up2, up3, down, down2, down3
  },
  meta: {
    related_multi_packs: [],
    frameTags: [
      { name: 'left', from: 0, to: 2, direction: 'forward' },
      { name: 'right', from: 3, to: 5, direction: 'forward' },
      { name: 'up', from: 6, to: 8, direction: 'forward' },
      { name: 'down', from: 9, to: 11, direction: 'forward' },
    ],
  },
};
```

#### 第二步：更新 characters.ts

1. **导入新的精灵图数据**

```typescript
import { data as f9SpritesheetData } from './spritesheets/f9';
```

2. **添加角色定义到 `characters` 数组**

```typescript
export const characters = [
  // ... 现有的 f1-f8
  {
    name: 'f9',
    textureUrl: './assets/32x32folk.png', // 或您的新图片路径
    spritesheetData: f9SpritesheetData,
    speed: 0.2,
  },
];
```

3. **（可选）添加AI角色描述到 `Descriptions` 数组**

```typescript
export const Descriptions = [
  // ... 现有角色
  {
    name: 'NewCharacter',
    character: 'f9',
    identity: `角色的身份和个性描述...`,
    plan: '角色的目标和计划...',
  },
];
```

#### 第三步：更新用户界面

如果您添加了新角色，需要在用户设置界面显示：

编辑 `src/components/UserSettingsView.tsx`，在角色选择部分添加新选项。

#### 第四步：重置和测试

```bash
# 清除数据库
npx convex run testing:wipeAllTables

# 启动应用
npm run dev
```

---

## 精灵图坐标说明

每个精灵图文件定义了角色在不同方向上的动画帧：

- **left, left2, left3**: 向左移动的3帧动画
- **right, right2, right3**: 向右移动的3帧动画
- **up, up2, up3**: 向上移动的3帧动画
- **down, down2, down3**: 向下移动的3帧动画

每个帧定义包含：
- `frame`: 在原始图片中的位置和大小 (x, y, width, height)
- `sourceSize`: 源大小
- `spriteSourceSize`: 精灵源大小位置

---

## 精灵图设计工具

推荐使用以下工具创建精灵图：

1. **Aseprite** (付费) - 专业的像素艺术和精灵图编辑器
2. **Piskel** (免费) - 在线像素艺术编辑器
3. **GraphicsGale** (免费) - 动画和精灵图编辑器
4. **GIMP** (免费) - 通用图像编辑器

---

## 注意事项

1. **数据库重置**: 每次添加或修改角色后，需要运行 `npx convex run testing:wipeAllTables` 清空数据库
2. **角色ID**: 确保每个角色的 ID (如 f1, f2, f9) 是唯一的
3. **精灵图尺寸**: 所有精灵图应使用相同的尺寸 (32x32 像素)
4. **动画帧数**: 每个方向应有3帧动画以保持一致性

---

## 快速添加角色流程

### 启用现有但未使用的角色 (5分钟)

```bash
# 1. 编辑 data/characters.ts，取消注释 f2, f5, f8
# 2. 重置数据库
npx convex run testing:wipeAllTables
# 3. 启动
npm run dev
```

### 添加全新角色 (30-60分钟)

1. 设计/获取 32x32 像素精灵图 (15-30分钟)
2. 创建精灵图配置文件 `data/spritesheets/f9.ts` (10分钟)
3. 更新 `data/characters.ts` (5分钟)
4. 测试和调试 (10分钟)

---

## 相关文件

- `data/characters.ts` - 角色定义
- `data/spritesheets/*.ts` - 精灵图配置
- `assets/32x32folk.png` - 精灵图图片
- `src/components/UserSettingsView.tsx` - 用户设置界面（角色选择）

---

## 需要帮助？

如果您需要添加新角色但遇到问题，请确保：
1. 精灵图格式正确（32x32像素，PNG格式）
2. 坐标计算准确（每个动画帧的位置）
3. 导入语句正确
4. 运行了数据库重置命令
