# 电子围栏配置同步修复

## 问题描述
之前前端组件（`AgentFence.tsx`）中硬编码了电子围栏的边界值，导致修改 `convex/constants.ts` 中的配置后，地图上的可视化标识不会相应改变。

## 修复方案
将前端的电子围栏组件改为从后端动态获取配置，确保前后端配置同步。

## 具体修改

### 1. 后端API添加 (`convex/world.ts`)
在 `world.ts` 中添加了新的查询函数来向前端提供配置：

```typescript
export const getConstants = query({
  args: {},
  handler: async () => {
    return {
      AGENT_FENCE_BOUNDS,
    };
  },
});
```

### 2. 前端组件重构 (`src/components/AgentFence.tsx`)
移除硬编码的边界值，改为从后端获取：

```typescript
// 从后端获取电子围栏配置
const constants = useQuery(api.world.getConstants);

// 如果还没加载完配置，不渲染
if (!constants) {
  return null;
}

const { AGENT_FENCE_BOUNDS } = constants;
```

## 修复效果

### ✅ 配置同步
- 修改 `convex/constants.ts` 中的 `AGENT_FENCE_BOUNDS` 值
- 前端地图上的可视化围栏会自动更新
- 警告标签也会显示新的坐标范围

### ✅ 实时更新
- 无需重启前端服务器
- Convex会自动同步配置变更
- 页面刷新或重新连接后应用新配置

### ✅ 类型安全
- 保持TypeScript类型检查
- 前后端使用相同的类型定义
- 编译时检查配置一致性

## 使用方法

### 修改电子围栏配置：
1. 打开 `convex/constants.ts`
2. 修改 `AGENT_FENCE_BOUNDS` 的值：
   ```typescript
   export const AGENT_FENCE_BOUNDS = {
     minX: 34,    // 修改这里
     maxX: 50,    // 修改这里
     minY: 0,
     maxY: 17,    // 修改这里
   };
   ```
3. 保存文件
4. 刷新前端页面或等待Convex同步

### 验证配置生效：
- 地图上红色围栏区域应该显示新的边界
- 顶部警告条应该显示新的坐标范围
- AI agent应该被限制在新的区域内

## 技术细节

### 数据流：
```
convex/constants.ts → convex/world.ts → 前端useQuery → AgentFence组件
```

### 响应性：
- 使用Convex的响应式查询
- 配置变更自动推送到前端
- 组件自动重新渲染

### 错误处理：
- 配置未加载完成时不渲染组件
- 避免显示错误的围栏边界

## 测试验证

### 1. 修改配置测试
```typescript
// 在 convex/constants.ts 中修改为
export const AGENT_FENCE_BOUNDS = {
  minX: 30,  // 减小 minX
  maxX: 40,  // 减小 maxX  
  minY: 2,   // 增加 minY
  maxY: 12,  // 减小 maxY
};
```

### 2. 验证结果
- 围栏应该变小并向下移动
- 警告条显示 `x: 30-40, y: 2-12`
- Agent应该在更小的区域内活动

### 3. 恢复测试
```typescript
// 恢复到你的自定义值
export const AGENT_FENCE_BOUNDS = {
  minX: 34,
  maxX: 50,
  minY: 0,
  maxY: 17,
};
```

## 注意事项

1. **编译要求**：修改后端配置需要重新编译，但前端会自动获取更新
2. **缓存处理**：Convex会自动处理配置缓存和同步
3. **调试模式**：只有在 `VITE_SHOW_DEBUG_UI=true` 时才显示围栏
4. **性能影响**：配置查询非常轻量，对性能影响可忽略

现在你可以放心地修改 `constants.ts` 中的电子围栏配置，地图上的可视化会实时同步更新！🎯