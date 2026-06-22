# 可拖拽 / 滚轮调节阅读宽度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让导出的 HTML 阅读页支持用鼠标拖拽内容右边缘把手、或在把手上滚轮，自定义正文列宽度（宽页阅读），并全局记住所选宽度。

**Architecture:** 全部改动集中在单一源文件 `src/main.ts`：(1) 把硬编码的正文宽度 `720px/860px` 收敛到一个 `--read-width` CSS 变量；(2) 在页面模板注入一个右边缘把手元素 + 一段内联初始化脚本（与现有 TTS 内联脚本同模式）；(3) 脚本用 Pointer Events + wheel 调节 `--read-width`，并经 `localStorage` 全局持久化。导出 HTML 保持完全自包含。

**Tech Stack:** TypeScript (ES2018, strictNullChecks), esbuild, 内联 CSS/JS。无测试框架——每个任务的反馈环是 `npm run build`（tsc 类型检查 + esbuild 打包）成功 + 脚本化手动验证。

---

## 重要约定（每个任务都适用）

- 缩进用 **Tab**（与文件一致）。CSS 模板字符串内的行同样是 Tab 缩进。
- 语法目标 **ES2018**，内联 JS 不要用更高版本特性。
- 每个修改源码的任务，结尾都跑 `npm run build`，然后把 `src/main.ts` 和重新生成的 `main.js` 一起提交（仓库直接加载 `main.js`）。
- 手动验证统一流程：在 Obsidian 里对任意一篇含若干段落的笔记执行导出命令，打开生成的 `.html`（在 Obsidian 内查看），按各任务的「Expected」核对。

---

## File Structure

只改一个源文件：

- **Modify** `src/main.ts`
  - CSS 模板 `CLEAN_HTML_CSS`（`:root` 变量、`.page`、`.article-hero`、`h1`、`.article-deck`、`.table-of-contents`、`.article-body`、`.side-table-of-contents`、新增 `.width-handle` 样式）。
  - 页面模板拼装处（`exportFile` 的 `return { html: [...] }`，约 `main.ts:697-718`）注入把手元素 + 脚本标签。
  - 模块级新增常量 `WIDTH_ADJUST_JS`（紧邻 `TTS_PLAYER_JS`，约 `main.ts:3374`）。
- **Rebuild** `main.js`（构建产物，提交）。

---

## Task 1: 把宽度收敛到 `--read-width` CSS 变量（视觉默认不变）

**Files:**
- Modify: `src/main.ts`（CSS 模板多处，见下）

- [ ] **Step 1: 在 `:root {` 里新增两个宽度变量**

定位 `:root {`（约 `main.ts:2466`），把：

```css
:root {
	color-scheme: light dark;
	--page-bg: #f4f5f6;
```

改为：

```css
:root {
	color-scheme: light dark;
	--read-width: 720px;
	--page-width: min(100%, calc(var(--read-width) + 140px));
	--page-bg: #f4f5f6;
```

- [ ] **Step 2: `.page` 用变量驱动宽度，并设为定位上下文**

定位 `.page {`（约 `main.ts:2537`），把：

```css
.page {
	width: min(100%, 860px);
	margin: 0 auto;
	padding: 2.8rem 1.6rem 5rem;
}
```

改为：

```css
.page {
	position: relative;
	width: var(--page-width);
	margin: 0 auto;
	padding: 2.8rem 1.6rem 5rem;
}
```

- [ ] **Step 3: `.article-hero` 的 `max-width` 改用变量**

定位 `.article-hero {`（约 `main.ts:2543`）块内的 `max-width: 720px;`，改为 `max-width: var(--read-width);`。上下文：

```css
.article-hero {
	width: 100%;
	max-width: var(--read-width);
	margin: 0 auto 2.4rem;
```

- [ ] **Step 4: `.article-hero h1` 的 `max-width` 改用变量**

定位 `.article-hero h1 {`（约 `main.ts:2553`）块内首行 `max-width: 720px;`，改为：

```css
.article-hero h1 {
	max-width: var(--read-width);
	margin: 0 auto;
```

- [ ] **Step 5: `.article-deck` 的 `max-width` 改用变量（略窄 40px）**

定位 `.article-deck {`（约 `main.ts:2568`）块内 `max-width: 680px;`，改为：

```css
.article-deck {
	max-width: calc(var(--read-width) - 40px);
	margin: 0.95rem auto 0;
```

- [ ] **Step 6: `.table-of-contents` 的 `max-width` 改用变量**

定位 `.table-of-contents {`（约 `main.ts:2593`）块内首行 `max-width: 720px;`，改为：

```css
.table-of-contents {
	max-width: var(--read-width);
	margin: 0 auto 3.2rem;
```

- [ ] **Step 7: `.article-body` 的 `max-width` 改用变量**

定位 `.article-body {`（约 `main.ts:2724`）块内 `max-width: 720px;`，改为：

