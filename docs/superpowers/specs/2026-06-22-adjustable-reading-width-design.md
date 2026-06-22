# 可拖拽 / 滚轮调节阅读宽度 — 设计文档

**日期**: 2026-06-22
**插件**: Notes to HTML Pages (read-along)
**目标**: 在导出的 HTML 阅读页上，让用户用鼠标**拖拽**或**滚轮**自定义正文列宽度，实现「宽页阅读」，并全局记住所选宽度。

---

## 背景

- 导出的 HTML 完全自包含，既在 Obsidian 内通过 `<iframe srcdoc>` 渲染（`main.ts:1937`），也能 standalone 在浏览器打开。
- 当前正文测量宽度 `720px` 硬编码在 4 处（`.article-hero`、`.article-hero h1`、`.table-of-contents`、`.article-body`），外层 `.page` 为 `860px`，副标题 `.article-deck` 为 `680px`。
- 页面已内联 TTS 播放器 JS，因此「把手 + 一小段脚本内联进模板」与现有模式一致。
- 关键事实：`srcdoc` iframe **继承父文档 `app://obsidian.md` 源**，因此其中的 `localStorage` 在 Obsidian 内跨所有导出页共享——正好满足「全局记住」。standalone `file://` 现代浏览器一般也可用，不可用时静默降级。

## 需求（已与用户确认）

1. 交互：鼠标**拖拽内容右边缘把手** + **在把手上滚轮**两种方式调节，居中不变。
2. 记忆：**全局**记住（所有导出页共用一个宽度值）。
3. 文字：平时**不显示**任何文字；鼠标悬停把手时用原生 tooltip 提示功能，按页面语言切换。
4. 始终开启，**不新增设置项**（YAGNI）。

## 设计

### 1. 用一个 CSS 变量统一驱动宽度

在 CSS 模板（`CLEAN_HTML_CSS`，约 `main.ts:2537` 起）引入变量并替换硬编码值：

```css
:root {
  --read-width: 720px;                                  /* 正文测量宽度，可被拖拽/滚轮改变 */
  --page-width: min(100%, calc(var(--read-width) + 140px)); /* 外层容器，保持 860-720=140 留白比例 */
}
.page { width: var(--page-width); }
.article-hero,
.article-hero h1,
.table-of-contents,
.article-body { max-width: var(--read-width); }
.article-deck { max-width: calc(var(--read-width) - 40px); }   /* 副标题略窄，沿用原比例 */
```

- 侧边浮动目录定位（`main.ts:3004`，`right: max(1.2rem, calc((100vw - 860px)/2 - 14.8rem))`）改用 `var(--page-width)` 替换 `860px`，宽页时跟着外移。
- TTS 播放器胶囊保持固定 `680px`（控件，非正文，不随宽度变化）。

### 2. 把手元素

- 在 `<main class="page">` 内注入一个把手元素（如 `<div class="width-handle" title="…">`），定位在正文列**右边缘**、垂直居中区域。
- 默认近乎透明 / 极淡；hover 时显现为一根细竖条（蓝色高亮，参考用户提供的第二张图），`cursor: ew-resize`。
- `title` 属性按页面 `lang` 切换：`zh` → "拖动或滚动调整宽度"，其它 → "Drag or scroll to adjust width"。无其它常驻文字。
- 视口过窄（`max-width: 780px` 移动端区，或视口 < 900px）时 `display: none`——插件本就 `isDesktopOnly`。

### 3. 交互逻辑（内联 JS）

共用一个 `applyWidth(px)`：clamp 到边界 → 写 `document.documentElement.style.setProperty('--read-width', px+'px')` → 持久化。

- **拖拽**：`pointerdown` 把手 → 记录起始 X 与起始宽度 → `pointermove` 时 `newWidth = startWidth + 2 * (clientX - startX)`（×2 保证对称居中）→ `pointerup` 结束并持久化。用 Pointer Events + `setPointerCapture`。
- **滚轮**：把手上 `wheel` 事件 → `delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY`（水平优先，竖直兜底）→ `newWidth = current ± step`，`step ≈ 40px`/格 → `e.preventDefault()` 防止页面滚动。

### 4. 边界与默认

- 默认 `--read-width = 720px`。
- 最小 `600px`；最大 `min(window.innerWidth - 64, 1400)px`（运行时按视口计算，clamp 时取用）。
- 拖拽 / 滚轮结果一律经 clamp。

### 5. 全局记忆

- 键：`notes-to-html-pages:read-width`。
- 初始化时 `try { localStorage.getItem(...) }`，有值则 `applyWidth`。
- 每次拖拽结束 / 滚轮调节后 `try { localStorage.setItem(...) } catch {}`。
- 整段 try/catch 包裹；不可用时仅本次会话生效，不报错。

### 6. 落点 / 自包含

- CSS 改动写入 `CLEAN_HTML_CSS` 模板字符串。
- 把手 HTML + 初始化脚本随页面模板（`main.ts:711` 一带的 `<main>` 拼装处）注入，与 TTS 脚本同级内联。
- 不拆分 `src/main.ts`，不引入新依赖或抽象层。

## 边界情况

- **旧导出页**：CSS/JS 改动只对**新导出**页面生效；已导出 HTML 需重新导出才有此功能。
- **standalone `file://` 下 localStorage 不可用**：静默降级，宽度仅本次生效。
- **极窄视口**：把手隐藏，宽度退回响应式 100%（移动端媒体查询照常工作）。
- **滚轮与正文滚动冲突**：仅在把手元素上 `preventDefault`，正文区域滚轮行为不变。

## 不做（YAGNI）

- 不加设置开关（始终开启）。
- 不做按文档分别记忆。
- 不加预设档位按钮。
- 不加常驻宽度数值显示。

## 影响文件

- `src/main.ts`：CSS 模板（宽度变量化 + 把手样式 + 侧边目录定位）、页面模板（注入把手 + 初始化脚本）。仅此一个源文件。
- 构建后 `main.js` 重新生成提交。
