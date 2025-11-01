# AI Town 精灵图尺寸对比和选择指南

## 📏 当前游戏使用的尺寸

AI Town 目前使用 **32x32 像素** 的精灵图：
- 文件：`assets/32x32folk.png`
- 配置：`data/spritesheets/f1.ts` 等
- 每个角色有 4 个方向（上下左右）× 3 帧动画 = 12 帧

## 🎨 Cabbit 资源包可用尺寸

您有 **3种不同尺寸** 的 Cabbit 资源：

### 1. 📦 24x32 像素 (最接近！)

**优点：**
- ✅ **最接近当前32x32格式** - 宽度相同，高度接近
- ✅ 只需轻微调整即可使用
- ✅ 保持像素风格
- ✅ 文件大小适中
- ✅ 性能好

**缺点：**
- ⚠️ 高度32vs32相同，但宽度24vs32稍窄
- ⚠️ 可能需要居中对齐或填充

**数量：**
- People: 148 个
- Characters: 34 个
- **总计：182 个**

**路径：**
```
/public/assets/cabbit-0.5/sprite/people/PNG/24x32/
/public/assets/cabbit-0.5/sprite/character/PNG/24x32/
```

---

### 2. 📦 48x64 像素（2x缩放）

**优点：**
- ✅ 高分辨率，细节丰富
- ✅ 适合高清显示
- ✅ 视觉质量最好

**缺点：**
- ❌ 需要缩小50%才能匹配32x32
- ❌ 缩放可能导致像素失真
- ❌ 文件更大，性能影响
- ❌ 与现有32x32角色风格不一致

**数量：**
- People: 148 个
- Characters: 32 个
- **总计：180 个**

**路径：**
```
/public/assets/cabbit-0.5/sprite/people/PNG/48x64_scale2x/
/public/assets/cabbit-0.5/sprite/character/PNG/48x64_scale2x/
```

---

### 3. 📦 32x32 像素（当前使用）

**优点：**
- ✅ 完美匹配现有格式
- ✅ 无需调整
- ✅ 性能最优

**缺点：**
- ⚠️ 目前只有原始的8个角色（f1-f8）

**数量：**
- 当前：8 个（f1-f8）

**路径：**
```
/public/assets/32x32folk.png
```

---

## 🎯 推荐方案

### 方案 A：使用 24x32 素材（推荐！）⭐

**为什么推荐：**
1. ✅ 最接近当前32x32格式
2. ✅ 有182个角色可选
3. ✅ 调整简单（只需处理宽度差异）
4. ✅ 保持像素艺术风格
5. ✅ 性能良好

**如何处理24x32到32x32：**

#### 选项1：居中放置（推荐）
```
原始：24x32
调整：32x32（左右各填充4像素透明背景）

[  4px  ][  24px角色  ][  4px  ]
   透明    原始精灵      透明
```

#### 选项2：拉伸宽度
```
原始：24x32
调整：32x32（宽度拉伸33%）
可能轻微变形，但在像素游戏中通常不明显
```

#### 选项3：修改游戏支持24x32
```
游戏本身支持不同宽度的精灵
只需调整渲染逻辑
```

---

### 方案 B：使用 48x64 素材

**适合场景：**
- 计划重制为高清版本
- 准备支持多分辨率
- 不介意重新设计所有角色

**缺点：**
- 需要大量调整工作
- 与现有8个32x32角色风格不一致
- 可能需要重做所有现有角色

---

## 🔧 尺寸的实际影响

### 1. 显示效果

| 尺寸 | 细节程度 | 像素风格 | 与现有角色一致性 |
|------|---------|----------|-----------------|
| 24x32 | 中等 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ 高 |
| 32x32 | 中等 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ 完美 |
| 48x64 | 高 | ⭐⭐⭐ | ⭐⭐ 低 |

### 2. 性能影响