```css
.article-body {
	counter-reset: section;
	width: 100%;
	max-width: var(--read-width);
	margin: 0 auto;
	font-size: 1rem;
}
```

- [ ] **Step 8: 侧边浮动目录定位改用 `--page-width`**

定位 `.side-table-of-contents`（约 `main.ts:3004`，在 `min-width` 媒体查询里）的：

```css
		right: max(1.2rem, calc((100vw - 860px) / 2 - 14.8rem));
```

改为：

```css
		right: max(1.2rem, calc((100vw - var(--page-width)) / 2 - 14.8rem));
```

- [ ] **Step 9: 构建并验证默认外观不变**

Run: `npm run build`
Expected: 构建成功，无 tsc 报错，`main.js` 重新生成。

手动验证：导出任意笔记并在 Obsidian 内打开。
Expected: 页面观感与改动前**完全一致**（正文列仍约 720px 宽、外层约 860px、副标题略窄、侧边目录位置不变）。此步只是把常量换成变量，视觉应零变化。

- [ ] **Step 10: 提交**

```bash
git add src/main.ts main.js
git commit -m "refactor: drive reading width via --read-width CSS variable"
```

---

## Task 2: 注入右边缘把手元素 + 把手样式（默认隐形，hover 显现）

**Files:**
- Modify: `src/main.ts`（CSS 模板新增 `.width-handle`；页面模板注入元素）

- [ ] **Step 1: 在页面模板的 `<main>` 内注入把手元素**

定位 `exportFile` 的返回拼装（约 `main.ts:711`）：

```ts
			`<main class="page${ttsPlayerHtml ? " has-tts-player" : ""}">`,
			body,
			"</main>",
			ttsPlayerHtml,
			ttsScript,
```

在 `body,` 之后、`"</main>",` 之前插入一行（`documentLanguage` 已在同函数约 `main.ts:626` 定义，可直接使用）：

```ts
			`<main class="page${ttsPlayerHtml ? " has-tts-player" : ""}">`,
			body,
			`<div class="width-handle" title="${documentLanguage === "zh" ? "拖动或滚动调整宽度" : "Drag or scroll to adjust width"}" aria-hidden="true"></div>`,
			"</main>",
			ttsPlayerHtml,
			ttsScript,
```

- [ ] **Step 2: 新增 `.width-handle` 样式**

在 CSS 模板里 `.article-body {` 规则之前（约 `main.ts:2724` 上方，任意稳定位置即可，建议紧接 `.page` 相关规则之后）插入：

```css
.width-handle {
	position: absolute;
	top: 0;
	right: 0;
	width: 1.1rem;
	height: 100%;
	cursor: ew-resize;
	touch-action: none;
	z-index: 50;
}

.width-handle::before {
	content: "";
	position: absolute;
	top: 50%;
	right: 0.4rem;
	width: 3px;
	height: 2.4rem;
	margin-top: -1.2rem;
	border-radius: 999px;
	background: var(--accent);
	opacity: 0;
	transition: opacity 0.18s ease;
}

.width-handle:hover::before {
	opacity: 0.7;
}

@media (max-width: 900px) {
	.width-handle {
		display: none;
	}
}
```

- [ ] **Step 3: 构建并验证把手出现**

Run: `npm run build`
Expected: 构建成功，`main.js` 重新生成。

手动验证：导出并打开页面，把鼠标移到正文区域**最右边缘**。
Expected: 平时看不到把手；hover 到右边缘时，垂直居中处显现一根蓝色细竖条，光标变为左右箭头（`ew-resize`）。窗口很窄（< 900px）时把手不显示。此步把手尚无交互（拖不动属正常）。

- [ ] **Step 4: 提交**

```bash
git add src/main.ts main.js
git commit -m "feat: add right-edge width handle element and styles"
```

---

## Task 3: 把手交互脚本（拖拽 + 滚轮 + 全局记忆）

**Files:**
- Modify: `src/main.ts`（新增 `WIDTH_ADJUST_JS` 常量；页面模板注入 `<script>`）

- [ ] **Step 1: 新增 `WIDTH_ADJUST_JS` 模块级常量**

在 `const TTS_PLAYER_JS = ` 这一行（约 `main.ts:3374`）**之前**插入以下常量（内联 JS 用 ES2018 语法，`var`/普通函数，避免高版本特性）：

