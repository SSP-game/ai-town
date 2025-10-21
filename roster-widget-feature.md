# 角色列表面板收拉功能测试

## 功能描述
为地图左上角的角色列表面板添加了点击收拉功能。

## 修改内容

### 文件: `src/components/MapRosterWidget.tsx`

1. **导入useState hook**: 添加了 `useState` 来管理收拉状态
2. **添加状态管理**: 使用 `isCollapsed` 状态控制面板展开/收起
3. **修改标题栏**: 将标题改为可点击的交互区域，添加悬停效果和箭头指示器
4. **条件渲染**: 当 `isCollapsed` 为 `true` 时隐藏角色列表内容
5. **动画效果**: 添加了平滑的展开/收起动画

## 新增功能特性

- **点击切换**: 点击标题栏 "On the Map · N" 区域可以切换展开/收起状态
- **视觉指示器**: 右侧箭头符号 (▼/▶) 显示当前状态
- **悬停效果**: 鼠标悬停时标题颜色变亮，提供交互反馈
- **平滑动画**: 使用 Tailwind 的 `animate-in` 类实现平滑的展开/收起效果
- **响应式设计**: 保持原有的响应式布局和样式

## 使用方法
1. 运行 `npm run dev` 启动开发服务器
2. 在游戏界面左上角找到角色列表面板
3. 点击标题栏区域即可收拉面板

## 技术实现细节

```tsx
// 状态管理
const [isCollapsed, setIsCollapsed] = useState(false);

// 可点击的标题栏
<div 
  className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70 cursor-pointer hover:text-white/90 transition-colors"
  onClick={() => setIsCollapsed(!isCollapsed)}
>
  <span>On the Map · {entries.length}</span>
  <span className="text-lg">{isCollapsed ? '▶' : '▼'}</span>
</div>

// 条件渲染的角色列表
{!isCollapsed && (
  <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1 duration-200">
    {/* 角色列表内容 */}
  </div>
)}
```

修改已完成并通过编译测试。功能现在可以通过点击标题栏来收拉角色列表面板。