```
24x32 = 768 像素/帧   ✅ 轻量
32x32 = 1024 像素/帧  ✅ 标准
48x64 = 3072 像素/帧  ⚠️ 3倍大小
```

### 3. 内存占用

假设一个角色有12帧动画（4方向 × 3帧）：

```
24x32: 768 × 12 = 9,216 像素
32x32: 1024 × 12 = 12,288 像素
48x64: 3072 × 12 = 36,864 像素 (3倍！)
```

### 4. 碰撞检测

```
24x32: 碰撞盒稍窄，可能更精确
32x32: 标准碰撞盒
48x64: 需要缩放碰撞盒，可能不够精确
```

---

## 💡 实际建议

### 对于您的项目，我强烈推荐使用 24x32 素材：

**理由：**

1. **最小工作量**
   - 24宽度 vs 32宽度只差8像素
   - 高度完全相同（32）
   - 只需简单的居中对齐

2. **最大角色数量**
   - 182个角色（vs 48x64的180个）
   - 包含所有相同角色

3. **性能优化**
   - 文件大小适中
   - 内存占用合理
   - 渲染效率高

4. **视觉一致性**
   - 与现有32x32角色风格接近
   - 像素艺术风格保持一致

---

## 🛠️ 如何转换 24x32 到 32x32

### 方法1：使用 ImageMagick（居中填充）

```bash
# 单个文件
convert input-24x32.png -background transparent -gravity center -extent 32x32 output-32x32.png

# 批量转换
for file in *.png; do
  convert "$file" -background transparent -gravity center -extent 32x32 "../32x32/$file"
done
```

### 方法2：使用 Python + Pillow

```python
from PIL import Image
import os

def convert_24x32_to_32x32(input_path, output_path):
    img = Image.open(input_path)

    # 创建32x32透明画布
    new_img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))

    # 将24x32图像居中粘贴（左右各4像素边距）
    new_img.paste(img, (4, 0))

    new_img.save(output_path)

# 批量处理
input_dir = 'cabbit-0.5/sprite/people/PNG/24x32/'
output_dir = 'converted/32x32/'

for filename in os.listdir(input_dir):
    if filename.endswith('.png'):
        convert_24x32_to_32x32(
            os.path.join(input_dir, filename),
            os.path.join(output_dir, filename)
        )
```

### 方法3：修改游戏渲染（无需转换）

如果您愿意修改游戏代码，可以直接支持24x32：

```typescript
// 在渲染时调整位置
const sprite = {
  width: 24,  // 不是32
  height: 32,
  offsetX: 4  // 居中偏移
};

// 渲染时
renderSprite(x + sprite.offsetX, y, sprite);
```

---

## 📊 尺寸选择决策树

```
需要添加更多角色？
    ├─ 是 → 想要高清画质？
    │       ├─ 是 → 使用 48x64（需大量工作）
    │       └─ 否 → 使用 24x32 ⭐ 推荐！
    │
    └─ 否 → 保持现有 32x32 即可
```

---

## 🎬 下一步行动

### 如果选择 24x32（推荐）：

1. ✅ 使用 `query_characters.mjs` 选择角色
2. ✅ 使用 ImageMagick 或 Python 批量转换
3. ✅ 创建 spritesheet 配置文件
4. ✅ 测试渲染效果

### 示例命令：

```bash
# 选择角色
node query_characters.mjs random mage f

# 转换单个角色
convert cabbit-0.5/sprite/people/PNG/24x32/mage-f-001-light.png \
  -background transparent -gravity center -extent 32x32 \
  assets/mage-f-light-32x32.png
```

---

## 总结

| 特性 | 24x32 | 32x32 | 48x64 |
|-----|-------|-------|-------|
| 可用角色数 | 182 | 8 | 180 |
| 转换难度 | ⭐ 简单 | - | ⭐⭐⭐⭐ 困难 |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 视觉一致性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

**最终建议：使用 24x32 素材并转换为 32x32！** 🎯