```ts
const WIDTH_ADJUST_JS = `
(function() {
	var MIN = 600, DEF = 720, STEP = 40, KEY = "notes-to-html-pages:read-width";
	var root = document.documentElement;
	function maxW() { return Math.min(window.innerWidth - 64, 1400); }
	function clamp(px) { return Math.max(MIN, Math.min(maxW(), px)); }
	function cur() {
		var v = parseInt(getComputedStyle(root).getPropertyValue("--read-width"), 10);
		return isNaN(v) ? DEF : v;
	}
	function apply(px, persist) {
		px = clamp(px);
		root.style.setProperty("--read-width", px + "px");
		if (persist) { try { localStorage.setItem(KEY, String(px)); } catch (e) {} }
	}
	try { var saved = localStorage.getItem(KEY); if (saved) apply(parseInt(saved, 10), false); } catch (e) {}
	document.addEventListener("DOMContentLoaded", function() {
		var handle = document.querySelector(".width-handle");
		if (!handle) return;
		var dragging = false, startX = 0, startW = 0;
		handle.addEventListener("pointerdown", function(e) {
			dragging = true; startX = e.clientX; startW = cur();
			try { handle.setPointerCapture(e.pointerId); } catch (_) {}
			e.preventDefault();
		});
		handle.addEventListener("pointermove", function(e) {
			if (!dragging) return;
			apply(startW + 2 * (e.clientX - startX), false);
		});
		function end(e) {
			if (!dragging) return;
			dragging = false;
			try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
			apply(cur(), true);
		}
		handle.addEventListener("pointerup", end);
		handle.addEventListener("pointercancel", end);
		handle.addEventListener("wheel", function(e) {
			var d = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
			if (!d) return;
			e.preventDefault();
			apply(cur() + (d > 0 ? STEP : -STEP), true);
		}, { passive: false });
	});
})();
`;
```

- [ ] **Step 2: 在页面模板注入脚本标签**

定位 Task 2 改过的返回拼装（约 `main.ts:711` 一带）：

```ts
			"</main>",
			ttsPlayerHtml,
			ttsScript,
```

在 `ttsScript,` 之后插入一行（脚本始终注入，与是否有 TTS 无关）：

```ts
			"</main>",
			ttsPlayerHtml,
			ttsScript,
			`<script>${WIDTH_ADJUST_JS}</script>`,
```

- [ ] **Step 3: 构建**

Run: `npm run build`
Expected: 构建成功，无 tsc 报错，`main.js` 重新生成。

- [ ] **Step 4: 手动验证拖拽**

导出并打开页面，按住右边缘把手左右拖动。
Expected: 向右拖→正文列对称变宽（始终居中），向左拖→变窄；最窄约 600px、最宽约「视口宽 − 64」且不超过 1400px，到边界后不再变化。

- [ ] **Step 5: 手动验证滚轮**

鼠标悬停在把手上，滚动滚轮（竖直滚轮即可；有水平滚轮的设备水平滚动也行）。
Expected: 每格约 40px 增减宽度，列保持居中；在把手上滚动时页面**不**跟着上下滚动。

- [ ] **Step 6: 手动验证全局记忆**

把宽度调到明显偏宽，关闭该页面标签，重新打开同一个 `.html`；再导出**另一篇**笔记并打开。
Expected: 两个页面都自动恢复到上次调好的宽度（Obsidian 内 srcdoc 同源共享 `localStorage`）。

- [ ] **Step 7: 提交**

```bash
git add src/main.ts main.js
git commit -m "feat: drag and scroll to adjust reading width, persisted globally"
```

---

## Task 4: 回归核对 + 收尾

**Files:** 无新增改动（仅核对）

- [ ] **Step 1: TTS 共存核对**

对一篇已生成语音伴读（含 TTS 播放器）的笔记导出并打开。
Expected: 底部 TTS 胶囊正常工作、宽度固定不随正文变化；把手拖拽/滚轮照常调节正文宽度，两者互不干扰。

- [ ] **Step 2: 暗色主题核对**

在 Obsidian 切换暗色主题查看页面。
Expected: 把手 hover 竖条用主题强调色显示正常；宽度调节在暗色下行为一致。

- [ ] **Step 3: 最终构建确认**

Run: `npm run build`
Expected: 构建成功，工作区干净（`git status` 中 `src/main.ts` 与 `main.js` 已提交）。

> 说明：CSS/JS 改动只对**新导出**的页面生效；用户已有的旧 `.html` 需重新导出才会带上该功能。无需额外迁移代码。

---

## Self-Review 记录

- **Spec 覆盖**：变量化(§设计1)→Task 1；把手元素+tooltip+隐藏规则(§2、§需求3)→Task 2；拖拽+滚轮+边界+记忆(§3/§4/§5、§需求1/2)→Task 3；TTS/暗色/旧页边界(§边界情况)→Task 4。始终开启、不加设置项(§不做)→未引入任何设置项，符合。
- **占位符**：无 TBD/TODO，所有代码块为完整可用内容。
- **命名一致**：CSS 变量统一 `--read-width` / `--page-width`；JS 函数 `clamp/cur/apply/end` 在 Task 3 内自洽；元素类名 `.width-handle` 在 Task 2 注入、Task 3 `querySelector(".width-handle")` 引用，一致。
- **类型一致**：内联 JS 不经 tsc 校验（字符串模板），`WIDTH_ADJUST_JS` 为 `const string`，注入方式与既有 `TTS_PLAYER_JS` 完全一致。
