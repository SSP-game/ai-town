# Cabbit 角色命名规则详解

## 📝 命名模式

Cabbit 角色文件使用系统化的命名规则来描述角色的各种属性：

### 基本格式

```
type-[ageGroup]-gender-variant-skinTone-[hairColor|style|color]
```

**注意**: `[]` 中的部分是可选的

## 🔍 命名组件详解

### 1. Type（类型）- 必需

角色的职业、身份或类别：

| 类型 | 说明 | 示例 |
|------|------|------|
| `aristocrate` | 贵族 | aristocrate-f-001-brown |
| `fighter` | 战士 | fighter-m-002-black |
| `mage` | 法师 | mage-f-001-light |
| `cleric` | 牧师/治疗师 | cleric-m-001-brown |
| `ranger` | 游侠/弓箭手 | ranger-f-001-light |
| `townfolk` | 城镇居民 | townfolk-adult-f-003-light |
| `bard` | 吟游诗人 | bard-001-brown |
| `dancer` | 舞者 | dancer-f-001-brown |
| `cultist` | 邪教徒 | cultist-001-blue |
| `clown` | 小丑 | clown-m-001-light |
| `king` | 国王 | king-001-light |
| `queen` | 女王 | queen-001-light |
| `prince` | 王子 | prince-001-light |
| `princess` | 公主 | princess-001-light |
| `pirate` | 海盗 | pirate-f-001-light |
| 命名角色 | 特定角色名 | Lyuba, Angela, Nathan 等 |

**您的资源中有 33 种不同的类型！**

### 2. Age Group（年龄组）- 可选

角色的年龄类别：

| 值 | 说明 | 示例 |
|----|------|------|
| `adult` | 成年人 | townfolk-**adult**-f-003-light |
| `child` | 儿童 | townfolk-**child**-m-001-brown |
| `old` | 老年人 | aristocrate-f-001-light-**old** |

**注意**: 如果没有指定，默认为成年人

### 3. Gender（性别）- 通常必需

| 值 | 说明 | 符号 |
|----|------|------|
| `f` | 女性 (female) | ♀ |
| `m` | 男性 (male) | ♂ |
| *(无)* | 性别中性/未指定 | ? |

**示例**:
- `fighter-`**`f`**`-001-black` - 女战士
- `mage-`**`m`**`-001-light` - 男法师

### 4. Variant（变体编号）- 必需

同类型角色的序号，通常是三位数字：

| 值 | 说明 |
|----|------|
| `001` | 第一个变体 |
| `002` | 第二个变体 |
| `003` | 第三个变体 |

**示例**: `fighter-f-`**`001`**`-black`, `fighter-f-`**`002`**`-black`

### 5. Skin Tone（肤色）- 通常必需

角色的皮肤颜色：

| 值 | 说明 | 数量 |
|----|------|------|
| `light` | 浅色皮肤 | 78 |
| `brown` | 棕色皮肤 | 50 |
| `black` | 深色皮肤 | 23 |
| `dark` | 暗色 | 0 |
| `pale` | 苍白 | 0 |

**示例**:
- `fighter-f-001-`**`light`** - 浅肤色
- `fighter-f-001-`**`brown`** - 棕肤色
- `fighter-f-001-`**`black`** - 深肤色

### 6. Hair Color（发色）- 可选

角色的头发颜色：

| 值 | 说明 | 示例 |
|----|------|------|
| `blonde` | 金发 | aristocrate-f-001-brown-**blonde** |
| `brunette` | 深棕色/黑色头发 | aristocrate-f-001-brown-**brunette** |
| `redhead` | 红发 | (如果有) |
| `white` | 白发 | (老年角色) |
| `gray` | 灰发 | (老年角色) |

**重要**: 只有少数角色明确标注了发色！

### 7. Style（风格）- 可选

角色的替代风格或变体：

| 值 | 说明 | 示例 |
|----|------|------|
| `alt` | 替代风格 (alternative) | townfolk-adult-f-003-**alt**-light |

**说明**: "alt" 通常表示同一角色的不同服装或外观变体

### 8. Color（颜色）- 可选

服装或装备的颜色：

| 值 | 说明 | 示例 |
|----|------|------|
| `blue` | 蓝色 | cultist-001-**blue** |
| `red` | 红色 | cultist-001-**red** |
| `green` | 绿色 | (如果有) |
| `purple` | 紫色 | (如果有) |

