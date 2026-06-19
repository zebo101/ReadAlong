# Project Configuration

## Project Overview
- **Name**: Notes to HTML Pages
- **Description**: Obsidian 插件，将 Markdown 笔记导出为清晰、离线可读的 HTML 页面，带可点击目录，支持在 Obsidian 内直接阅读
- **Tech Stack**: TypeScript, Obsidian Plugin API, markdown-it, esbuild
- **Platform**: Obsidian 桌面端 (isDesktopOnly: true)
- **Min Obsidian Version**: 1.5.0
- **Current Version**: 0.4.8
- **License**: MIT

## Architecture

这是一个**单文件插件**，全部源码集中在 `src/main.ts`（约 2000 行）。文件内包含：

1. **国际化文本** (UI_TEXT) — 中英文双语 UI 文案，所有用户可见文字都在此定义
2. **Settings 接口与默认值** (ReadableHtmlSettings / DEFAULT_SETTINGS) — 10 个配置项
3. **主插件类** (ReadableHtmlExporterPlugin) — 注册命令、菜单、设置页，处理文件导出逻辑
4. **HTML 视图** (ReadableHtmlView) — 在 Obsidian 内渲染 .html/.htm 文件
5. **设置面板** (ReadableHtmlSettingTab) — 插件设置 UI
6. **CSS 模板** — 内联在 TS 文件末尾的完整 CSS 样式（"clean" 预设），约 400 行

核心导出流程：Markdown → markdown-it 解析 → HTML 模板拼装（标题区 + 目录 + 正文 + CSS）→ 写入 .html 文件

### 关键设计点
- 导出的 HTML 完全自包含（inline CSS，可选 data URI 图片），无外部依赖
- 支持 wikilink → 同名 HTML 链接转换
- 可选生成 .md 入口笔记（launcher note）和源文件反向链接
- 样式预设系统（当前仅 "clean"，预留扩展位）

## Directory Structure

```
notes-to-html-pages/
├── src/
│   └── main.ts          # 全部插件源码（唯一源文件）
├── assets/              # README 截图
├── .github/workflows/
│   └── release.yml      # GitHub Actions 自动发布
├── esbuild.config.mjs   # 构建配置
├── manifest.json        # Obsidian 插件元数据（版本号需与 package.json 同步）
├── versions.json        # Obsidian 版本兼容性映射
├── tsconfig.json        # TypeScript 配置（target ES2018, strictNullChecks）
├── package.json         # 依赖与脚本
└── main.js              # 构建产物（提交到仓库，Obsidian 直接加载）
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动 esbuild watch 模式，修改后自动重新构建 main.js |
| `npm run build` | 生产构建：先 tsc 类型检查，再 esbuild 压缩输出 main.js |

没有测试框架、lint 工具或格式化工具。构建产物 `main.js` 直接提交到仓库根目录。

## Development Standards

### Code Style
- 单文件架构：所有代码在 `src/main.ts`，修改前务必通读相关上下文
- 使用 Tab 缩进
- TypeScript strictNullChecks 已启用
- 编译目标 ES2018，不要使用更高版本的语法特性

### Naming Conventions
- **类**: PascalCase (ReadableHtmlExporterPlugin, ReadableHtmlView)
- **接口**: PascalCase (ReadableHtmlSettings, ExportPaths)
- **方法/变量**: camelCase (exportFile, getActiveMarkdownFile)
- **常量**: UPPER_SNAKE_CASE (DEFAULT_SETTINGS, VIEW_TYPE_READABLE_HTML)
- **类型别名**: PascalCase (HtmlStylePreset, UiLanguage)

### i18n Pattern
所有用户可见文本通过 `this.t("key")` 获取，文案定义在 `UI_TEXT` 对象中。添加新文案时必须同时提供 `zh` 和 `en` 两个版本。

### Version Management
发布新版时需要同步更新三个文件：
1. `package.json` → version
2. `manifest.json` → version
3. `versions.json` → 添加新版本条目

GitHub release tag 必须与 manifest.json 中的版本号一致，**不带 `v` 前缀**。

## Modifying Code: Caution Areas

### 修改前必读
- 改任何功能前，先在 `src/main.ts` 中定位相关代码段，理解上下文
- CSS 模板在文件末尾（约 1650-2069 行），作为模板字符串嵌入

### 高风险区域
- **SOURCE_LINK_BLOCK_REGEX** — 用于匹配和更新源文件中的反向链接，修改正则需极度谨慎
- **CSS 模板字符串** — 任何修改都会影响所有导出页面的视觉表现
- **registerExtensions** — html/htm 扩展名注册，可能与其他插件冲突
- **文件路径处理** — INVALID_FILE_NAME_CHARS、路径拼接逻辑，涉及跨平台兼容性

### 安全边界
- 插件在用户本地 vault 内运行，不发送任何数据到外部服务
- 图片嵌入使用 data URI，需注意大文件场景下的内存占用

## Output Style Guidelines

- 本项目面向中文用户为主，代码注释和 commit message 使用英文
- UI 文案必须中英双语
- 回答问题时优先用中文，除非用户用英文提问
- 修改代码时保持现有风格，不要引入额外的抽象层或工具链
- 不要拆分 `src/main.ts` 为多文件，除非用户明确要求重构

---
**Last Updated**: 2026-06-18
