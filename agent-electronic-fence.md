# AI Agent 电子围栏实现

## 功能概述
为所有AI agent实现了电子围栏功能，限制它们只能活动在地图右上角的帐篷区域内，像是有个看不见的围栏一样。

## 实现细节

### 1. 电子围栏边界定义
在 `convex/constants.ts` 中添加了围栏边界：

```typescript
export const AGENT_FENCE_BOUNDS = {
  // Define the tent area where agents are allowed to move
  // Tent is located in upper right corner with tile value 458
  minX: 35,
  maxX: 44,
  minY: 0,
  maxY: 14,
};
```

这个区域对应地图右上角的帐篷结构（瓦片值458），大约10x15瓦片大小。

### 2. 移动限制
在 `convex/aiTown/movement.ts` 中修改了 `blocked` 和 `blockedWithPositions` 函数：

- 为AI agent添加了额外的围栏检查
- 如果agent尝试离开指定区域，返回 `'agent fence violation'`
- 不影响human玩家的移动自由

```typescript
// Electronic fence: check if agent is trying to leave the designated area
if (game && playerId) {
  const player = game.world.players.get(playerId);
  if (player && !player.human) {
    // This is an AI agent, check if position is within fence bounds
    const x = Math.floor(position.x);
    const y = Math.floor(position.y);
    
    if (x < AGENT_FENCE_BOUNDS.minX || x > AGENT_FENCE_BOUNDS.maxX || 
        y < AGENT_FENCE_BOUNDS.minY || y > AGENT_FENCE_BOUNDS.maxY) {
      return 'agent fence violation';
    }
  }
}
```

### 3. Agent初始位置约束
修改了 `convex/aiTown/player.ts` 中的 `Player.join` 方法：

- AI agent现在只能在围栏区域内生成
- Human玩家避开围栏区域生成，避免初始位置冲突
- 使用 `isAgent` 参数区分agent和human玩家

```typescript
if (isAgent) {
  // Generate position within agent fence bounds (tent area)
  candidate = {
    x: Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxX - AGENT_FENCE_BOUNDS.minX + 1)) + AGENT_FENCE_BOUNDS.minX,
    y: Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxY - AGENT_FENCE_BOUNDS.minY + 1)) + AGENT_FENCE_BOUNDS.minY,
  };
} else {
  // Human players can spawn anywhere on the map, but avoid the agent fence area
  do {
    candidate = {
      x: Math.floor(Math.random() * game.worldMap.width),
      y: Math.floor(Math.random() * game.worldMap.height),
    };
  } while (
    candidate.x >= AGENT_FENCE_BOUNDS.minX && 
    candidate.x <= AGENT_FENCE_BOUNDS.maxX && 
    candidate.y >= AGENT_FENCE_BOUNDS.minY && 
    candidate.y <= AGENT_FENCE_BOUNDS.maxY
  );
}
```

### 4. Agent创建流程更新
在 `convex/aiTown/agentInputs.ts` 中修改了 `createAgent` 输入处理器：

- 传递 `isAgent: true` 参数到 `Player.join` 方法
- 确保新创建的agent在围栏内生成

## 功能特性

### 电子围栏规则：
- ✅ AI agent只能在帐篷区域内移动
- ✅ Human玩家移动不受限制
- ✅ Agent无法走出围栏边界
- ✅ Agent路径寻找会自动避开围栏外区域
- ✅ Human玩家初始位置避开围栏区域

### 地图坐标系统：
- 地图大小：45x32瓦片
- 帐篷区域：x: 35-44, y: 0-14（右上角）
- 坐标原点：左上角 (0,0)
- 每个瓦片：32x32像素

## 测试方法

1. **启动项目**：
   ```bash
   npm run dev
   ```

2. **观察行为**：
   - AI agent应该只在右上角帐篷区域活动
   - Human玩家可以自由移动到地图任何地方
   - Agent之间的交互在帐篷区域内进行

3. **路径寻找测试**：
   - Agent尝试移动到围栏外时应该被阻止
   - Agent的路径寻找应该只在围栏内寻找路径

## 技术要点

- **无缝集成**：不影响现有游戏逻辑和性能
- **类型安全**：使用TypeScript类型检查确保参数正确传递
- **可配置**：通过常量配置围栏边界，便于调整
- **扩展性**：可以轻松为不同agent组设置不同的围栏区域

## 代码更改总结

1. `convex/constants.ts` - 添加围栏边界常量
2. `convex/aiTown/movement.ts` - 添加移动限制检查
3. `convex/aiTown/player.ts` - 修改初始位置生成逻辑
4. `convex/aiTown/agentInputs.ts` - 更新agent创建参数

现在所有AI agent都会被限制在帐篷区域内活动，就像有一个电子围栏一样！🎯