**用途**: 通常用于长袍、斗篷等装备颜色

## 📋 完整示例解析

### 示例 1: `aristocrate-f-001-brown-blonde`

```
aristocrate  → 类型: 贵族
f            → 性别: 女性 ♀
001          → 变体: 第一个
brown        → 肤色: 棕色
blonde       → 发色: 金发
```

**翻译**: 金发棕肤的女贵族（第一个变体）

---

### 示例 2: `townfolk-adult-f-003-alt-light`

```
townfolk     → 类型: 城镇居民
adult        → 年龄: 成年人
f            → 性别: 女性 ♀
003          → 变体: 第三个
alt          → 风格: 替代风格
light        → 肤色: 浅色
```

**翻译**: 浅肤色的成年女性城镇居民（第三个变体，替代风格）

---

### 示例 3: `fighter-m-002-black`

```
fighter      → 类型: 战士
m            → 性别: 男性 ♂
002          → 变体: 第二个
black        → 肤色: 深色
```

**翻译**: 深肤色的男战士（第二个变体）

---

### 示例 4: `aristocrate-f-001-light-old`

```
aristocrate  → 类型: 贵族
f            → 性别: 女性 ♀
001          → 变体: 第一个
light        → 肤色: 浅色
old          → 年龄: 老年人
```

**翻译**: 浅肤色的老年女贵族

---

### 示例 5: `cultist-001-blue`

```
cultist      → 类型: 邪教徒
001          → 变体: 第一个
blue         → 颜色: 蓝色长袍
```

**翻译**: 穿蓝色长袍的邪教徒（第一个变体）

## 🎯 使用查询工具

### 按属性查询

```bash
# 查找所有浅肤色角色
node query_characters_enhanced.mjs skin light

# 查找所有成年角色
node query_characters_enhanced.mjs age adult

# 查找所有女性战士
node query_characters_enhanced.mjs list fighter

# 获取随机的浅肤色女法师
node query_characters_enhanced.mjs random type=mage gender=f skin=light

# 查看特定角色的详细信息
node query_characters_enhanced.mjs info aristocrate-f-001-brown-blonde
```

## 📊 您的资源统计

根据最新的映射文件：

### 按性别分布
- 女性 (♀): **53**
- 男性 (♂): **61**
- 性别中性: **69**

### 按肤色分布
- 浅肤色 (light): **78** ⭐ 最多
- 棕肤色 (brown): **50**
- 深肤色 (black): **23**

### 按年龄分布
- 成年人 (adult): **44**
- 儿童 (child): **15**
- 老年人 (old): **1**
- 未指定: **123**

### 按类型分布（前10）
1. townfolk (城镇居民): **74** ⭐ 最多
2. aristocrate (贵族): **14**
3. fighter (战士): **12**
4. Lyuba (角色名): **7**
5. cleric (牧师): **6**
6. mage (法师): **6**
7. ranger (游侠): **6**
8. Yan (角色名): **6**
9. Amanda (角色名): **4**
10. Santa (圣诞老人): **4**

## 💡 选择角色建议

### 如果您想要...

**多样化的普通NPC**:
```bash
# 选择城镇居民
node query_characters_enhanced.mjs list townfolk
```

**不同肤色的战士**:
```bash
# 浅肤色女战士
node query_characters_enhanced.mjs random type=fighter gender=f skin=light

# 深肤色男战士
node query_characters_enhanced.mjs random type=fighter gender=m skin=black
```

**有情感表情的角色**:
```bash
# 查看所有有情感变化的角色
node query_characters_enhanced.mjs stats
# 查找 "With emotions: 16"
```

**特定年龄的角色**:
```bash
# 成年角色
node query_characters_enhanced.mjs age adult

# 儿童角色
node query_characters_enhanced.mjs age child
```

## 🔄 命名模式的优势

1. **系统化**: 一眼就能看出角色的属性
2. **可筛选**: 可以按任何属性快速筛选
3. **可扩展**: 易于添加新的变体
4. **描述性**: 文件名即角色描述

## 📚 相关文件

- **映射文件**: `/public/assets/cabbit-0.5/character-mapping.json`
- **查询工具**: `query_characters_enhanced.mjs`
- **生成脚本**: `generate_enhanced_mapping.mjs`

---

**创建时间**: 2025-11-01
**总角色数**: 183
**支持尺寸**: 24x32, 48x64_scale2x
