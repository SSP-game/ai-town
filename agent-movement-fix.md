# 修复Agent静止问题

## 问题诊断
AI agent在实现电子围栏后完全静止不动，主要原因有两个：

### 1. 围栏边界超出地图范围
- 地图尺寸：45×32瓦片（索引0-44, 0-31）
- 原围栏配置：`maxX: 56, maxY: 17`
- 问题：`maxX: 56`超出了地图宽度45（最大索引44）
- 结果：电子围栏检查阻止所有agent移动

### 2. Agent移动目标生成错误
- `wanderDestination()`函数在整张地图上生成随机目标
- agent尝试移动到围栏外区域时被电子围栏阻止
- 结果：agent找不到有效的移动目标，导致静止

## 修复方案

### 1. 修正围栏边界 (`convex/constants.ts`)
```typescript
export const AGENT_FENCE_BOUNDS = {
  // 必须在地图尺寸范围内：45x32瓦片（索引0-44, 0-31）
  minX: 32,
  maxX: 44,  // 在地图宽度内（最大索引44）
  minY: 0,
  maxY: 16,  // 在地图高度内（最大索引31）
};
```

### 2. 修改Agent移动目标生成 (`convex/aiTown/agentOperations.ts`)
```typescript
function wanderDestination(worldMap: WorldMap) {
  // 在agent围栏边界内生成移动目标
  return {
    x: Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxX - AGENT_FENCE_BOUNDS.minX + 1)) + AGENT_FENCE_BOUNDS.minX,
    y: Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxY - AGENT_FENCE_BOUNDS.minY + 1)) + AGENT_FENCE_BOUNDS.minY,
  };
}
```

## 修复效果

### ✅ Agent恢复移动
- Agent现在只在围栏内生成移动目标
- 所有移动路径都在允许范围内
- 电子围栏检查不再阻止正常移动

### ✅ 围栏可视化同步
- 前端地图显示新的围栏边界
- 围栏区域在地图范围内正确显示
- 坐标显示与实际配置一致

### ✅ 保持约束功能
- Agent仍然无法越出围栏边界
- Human玩家移动不受影响
- 电子围栏功能完全正常

## 技术细节

### 地图坐标系
```
地图尺寸: 45×32瓦片
有效坐标: x: 0-44, y: 0-31
围栏区域: x: 32-44, y: 0-16
围栏大小: 13×17瓦片
```

### Agent行为流程
```
1. Agent决定要移动 → 
2. 调用wanderDestination() → 
3. 在围栏内生成目标 → 
4. 路径寻找算法 → 
5. 电子围栏检查通过 → 
6. Agent开始移动
```

## 验证方法

### 1. 检查围栏显示
- 启动 `npm run dev`
- 确认红色围栏显示在右上角
- 警告条显示坐标：`x: 32-44, y: 0-16`

### 2. 观察Agent行为
- Agent应该在围栏内随机走动
- Agent不会试图离开围栏区域
- Agent之间应该能正常交互

### 3. 测试Human玩家
- Human玩家应该能自由移动到地图任何地方
- Human玩家可以穿过围栏区域
- 不影响其他游戏功能

## 故障排除

如果Agent仍然静止：

1. **检查控制台错误**：
   ```bash
   # 查看Convex日志
   npx convex dev --tail-logs
   ```

2. **验证围栏配置**：
   - 确认 `constants.ts` 中的边界值正确
   - 确认前端获取的配置一致

3. **重启游戏引擎**：
   ```bash
   npx convex run testing:stop
   npx convex run testing:resume
   ```

4. **重新初始化Agent**：
   ```bash
   npx convex run testing:wipeAllTables
   npx convex run init
   ```

## 注意事项

- **围栏边界必须**在地图尺寸范围内
- **坐标是0-based索引**，所以最大值要减1
- **所有agent移动**现在都会在围栏内生成目标
- **前端可视化**会自动同步后端配置

现在Agent应该能正常在电子围栏内活动了！🚀