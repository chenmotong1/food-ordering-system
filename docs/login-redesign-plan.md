# 登录页面动画角色重设计 - 计划书

**日期**: 2026-04-16
**参考项目**: a97242689/animated-characters-login-page
**目标页面**: https://careercompassai.vercel.app/login

## 一、目标

将点餐系统（美味1165）登录页改造为带4个彩色动画角色的交互式登录页。

## 二、技术方案

| 项目 | 方案 |
|------|------|
| 框架 | Next.js 16 + React 19（现有） |
| 样式 | CSS-in-JSX 内联样式 + globals.css 关键帧动画 |
| 动画 | CSS keyframes + requestAnimationFrame 鼠标节流 |
| 布局 | 左右分栏 grid（桌面）/ 仅表单（移动端） |
| 角色渲染 | 纯 CSS div（无图片依赖） |

## 三、文件结构

```
src/
├── components/login/
│   ├── AnimatedCharacters.tsx   # 主容器：4角色 + 鼠标追踪 + 交互状态
│   ├── EyeBall.tsx              # 带白色眼白的眼球组件
│   └── Pupil.tsx                # 纯色瞳孔组件（无眼白）
├── app/
│   └── login/
│       └── page.tsx             # 重写的登录页（左右分栏布局）
└── app/globals.css              # 已添加入场动画+纸屑动画关键帧
```

## 四、实施步骤

### Step 1：创建 EyeBall.tsx
- 白色眼白 + 黑色瞳孔
- 鼠标跟随（getBoundingClientRect + atan2）
- forceLook 覆盖（输入交互）
- 眨眼效果（高度坍缩2px）
- 悲伤效果（半高+旋转+底部圆角）
- rAF 节流鼠标事件

### Step 2：创建 Pupil.tsx
- 纯色圆形瞳孔（无眼白）
- 鼠标跟随逻辑
- forceLook 和眨眼支持

### Step 3：创建 AnimatedCharacters.tsx
- 4个角色：紫(180x400,#6C3FF5)/黑(120x310,#2D2D2D)/橙(240x150,#FF9B6B)/黄(140x230,#E8D754)
- Props: isTyping/showPassword/passwordLength/loginFailed/loginSuccess
- 交互：输入互视/密码隐藏/密码偷看/悲伤/庆祝纸屑
- 随机眨眼（3-7s间隔）
- 入场动画

### Step 4：重写 login/page.tsx
- 左右分栏 grid 布局
- 左侧：暖色渐变 + logo + 动画角色 + 装饰
- 右侧：登录/注册表单（保留现有功能）
- 响应式：<1024px 隐藏左侧
- 密码可见/隐藏切换按钮

### Step 5：验证
- next build 构建验证
- TypeScript 类型检查
- 响应式测试

## 五、配色适配

| 元素 | 原参考色 | 点餐系统色 |
|------|----------|------------|
| 左侧背景 | 灰色渐变 | KFC红暖色渐变 |
| 角色 | 紫/黑/橙/黄 | 保持不变 |
| 表单按钮 | 蓝色 | #e4002b 红色 |
| 装饰光晕 | 蓝色 | 暖色 |

## 六、注意事项
1. 鼠标事件 rAF 节流避免卡顿
2. 组件 "use client"，SSR 安全
3. 移动端隐藏角色区
4. 角色加 aria-hidden="true"
5. 每步保存 + 日志记录
