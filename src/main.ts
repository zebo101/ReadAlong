import MarkdownIt from "markdown-it";
import {
	App,
	FileSystemAdapter,
	FileView,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	WorkspaceLeaf,
	normalizePath,
	requestUrl,
	setIcon
} from "obsidian";

const VIEW_TYPE_READABLE_HTML = "notes-to-html-pages-html-view";

type HtmlStylePreset = "clean";
type UiLanguage = "zh" | "en";

const HTML_STYLE_OPTIONS: Record<HtmlStylePreset, Record<UiLanguage, string>> = {
	clean: {
		zh: "简洁",
		en: "Clean"
	}
};

const UI_TEXT: Record<UiLanguage, Record<string, string>> = {
	zh: {
		ribbonExportCurrentNote: "导出当前笔记为语音伴读页面",
		commandExportCurrentNote: "导出当前笔记为语音伴读页面",
		commandExportCurrentFolder: "导出当前文件夹为语音伴读页面",
		menuExportNote: "导出为语音伴读页面",
		menuExportFolder: "导出文件夹为语音伴读页面",
		noticeNoActiveMarkdown: "当前没有打开 Markdown 笔记。",
		noticeNoMarkdownInFolder: "这个文件夹里没有可导出的 Markdown 笔记。",
		noticeFolderExported: "已导出 {count} 篇笔记为语音伴读页面。",
		noticeFileExported: "已导出：{path}",
		noticeExportFailed: "导出失败：{path}",
		noticeReloadRequired: "重启 Obsidian 或重新加载插件后，命令名和侧边栏按钮会更新。",
		untitledSection: "未命名章节",
		toc: "目录",
		sectionTocAria: "章节目录",
		codeLabel: "代码",
		asciiFigureLabel: "ASCII 图",
		fallbackHtmlPage: "语音伴读页面",
		launcherOpenInBrowser: "在浏览器打开 HTML 页面",
		launcherHtmlFile: "HTML 文件",
		launcherSourceNote: "源笔记",
		sourceLinkLabel: "语音伴读",
		sourceLinkAlias: "打开伴读页面",
		settingsTitle: "语音伴读 - Read Along",
		settingLanguageName: "界面语言",
		settingLanguageDesc: "切换插件命令、右键菜单、设置页和提示文案。命令名需要重载插件后刷新。",
		languageChinese: "中文",
		languageEnglish: "English",
		settingExportFolderName: "导出目录",
		settingExportFolderDesc: "相对于当前 vault 根目录。",
		settingStyleName: "HTML 样式",
		settingStyleDesc: "控制导出的 HTML 页面版式。后续新增样式会出现在这里。",
		settingPreserveFoldersName: "保留原文件夹层级",
		settingPreserveFoldersDesc: "开启后，导出的 HTML 会在导出目录里复刻原笔记的文件夹路径。",
		settingAddTitleName: "没有 H1 时用文件名补标题",
		settingAddTitleDesc: "让导出的页面始终有一个居中的主标题。",
		settingWikilinksName: "将 Wikilink 指向同名 HTML",
		settingWikilinksDesc: "例如 [[长文]] 会导出为指向 长文.html 的链接。",
		settingOpenHtmlName: "在 Obsidian 内直接打开 HTML",
		settingOpenHtmlDesc: "注册 .html/.htm 文件视图。开启后，导出的 HTML 会出现在文件列表中，并可直接点开阅读。",
		settingLauncherName: "生成 Obsidian 可见入口笔记",
		settingLauncherDesc: "兼容旧方案：同时生成同名 .md 入口笔记。已开启 HTML 直接阅读时通常不需要。",
		settingInsertLinkName: "在原文开头插入语音伴读链接",
		settingInsertLinkDesc: "导出后，在原文开头放入指向入口笔记的双链。再次导出会自动更新，不会重复添加。",
		settingEmbedImagesName: "内嵌本地图片",
		settingEmbedImagesDesc: "把本地图片转为 data URI，方便 HTML 文件独立打开。",
		settingTtsHeading: "语音合成 (TTS)",
		settingTtsEnabledName: "启用语音伴读",
		settingTtsEnabledDesc: "导出时调用火山引擎语音合成大模型生成音频并嵌入 HTML，支持逐句高亮。",
		settingTtsAccessKeyName: "API Key",
		settingTtsAccessKeyDesc: "火山引擎语音技术控制台的 API Key。",
		settingTtsGetKeyLink: "获取 API Key →",
		settingTtsVoiceLibraryName: "配音音色",
		ttsVoiceRecommended: "推荐",
		ttsVoiceDelete: "删除",
		ttsVoiceAddName: "添加音色",
		ttsVoiceAddDesc: "任意豆包 voice_type（资源版本自动匹配）",
		ttsVoiceAddNamePlaceholder: "名称（可选）",
		ttsVoiceAddButton: "添加",
		ttsVoiceAddNeedId: "请填写 voice_type ID。",
		ttsVoiceAddDup: "该音色已存在。",
		ttsVoiceRestore: "恢复默认音色",
		ttsVoicePickPlaceholder: "点击选择音色",
		ttsVoiceTest: "测试",
		ttsVoiceTesting: "正在合成测试音频…",
		ttsVoiceTestOk: "音色可用，已播放",
		ttsVoiceTestFailTitle: "测试失败",
		settingTtsVoiceTypeName: "音色 (speaker)",
		settingTtsVoiceTypeDesc: "音色 ID（在控制台「音色」页获取），例如 zh_female_shuangkuaisisi_moon_bigtts。资源版本会按音色自动匹配。",
		noticeTtsGenerating: "正在生成语音… ({current}/{total})",
		noticeTtsGeneratingTitle: "正在生成语音…",
		ttsCancel: "取消",
		noticeTtsComplete: "语音已嵌入",
		noticeTtsFailed: "语音生成失败：{error}",
		noticeTtsNoApiKey: "请先在设置中填写 API Key。",
		noticeTtsCancelled: "已取消语音生成。",
		commandCancelTts: "取消语音生成",
		ttsPlay: "播放",
		ttsPause: "暂停",
		ttsCollapse: "收起播放器",
		ttsExpand: "展开播放器"
	},
	en: {
		ribbonExportCurrentNote: "Export note as a Read Along page",
		commandExportCurrentNote: "Export note as a Read Along page",
		commandExportCurrentFolder: "Export folder as Read Along pages",
		menuExportNote: "Export as Read Along page",
		menuExportFolder: "Export folder as Read Along pages",
		noticeNoActiveMarkdown: "No Markdown note is currently open.",
		noticeNoMarkdownInFolder: "This folder does not contain Markdown notes to export.",
		noticeFolderExported: "Exported {count} notes as Read Along pages.",
		noticeFileExported: "Exported: {path}",
		noticeExportFailed: "Export failed: {path}",
		noticeReloadRequired: "Reload Obsidian or reload the plugin to refresh command names and the ribbon button.",
		untitledSection: "Untitled section",
		toc: "Table of contents",
		sectionTocAria: "Section table of contents",
		codeLabel: "Code",
		asciiFigureLabel: "ASCII diagram",
		fallbackHtmlPage: "Read Along page",
		launcherOpenInBrowser: "Open HTML page in browser",
		launcherHtmlFile: "HTML file",
		launcherSourceNote: "Source note",
		sourceLinkLabel: "Read Along",
		sourceLinkAlias: "Open page",
		settingsTitle: "语音伴读 - Read Along",
		settingLanguageName: "Interface language",
		settingLanguageDesc: "Switch plugin commands, context menus, settings, and notices. Command names refresh after reloading the plugin.",
		languageChinese: "中文",
		languageEnglish: "English",
		settingExportFolderName: "Export folder",
		settingExportFolderDesc: "Relative to the current vault root.",
		settingStyleName: "HTML style",
		settingStyleDesc: "Controls the exported HTML page layout. Future styles will appear here.",
		settingPreserveFoldersName: "Preserve folder structure",
		settingPreserveFoldersDesc: "Exports HTML pages into matching subfolders inside the export folder.",
		settingAddTitleName: "Use filename as title when H1 is missing",
		settingAddTitleDesc: "Ensures every exported page has a centered main title.",
		settingWikilinksName: "Point Wikilinks to same-name HTML",
		settingWikilinksDesc: "For example, [[Long note]] will link to Long note.html.",
		settingOpenHtmlName: "Open HTML directly in Obsidian",
		settingOpenHtmlDesc: "Registers a .html/.htm file view so exported HTML files appear in the file explorer and open inside Obsidian.",
		settingLauncherName: "Create Obsidian-visible launcher notes",
		settingLauncherDesc: "Legacy compatibility: also create a same-name .md launcher note. Usually unnecessary when direct HTML reading is enabled.",
		settingInsertLinkName: "Insert Read Along link at source note top",
		settingInsertLinkDesc: "After export, insert a backlink to the generated reading page at the top of the source note. Re-exporting updates it without duplicates.",
		settingEmbedImagesName: "Embed local images",
		settingEmbedImagesDesc: "Converts local images to data URIs so the HTML file can be opened standalone.",
		settingTtsHeading: "Text-to-Speech (TTS)",
		settingTtsEnabledName: "Enable Read Along",
		settingTtsEnabledDesc: "Generate audio via Volcengine big-model TTS on export and embed it with sentence highlighting.",
		settingTtsAccessKeyName: "API Key",
		settingTtsAccessKeyDesc: "API Key from the Volcengine speech console.",
		settingTtsGetKeyLink: "Get an API Key →",
		settingTtsVoiceLibraryName: "Voices",
		ttsVoiceRecommended: "Recommended",
		ttsVoiceDelete: "Delete",
		ttsVoiceAddName: "Add a voice",
		ttsVoiceAddDesc: "Any Doubao voice_type (resource auto-matched)",
		ttsVoiceAddNamePlaceholder: "Name (optional)",
		ttsVoiceAddButton: "Add",
		ttsVoiceAddNeedId: "Enter a voice_type ID.",
		ttsVoiceAddDup: "That voice already exists.",
		ttsVoiceRestore: "Restore default voices",
		ttsVoicePickPlaceholder: "Click to choose a voice",
		ttsVoiceTest: "Test",
		ttsVoiceTesting: "Synthesizing test audio…",
		ttsVoiceTestOk: "Voice works — played",
		ttsVoiceTestFailTitle: "Test failed",
		settingTtsVoiceTypeName: "Voice (speaker)",
		settingTtsVoiceTypeDesc: "Voice ID (from the console Voices page), e.g. zh_female_shuangkuaisisi_moon_bigtts. The resource version is auto-matched to the voice.",
		noticeTtsGenerating: "Generating speech… ({current}/{total})",
		noticeTtsGeneratingTitle: "Generating speech…",
		ttsCancel: "Cancel",
		noticeTtsComplete: "Voice embedded.",
		noticeTtsFailed: "TTS failed: {error}",
		noticeTtsNoApiKey: "Set the TTS API Key in settings first.",
		noticeTtsCancelled: "TTS generation cancelled.",
		commandCancelTts: "Cancel TTS generation",
		ttsPlay: "Play",
		ttsPause: "Pause",
		ttsCollapse: "Collapse player",
		ttsExpand: "Expand player"
	}
};

interface ReadableHtmlSettings {
	interfaceLanguage: UiLanguage;
	exportFolder: string;
	stylePreset: HtmlStylePreset;
	preserveFolderStructure: boolean;
	addTitleFromFilename: boolean;
	linkWikilinksToHtml: boolean;
	embedLocalImages: boolean;
	openHtmlInObsidian: boolean;
	createLauncherNote: boolean;
	insertLinkInSource: boolean;
	ttsEnabled: boolean;
	ttsAppId: string;
	ttsAccessKey: string;
	ttsResourceId: string;
	ttsApiUrl: string;
	ttsVoiceType: string;
	ttsVoices: TtsVoice[];
}

interface TtsVoice {
	name: string;
	voiceType: string;
	style?: string;
	hue?: number;
	recommended?: boolean;
}

const DEFAULT_TTS_VOICES: TtsVoice[] = [
	{ name: "刘飞", voiceType: "zh_male_liufei_uranus_bigtts", style: "男声 · 沉稳磁性", hue: 255, recommended: true },
	{ name: "玲玲姐 2.0", voiceType: "zh_female_lingling_uranus_bigtts", style: "女声", hue: 343 },
	{ name: "儒雅逸辰 2.0", voiceType: "zh_male_ruyayichen_uranus_bigtts", style: "男声 · 气泡音", hue: 339 },
	{ name: "大壹", voiceType: "zh_male_dayi_uranus_bigtts", style: "男声 · 沉稳", hue: 343 },
	{ name: "温暖阿虎/Alvin 2.0", voiceType: "zh_male_wennuanahu_uranus_bigtts", style: "男声 · 温暖", hue: 234 },
	{ name: "魅力苏菲 2.0", voiceType: "zh_female_sophie_uranus_bigtts", style: "女声 · 高冷御姐", hue: 213 },
	{ name: "湾湾小何", voiceType: "zh_female_wanwanxiaohe_moon_bigtts", style: "女声 · 甜美台湾腔", hue: 72 },
	{ name: "台湾口音", voiceType: "zh_male_zhoujielun_emo_v2_mars_bigtts", style: "男声 · 台湾腔", hue: 123 }
];

const DEFAULT_SETTINGS: ReadableHtmlSettings = {
	interfaceLanguage: "zh",
	exportFolder: "Read Along",
	stylePreset: "clean",
	preserveFolderStructure: true,
	addTitleFromFilename: true,
	linkWikilinksToHtml: true,
	embedLocalImages: true,
	openHtmlInObsidian: true,
	createLauncherNote: false,
	insertLinkInSource: true,
	ttsEnabled: false,
	ttsAppId: "",
	ttsAccessKey: "",
	ttsResourceId: "volc.service_type.10029",
	ttsApiUrl: "https://openspeech.bytedance.com/api/v3/tts/unidirectional",
	ttsVoiceType: "zh_male_liufei_uranus_bigtts",
	ttsVoices: DEFAULT_TTS_VOICES
};

// Matches the source-note link block so re-exporting overwrites it instead of stacking a new
// copy. Anchored on the (current + historical) label only — the link text is matched
// generically (any wikilink or markdown link), so future relabeling of the alias never breaks
// the overwrite again.
const SOURCE_LINK_BLOCK_REGEX =
	/(?:%% readable-html-exporter-link:start %%\r?\n)?^> (?:阅读版 HTML|HTML 页面|Readable HTML|HTML Page|语音伴读|Read Along|Read-Along)\s*[：:]\s*(?:\[\[[^\]]+\]\]|\[[^\]]*\]\([^)]*\))\s*\r?\n(?:%% readable-html-exporter-link:end %%\r?\n?)?/gm;

const INVALID_FILE_NAME_CHARS = new Set(['<', '>', ':', '"', '/', "\\", "|", "?", "*"]);

interface ExportPaths {
	htmlPath: string;
	launcherPath: string;
	outputFolder: string;
	htmlFileName: string;
	htmlWikiTarget: string;
	launcherWikiTarget: string;
}

interface TtsClip {
	idx: number;
	audio: string; // base64-encoded mp3 (no data: prefix)
}

export default class ReadableHtmlExporterPlugin extends Plugin {
	settings: ReadableHtmlSettings = DEFAULT_SETTINGS;
	private markdown!: MarkdownIt;
	private ttsGenerationId = 0;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.markdown = this.createMarkdownRenderer();

		if (this.settings.openHtmlInObsidian) {
			this.registerView(VIEW_TYPE_READABLE_HTML, (leaf) => new ReadableHtmlView(leaf));

			try {
				this.registerExtensions(["html", "htm"], VIEW_TYPE_READABLE_HTML);
			} catch (error) {
				console.info("Notes to HTML Pages could not register html/htm extensions.", error);
			}
		}

		this.addRibbonIcon("file-audio", this.t("ribbonExportCurrentNote"), () => {
			void this.exportActiveFile();
		});

		this.addCommand({
			id: "export-current-note-readable-html",
			name: this.t("commandExportCurrentNote"),
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				if (!file) return false;

				if (!checking) {
					void this.exportFile(file, true);
				}
				return true;
			}
		});

		this.addCommand({
			id: "export-current-folder-readable-html",
			name: this.t("commandExportCurrentFolder"),
			checkCallback: (checking) => {
				const file = this.getActiveMarkdownFile();
				const folder = file?.parent;
				if (!folder) return false;

				if (!checking) {
					void this.exportFolder(folder);
				}
				return true;
			}
		});

		this.addCommand({
			id: "cancel-tts-generation",
			name: this.t("commandCancelTts"),
			callback: () => {
				this.ttsGenerationId++;
				new Notice(this.t("noticeTtsCancelled"));
			}
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (file instanceof TFile && file.extension === "md") {
					menu.addItem((item) => {
						item
							.setTitle(this.t("menuExportNote"))
							.setIcon("file-output")
							.onClick(() => void this.exportFile(file, true));
					});
				}

				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle(this.t("menuExportFolder"))
							.setIcon("folder-output")
							.onClick(() => void this.exportFolder(file));
					});
				}
			})
		);

		this.addSettingTab(new ReadableHtmlSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		const loadedData: unknown = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, this.normalizeLoadedSettings(loadedData));
	}

	private normalizeLoadedSettings(data: unknown): Partial<ReadableHtmlSettings> {
		if (!this.isRecord(data)) {
			return {};
		}

		const settings: Partial<ReadableHtmlSettings> = {};

		if (data.interfaceLanguage === "zh" || data.interfaceLanguage === "en") {
			settings.interfaceLanguage = data.interfaceLanguage;
		}
		if (typeof data.exportFolder === "string") {
			settings.exportFolder = data.exportFolder;
		}
		if (data.stylePreset === "clean") {
			settings.stylePreset = data.stylePreset;
		}
		if (typeof data.preserveFolderStructure === "boolean") {
			settings.preserveFolderStructure = data.preserveFolderStructure;
		}
		if (typeof data.addTitleFromFilename === "boolean") {
			settings.addTitleFromFilename = data.addTitleFromFilename;
		}
		if (typeof data.linkWikilinksToHtml === "boolean") {
			settings.linkWikilinksToHtml = data.linkWikilinksToHtml;
		}
		if (typeof data.embedLocalImages === "boolean") {
			settings.embedLocalImages = data.embedLocalImages;
		}
		if (typeof data.openHtmlInObsidian === "boolean") {
			settings.openHtmlInObsidian = data.openHtmlInObsidian;
		}
		if (typeof data.createLauncherNote === "boolean") {
			settings.createLauncherNote = data.createLauncherNote;
		}
		if (typeof data.insertLinkInSource === "boolean") {
			settings.insertLinkInSource = data.insertLinkInSource;
		}
		if (typeof data.ttsEnabled === "boolean") {
			settings.ttsEnabled = data.ttsEnabled;
		}
		if (typeof data.ttsAccessKey === "string") {
			settings.ttsAccessKey = data.ttsAccessKey;
		} else if (typeof data.ttsApiKey === "string") {
			// migrate: old field name
			settings.ttsAccessKey = data.ttsApiKey;
		}
		if (typeof data.ttsAppId === "string") {
			settings.ttsAppId = data.ttsAppId;
		} else if (typeof data.ttsResourceId === "string" && /^\d+$/.test(data.ttsResourceId)) {
			// migrate: old "resourceId" actually held the numeric App ID
			settings.ttsAppId = data.ttsResourceId;
		}
		if (typeof data.ttsResourceId === "string" && data.ttsResourceId.trim() !== "" && !/^\d+$/.test(data.ttsResourceId)) {
			// any non-numeric resource id (volc.*, seed-tts-2.0, seed-icl-2.0, …);
			// a purely-numeric value is the old App ID, migrated above.
			settings.ttsResourceId = data.ttsResourceId;
		}
		if (typeof data.ttsApiUrl === "string") {
			// migrate: old classic v1 endpoint -> v3 default
			settings.ttsApiUrl = data.ttsApiUrl.includes("/api/v1/tts")
				? DEFAULT_SETTINGS.ttsApiUrl
				: data.ttsApiUrl;
		}
		if (typeof data.ttsVoiceType === "string") {
			settings.ttsVoiceType = data.ttsVoiceType;
		}
		if (Array.isArray(data.ttsVoices)) {
			settings.ttsVoices = data.ttsVoices
				.filter(
					(v): v is Record<string, unknown> =>
						this.isRecord(v) && typeof v.voiceType === "string" && v.voiceType.trim() !== ""
				)
				.map((v) => ({
					name: typeof v.name === "string" && v.name.trim() !== "" ? v.name : (v.voiceType as string),
					voiceType: (v.voiceType as string).trim(),
					style: typeof v.style === "string" ? v.style : undefined,
					hue: typeof v.hue === "number" ? v.hue : undefined,
					recommended: v.recommended === true ? true : undefined
				}));
		} else {
			// no saved list (fresh install / migration): start from a copy of the presets
			settings.ttsVoices = DEFAULT_TTS_VOICES.map((v) => ({ ...v }));
		}

		return settings;
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	getInterfaceLanguage(): UiLanguage {
		return this.settings.interfaceLanguage === "en" ? "en" : "zh";
	}

	t(key: keyof typeof UI_TEXT.zh, vars: Record<string, string | number> = {}): string {
		const language = this.getInterfaceLanguage();
		const template = UI_TEXT[language][key] ?? UI_TEXT.zh[key] ?? key;
		return template.replace(/\{(\w+)}/g, (_, name: string) => String(vars[name] ?? ""));
	}

	tForLanguage(
		language: UiLanguage,
		key: keyof typeof UI_TEXT.zh,
		vars: Record<string, string | number> = {}
	): string {
		const template = UI_TEXT[language][key] ?? UI_TEXT.zh[key] ?? key;
		return template.replace(/\{(\w+)}/g, (_, name: string) => String(vars[name] ?? ""));
	}

	getStyleLabel(stylePreset: HtmlStylePreset, language = this.getInterfaceLanguage()): string {
		return HTML_STYLE_OPTIONS[stylePreset]?.[language] ?? stylePreset;
	}

	private createMarkdownRenderer(): MarkdownIt {
		const md = new MarkdownIt({
			html: true,
			linkify: false,
			typographer: false,
			breaks: false
		});

		const defaultHeadingOpen =
			md.renderer.rules.heading_open ??
			((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

		md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
			const token = tokens[idx];
			const nextToken = tokens[idx + 1];

			if (nextToken?.type === "inline" && nextToken.content) {
				const headingIds = this.getHeadingIdMap(env);
				const baseId = this.slugify(nextToken.content);
				const usedCount = headingIds.get(baseId) ?? 0;
				headingIds.set(baseId, usedCount + 1);
				token.attrSet("id", usedCount === 0 ? baseId : `${baseId}-${usedCount + 1}`);
			}

			return defaultHeadingOpen(tokens, idx, options, env, self);
		};

		return md;
	}

	private getHeadingIdMap(env: unknown): Map<string, number> {
		const renderEnv = env as { headingIds?: Map<string, number> };
		if (!renderEnv.headingIds) {
			renderEnv.headingIds = new Map<string, number>();
		}
		return renderEnv.headingIds;
	}

	private getActiveMarkdownFile(): TFile | null {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const file = markdownView?.file ?? this.app.workspace.getActiveFile();

		if (file instanceof TFile && file.extension === "md") {
			return file;
		}
		return null;
	}

	private async exportActiveFile(): Promise<void> {
		const file = this.getActiveMarkdownFile();
		if (!file) {
			new Notice(this.t("noticeNoActiveMarkdown"));
			return;
		}

		await this.exportFile(file, true);
	}

	private async exportFolder(folder: TFolder): Promise<void> {
		const files = this.collectMarkdownFiles(folder).filter(
			(file) => !this.isInsideExportFolder(file.path)
		);

		if (files.length === 0) {
			new Notice(this.t("noticeNoMarkdownInFolder"));
			return;
		}

		let successCount = 0;
		for (const file of files) {
			await this.exportFile(file, false);
			successCount += 1;
		}

			new Notice(this.t("noticeFolderExported", { count: successCount }));
	}

	private collectMarkdownFiles(folder: TFolder): TFile[] {
		const files: TFile[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === "md") {
				files.push(child);
			}

			if (child instanceof TFolder) {
				files.push(...this.collectMarkdownFiles(child));
			}
		}

		return files;
	}

	private async exportFile(file: TFile, showNotice: boolean): Promise<void> {
		try {
			const paths = this.getOutputPaths(file);
			const { html, title } = await this.renderFileToHtml(file);

			await this.ensureFolder(paths.outputFolder);
			await this.writeTextFile(paths.htmlPath, html);

			if (this.settings.createLauncherNote) {
				await this.writeTextFile(paths.launcherPath, this.createLauncherNote(file, title, paths));
			}

			if (this.settings.insertLinkInSource) {
				const sourceLinkTarget = this.settings.openHtmlInObsidian
					? paths.htmlWikiTarget
					: paths.launcherWikiTarget;
				await this.upsertSourceLink(file, sourceLinkTarget);
			}

			if (showNotice) {
				new Notice(this.t("noticeFileExported", { path: paths.htmlPath }));
			}
		} catch (error) {
			console.error(error);
			new Notice(this.t("noticeExportFailed", { path: file.path }));
		}
	}

	private async renderFileToHtml(file: TFile): Promise<{ html: string; title: string }> {
		const raw = await this.app.vault.cachedRead(file);
		const { content, frontmatterTitle } = this.stripFrontmatter(raw);
		const contentWithoutSourceLink = this.removeSourceLinkBlock(content);
		const prepared = await this.prepareMarkdown(contentWithoutSourceLink, file);
		const title = this.findFirstHeading(contentWithoutSourceLink) ?? frontmatterTitle ?? file.basename;
		const shouldAddTitle =
			this.settings.addTitleFromFilename && !this.hasTopLevelHeading(prepared);
		const markdown = shouldAddTitle ? `# ${title}\n\n${prepared}` : prepared;
		const stylePreset = this.getStylePreset();
		const renderedBody = this.markdown.render(markdown, {});
		const documentLanguage: UiLanguage = /[\u3400-\u9fff]/.test(raw) ? "zh" : "en";
		let body = this.buildStyledBody(renderedBody, title, stylePreset, documentLanguage);
		const lang = documentLanguage === "zh" ? "zh-CN" : "en";

		let ttsDataTag = "";
		let ttsPlayerHtml = "";
		let ttsScript = "";

		const ttsEnabled = this.settings.ttsEnabled
			&& this.settings.ttsAccessKey.trim() !== "";
		if (ttsEnabled) {
			const { sentences, html: wrappedBody } = this.splitAndWrapSentences(body);
			if (sentences.length > 0) {
				this.ttsGenerationId++;
				const currentGenId = this.ttsGenerationId;
				try {
					const clips = await this.generateTtsPlaylist(sentences, currentGenId);

					if (clips.length > 0) {
						body = wrappedBody;

						ttsDataTag = `<script id="tts-data" type="application/json">${JSON.stringify(clips)}</script>`;

						const expandLabel = this.tForLanguage(documentLanguage, "ttsExpand");
						const collapseLabel = this.tForLanguage(documentLanguage, "ttsCollapse");
						ttsPlayerHtml = [
							'<div class="tts-player" id="tts-player">',
							'<audio id="tts-audio" preload="none"></audio>',
							`<button class="tts-handle" id="tts-handle" type="button" aria-label="${expandLabel}" title="${expandLabel}">`,
							'<span class="tts-eq tts-eq-mini" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
							"</button>",
							'<div class="tts-controls">',
							'<button class="tts-btn tts-play-btn" id="tts-play-btn">\u25B6</button>',
							'<div class="tts-progress-wrap" id="tts-progress-wrap"><div class="tts-progress-bar" id="tts-progress-bar"></div></div>',
							'<span class="tts-time" id="tts-time">0 / 0</span>',
							'<span class="tts-eq" id="tts-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>',
							'<button class="tts-btn tts-skip-btn" id="tts-skip-back">\u2039</button>',
							'<button class="tts-btn tts-skip-btn" id="tts-skip-forward">\u203A</button>',
							'<select class="tts-speed" id="tts-speed">',
							'<option value="0.8">0.8x</option>',
							'<option value="1" selected>1x</option>',
							'<option value="1.25">1.25x</option>',
							'<option value="1.5">1.5x</option>',
							'<option value="2">2x</option>',
							"</select>",
							`<button class="tts-btn tts-collapse-btn" id="tts-collapse" type="button" aria-label="${collapseLabel}" title="${collapseLabel}">▾</button>`,
							"</div>",
							"</div>"
						].join("\n");

						ttsScript = `<script>${TTS_PLAYER_JS}</script>`;

						new Notice(this.t("noticeTtsComplete"), 3000);

						const sizeBytes = clips.reduce((s, c) => s + c.audio.length * 0.75, 0);
						if (sizeBytes > 20 * 1024 * 1024) {
							new Notice(`Audio size: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`, 5000);
						}
					}
				} catch (err) {
					console.error("TTS generation failed:", err);
					const msg = err instanceof Error ? err.message : String(err);
					if (/cancel/i.test(msg)) {
						new Notice(this.t("noticeTtsCancelled"), 4000);
					} else {
						new Notice(this.t("noticeTtsFailed", { error: msg }), 5000);
					}
				}
			}
		}

		return {
			title,
			html: [
			"<!doctype html>",
			`<html lang="${lang}">`,
			"<head>",
			'<meta charset="utf-8">',
			'<meta name="viewport" content="width=device-width, initial-scale=1">',
			`<meta name="notes-to-html-pages-style" content="${stylePreset}">`,
			`<title>${this.escapeHtml(title)}</title>`,
			`<style>${this.getStyleCss(stylePreset)}</style>`,
			ttsDataTag,
			"</head>",
			`<body class="style-${stylePreset}">`,
			`<main class="page${ttsPlayerHtml ? " has-tts-player" : ""}">`,
			body,
			"</main>",
			ttsPlayerHtml,
			ttsScript,
			"</body>",
			"</html>"
			].filter(Boolean).join("\n")
		};
	}

	private splitAndWrapSentences(bodyHtml: string): { sentences: string[]; html: string } {
		if (typeof DOMParser === "undefined") return { sentences: [], html: bodyHtml };
		const doc = new DOMParser().parseFromString(`<div>${bodyHtml}</div>`, "text/html");
		const root = doc.querySelector("div");
		if (!root) return { sentences: [], html: bodyHtml };
		const scope = root.querySelector(".article-body") ?? root;

		const sentences: string[] = [];
		let idx = 0;
		const BOUNDARY = /[。！？；!?\n]/;
		const blocks = scope.querySelectorAll("p, li, blockquote > p");

		blocks.forEach((block) => {
			if (block.closest("pre") || block.closest("code") || block.closest("table")) return;
			if (!block.textContent || !block.textContent.trim()) return;

			const built: Node[] = [];      // new children for this block
			let current: HTMLElement | null = null;

			const open = (): HTMLElement => {
				const span = doc.createElement("span");
				span.className = "tts-s";
				current = span;
				built.push(span);
				return span;
			};
			const close = (): void => {
				if (current) {
					const txt = (current.textContent ?? "").trim();
					if (txt) {
						current.setAttribute("data-idx", String(idx));
						sentences.push(txt);
						idx++;
					}
				}
				current = null;
			};

			Array.from(block.childNodes).forEach((node) => {
				if (node.nodeType === 3) {
					// text node: split keeping the boundary char with the left part
					const text = node.textContent ?? "";
					const parts = text.split(/(?<=[。！？；!?\n])/);
					parts.forEach((part) => {
						if (part === "") return;
						if (!current) open();
						current!.appendChild(doc.createTextNode(part));
						if (BOUNDARY.test(part.charAt(part.length - 1)) ||
							/[。！？；!?\n]\s*$/.test(part)) {
							close();
						}
					});
				} else {
					// inline/element node: keep whole inside current sentence
					if (!current) open();
					current!.appendChild(node.cloneNode(true));
				}
			});
			close();

			// rebuild block children, dropping empty spans (keep their text bare)
			block.innerHTML = "";
			built.forEach((n) => {
				const el = n as HTMLElement;
				if (el.tagName === "SPAN" && !el.hasAttribute("data-idx")) {
					if (el.textContent) block.appendChild(doc.createTextNode(el.textContent));
				} else {
					block.appendChild(n);
				}
			});
		});

		return { sentences, html: root.innerHTML };
	}

	private async callTtsApi(text: string, resourceId: string, speaker: string): Promise<Uint8Array> {
		const reqId = this.generateUUID();
		const body = JSON.stringify({
			user: { uid: "notes-to-html-pages" },
			req_params: {
				text,
				speaker,
				audio_params: { format: "mp3", sample_rate: 24000 }
			}
		});

		const resp = await requestUrl({
			url: this.settings.ttsApiUrl,
			method: "POST",
			throw: false,
			headers: {
				"Content-Type": "application/json",
				"X-Api-Key": this.settings.ttsAccessKey,
				"X-Api-Resource-Id": resourceId,
				"X-Api-Request-Id": reqId
			},
			body
		});

		return this.parseTtsResponse(resp);
	}

	// The X-Api-Resource-Id must match the voice's model space. Rather than make the
	// user configure it, we derive a best-guess order from the voice name and fall back
	// to the other known resources only when the API reports a speaker/resource mismatch.
	private resourceCandidates(voice: string): string[] {
		const v = (voice || "").toLowerCase();
		const known = ["seed-tts-2.0", "volc.service_type.10029", "seed-icl-2.0"];
		let first = "seed-tts-2.0";
		if (v.includes("_moon")) {
			first = "volc.service_type.10029";
		} else if (v.includes("_uranus") || v.includes("_mars")) {
			first = "seed-tts-2.0";
		}
		return [first, ...known.filter((r) => r !== first)];
	}

	// Synthesize one sentence, auto-detecting the resource id. Returns the audio plus the
	// resource that worked so the caller can reuse it for the remaining sentences.
	private async synthesizeAutoResource(
		text: string,
		preferredResourceId: string,
		voiceType: string
	): Promise<{ bytes: Uint8Array; resourceId: string }> {
		const candidates = preferredResourceId
			? [preferredResourceId]
			: this.resourceCandidates(voiceType);
		let lastErr: Error | null = null;
		for (const rid of candidates) {
			try {
				const bytes = await this.callTtsApi(text, rid, voiceType);
				if (bytes.length > 0) return { bytes, resourceId: rid };
				lastErr = new Error("empty audio");
			} catch (err) {
				lastErr = err instanceof Error ? err : new Error(String(err));
				// Only try another resource on a speaker/resource mismatch;
				// auth/quota/text errors are not fixed by switching resources.
				if (!/mismatch|55000000/i.test(lastErr.message)) throw lastErr;
			}
		}
		throw lastErr || new Error("no matching resource for this voice");
	}

	// Synthesize a short test sample with the given voice (falls back to the selected
	// voice). Returns the audio bytes; throws with a human-readable message on failure.
	// The settings UI renders the visual state (spinner/result), so no toast here.
	async synthesizeTestSample(voiceType: string): Promise<Uint8Array> {
		if (this.settings.ttsAccessKey.trim() === "") {
			throw new Error(this.t("noticeTtsNoApiKey"));
		}
		const speaker = (voiceType || this.settings.ttsVoiceType || "").trim();
		if (!speaker) {
			throw new Error(this.t("ttsVoiceAddNeedId"));
		}
		const { bytes } = await this.synthesizeAutoResource("你好，这是配音音色测试。", "", speaker);
		if (bytes.length === 0) {
			throw new Error("empty audio");
		}
		return bytes;
	}

	private parseTtsResponse(resp: {
		status: number;
		arrayBuffer: ArrayBuffer;
		text: string;
		headers: Record<string, string>;
	}): Uint8Array {
		const bytes = new Uint8Array(resp.arrayBuffer);
		const is2xx = resp.status >= 200 && resp.status < 300;

		// Prefer Content-Type over byte-sniffing (requestUrl may lowercase header names)
		const headers = resp.headers || {};
		const contentType = headers["content-type"] || headers["Content-Type"] || "";
		const ctIsAudio = /audio\//i.test(contentType);
		const ctIsJson = /json|event-stream/i.test(contentType);

		if (ctIsAudio && is2xx && bytes.length > 0) {
			// Content-Type clearly indicates audio
			return bytes;
		}

		const looksJson = bytes.length > 0 && bytes[0] === 0x7b; // '{'
		const looksSse = /^\s*data:/m.test(resp.text);

		if (!ctIsJson && !looksJson && !looksSse && is2xx && bytes.length > 0) {
			// raw audio bytes (Content-Type absent/ambiguous, byte heuristic fallback)
			return bytes;
		}

		// JSON / SSE: may carry base64 audio chunks, or be an error envelope
		const audio = this.extractAudioFromJsonStream(resp.text);
		if (audio && audio.length > 0) {
			return audio;
		}

		// no audio extracted -> treat as error
		let message = resp.text ? resp.text.slice(0, 300) : `HTTP ${resp.status}`;
		try {
			const j = JSON.parse(resp.text) as { header?: { message?: string }; message?: string };
			message = j?.header?.message || j?.message || message;
		} catch (e) {
			// not a single JSON object; keep truncated text
		}
		throw new Error(`status ${resp.status}: ${message}`);
	}

	private extractAudioFromJsonStream(text: string): Uint8Array | null {
		if (!text) return null;
		const audioFields = ["data", "audio", "audio_data"];
		const collected: Uint8Array[] = [];

		const pushAudioFields = (rec: Record<string, unknown>): void => {
			for (const field of audioFields) {
				const v = rec[field];
				if (typeof v === "string" && v.length > 0) {
					try {
						const bin = atob(v);
						const arr = new Uint8Array(bin.length);
						for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
						collected.push(arr);
					} catch (e) {
						// field was not base64; ignore
					}
				}
			}
		};

		const pushFromObject = (obj: unknown): void => {
			if (!obj || typeof obj !== "object") return;
			const rec = obj as Record<string, unknown>;
			// top-level audio fields
			pushAudioFields(rec);
			// one level deep: audio may be nested under a wrapper (payload/data/header)
			for (const key of Object.keys(rec)) {
				const child = rec[key];
				if (child && typeof child === "object" && !Array.isArray(child)) {
					pushAudioFields(child as Record<string, unknown>);
				}
			}
		};

		// 1) Single JSON object (whole body is one object)
		try { pushFromObject(JSON.parse(text)); } catch (e) { /* not a single object */ }

		// 2) Line-delimited: NDJSON (one JSON object per line) or SSE ("data: {...}").
		// The Volcengine v3 unidirectional endpoint streams newline-delimited JSON,
		// each line like {"code":0,"data":"<base64 mp3 chunk>"}.
		if (collected.length === 0) {
			for (const rawLine of text.split(/\r?\n/)) {
				let line = rawLine.trim();
				if (!line) continue;
				if (line.startsWith("data:")) line = line.slice(5).trim();
				if (!line || line === "[DONE]") continue;
				try { pushFromObject(JSON.parse(line)); } catch (e) { /* skip non-JSON line */ }
			}
		}

		// 3) Multiple concatenated JSON objects with no delimiter ("}{")
		if (collected.length === 0 && text.indexOf("}{") >= 0) {
			for (const chunk of text.split(/(?<=})\s*(?=\{)/)) {
				try { pushFromObject(JSON.parse(chunk)); } catch (e) { /* skip */ }
			}
		}

		if (collected.length === 0) return null;
		const total = collected.reduce((s, c) => s + c.length, 0);
		const out = new Uint8Array(total);
		let off = 0;
		for (const c of collected) { out.set(c, off); off += c.length; }
		return out;
	}

	private bytesToBase64(bytes: Uint8Array): string {
		let bin = "";
		const CHUNK = 8192;
		for (let i = 0; i < bytes.length; i += CHUNK) {
			bin += String.fromCharCode.apply(
				null,
				Array.from(bytes.subarray(i, Math.min(i + CHUNK, bytes.length)))
			);
		}
		return btoa(bin);
	}

	// Resource URL for the bundled loading GIF (sits next to main.js in the plugin folder).
	loaderImgSrc(): string {
		const dir = this.manifest.dir ?? "";
		return this.app.vault.adapter.getResourcePath(normalizePath(dir + "/chat-d.gif"));
	}

	private generateUUID(): string {
		if (typeof crypto !== "undefined" && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
		});
	}

	private async generateTtsPlaylist(
		sentences: string[],
		generationId: number
	): Promise<TtsClip[]> {
		const clips: TtsClip[] = [];
		let failedCount = 0;
		let firstError = "";
		let resolvedResourceId = ""; // detected on first success, reused for the rest

		// One persistent light progress card (loader + progress bar + Cancel) instead of a
		// fresh toast per sentence (which stacked up dozens deep on long notes).
		const progress = new Notice("", 0);
		const root = progress.noticeEl;
		root.empty();
		// Style the actual .notice toast (the dark chrome lives there, not on noticeEl).
		const card = root.closest<HTMLElement>(".notice") || root;
		card.addClass("n2h-progress-card");
		const head = root.createDiv({ cls: "n2h-progress-head" });
		head.createEl("img", { cls: "n2h-loader-gif", attr: { src: this.loaderImgSrc() } });
		const textWrap = head.createDiv({ cls: "n2h-progress-textwrap" });
		textWrap.createDiv({ cls: "n2h-progress-title", text: this.t("noticeTtsGeneratingTitle") });
		const descEl = textWrap.createDiv({ cls: "n2h-progress-desc" });
		const cancelBtn = head.createEl("button", { cls: "n2h-progress-cancel", text: this.t("ttsCancel") });
		cancelBtn.addEventListener("click", () => {
			this.ttsGenerationId++; // bump id → loop detects cancellation
		});
		const track = root.createDiv({ cls: "n2h-progress-track" });
		const fill = track.createDiv({ cls: "n2h-progress-fill" });
		const setProgress = (n: number): void => {
			descEl.setText(n + " / " + sentences.length);
			fill.style.width = Math.round((n / sentences.length) * 100) + "%";
		};
		setProgress(0);

		try {
			for (let i = 0; i < sentences.length; i++) {
				if (this.ttsGenerationId !== generationId) {
					throw new Error("TTS generation cancelled");
				}

				setProgress(i + 1);

				try {
					const result = await this.synthesizeAutoResource(sentences[i], resolvedResourceId, this.settings.ttsVoiceType);
					if (result.bytes.length === 0) {
						throw new Error("empty audio");
					}
					if (!resolvedResourceId) {
						resolvedResourceId = result.resourceId;
						if (this.settings.ttsResourceId !== resolvedResourceId) {
							this.settings.ttsResourceId = resolvedResourceId;
							await this.saveSettings();
						}
					}
					clips.push({ idx: i, audio: this.bytesToBase64(result.bytes) });
				} catch (err) {
					if (this.ttsGenerationId !== generationId) {
						throw new Error("TTS generation cancelled");
					}
					console.error(`TTS failed for sentence ${i}:`, err);
					if (!firstError) firstError = err instanceof Error ? err.message : String(err);
					failedCount++;

					// Circuit breaker: a systemic problem (proxy down, bad API key,
					// network outage) makes every sentence fail identically. Rather
					// than march through all N sentences before reporting it, bail out
					// as soon as the first few consecutive attempts fail with nothing
					// succeeding yet — turns a multi-minute wait into a few seconds.
					const abortAfter = Math.min(5, sentences.length);
					if (clips.length === 0 && failedCount >= abortAfter) {
						throw new Error(`all segments failed (${firstError})`);
					}
				}

				if (i < sentences.length - 1) {
					await this.sleep(150);
				}
			}
		} finally {
			progress.hide();
		}

		if (failedCount === sentences.length) {
			throw new Error(`all segments failed (${firstError})`);
		}
		if (failedCount > 0) {
			new Notice(this.t("noticeTtsFailed", { error: `${failedCount} segments failed` }), 5000);
		}

		return clips;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}

	private getStylePreset(): HtmlStylePreset {
		return Object.prototype.hasOwnProperty.call(HTML_STYLE_OPTIONS, this.settings.stylePreset)
			? this.settings.stylePreset
			: "clean";
	}

	private getStyleCss(stylePreset: HtmlStylePreset): string {
		if (stylePreset === "clean") {
			return CLEAN_HTML_CSS;
		}
		return CLEAN_HTML_CSS;
	}

	private buildStyledBody(
		renderedHtml: string,
		fallbackTitle: string,
		stylePreset: HtmlStylePreset,
		documentLanguage: UiLanguage
	): string {
		if (stylePreset !== "clean" || typeof DOMParser === "undefined") {
			return `<article class="article-body">${renderedHtml}</article>`;
		}

		const document = new DOMParser().parseFromString(`<main>${renderedHtml}</main>`, "text/html");
		const wrapper = document.querySelector("main");
		if (!wrapper) {
			return `<article class="article-body">${renderedHtml}</article>`;
		}

		const firstHeading = wrapper.querySelector("h1");
		const title = firstHeading?.textContent?.trim() || fallbackTitle;
		firstHeading?.remove();

		let deckHtml = "";
		const firstElement = this.getFirstContentElement(wrapper);
		if (firstElement?.tagName === "BLOCKQUOTE") {
			deckHtml = firstElement.innerHTML;
			firstElement.remove();
		}

		this.removeLeadingHr(wrapper);
		this.removeLeadingManualToc(wrapper);
		this.normalizeSectionHeadings(wrapper);
		this.enhanceReadableBlocks(wrapper, documentLanguage);
		const toc = this.createAutoToc(wrapper, documentLanguage);

		return [
			this.createArticleHero(title, deckHtml),
			toc,
			`<article class="article-body">${wrapper.innerHTML}</article>`
		]
			.filter(Boolean)
			.join("\n");
	}

	private createArticleHero(title: string, deckHtml: string): string {
		const { primary, secondary } = this.splitHeroTitle(title);
		const deck = deckHtml ? `<div class="article-deck">${deckHtml}</div>` : "";

		return [
			'<header class="article-hero">',
			`<h1><span>${this.escapeHtml(primary)}</span>${secondary ? `<span>${this.escapeHtml(secondary)}</span>` : ""}</h1>`,
			deck,
			'<div class="hero-rule" aria-hidden="true"></div>',
			"</header>"
		].join("\n");
	}

	private splitHeroTitle(title: string): { primary: string; secondary: string | null } {
		const parts = title
			.split(/\s+[·|｜]\s+|\s*[·|｜]\s*/u)
			.map((part) => part.trim())
			.filter(Boolean);

		if (parts.length >= 2 && title.length <= 80) {
			return {
				primary: parts[0],
				secondary: parts.slice(1).join(" · ")
			};
		}

		return { primary: title, secondary: null };
	}

	private createAutoToc(wrapper: Element, documentLanguage: UiLanguage): string {
		const headings = Array.from(wrapper.querySelectorAll("h2")).filter(
			(heading) => !this.isTocHeading(heading)
		);

		if (headings.length < 2) {
			return "";
		}

		const usedIds = new Map<string, number>();
		const items = headings.map((heading) => {
			const text =
				heading.textContent?.trim() ||
				this.tForLanguage(documentLanguage, "untitledSection");
			const existingId = heading.getAttribute("id");
			const id = existingId || this.createUniqueHeadingId(text, usedIds);
			heading.setAttribute("id", id);

			return `<li><a href="#${this.escapeHtml(id)}">${this.escapeHtml(
				this.cleanTocLabel(text)
			)}</a></li>`;
		});

		const tocLabel = this.tForLanguage(documentLanguage, "toc");
		const sectionTocLabel = this.tForLanguage(documentLanguage, "sectionTocAria");

		return [
			`<nav class="table-of-contents" aria-label="${this.escapeHtml(tocLabel)}">`,
			`<h2>${this.escapeHtml(tocLabel)}</h2>`,
			"<ol>",
			items.join("\n"),
			"</ol>",
			"</nav>",
			`<aside class="side-table-of-contents" aria-label="${this.escapeHtml(sectionTocLabel)}">`,
			`<div class="side-toc-title">${this.escapeHtml(tocLabel)}</div>`,
			"<ol>",
			items.join("\n"),
			"</ol>",
			"</aside>"
		].join("\n");
	}

	private removeLeadingManualToc(wrapper: Element): void {
		const firstElement = this.getFirstContentElement(wrapper);
		if (!firstElement || !this.isTocHeading(firstElement)) {
			return;
		}

		let next = firstElement.nextElementSibling;
		firstElement.remove();

		while (next && !/^H[12]$/.test(next.tagName)) {
			const current = next;
			next = next.nextElementSibling;
			current.remove();
		}
	}

	private removeLeadingHr(wrapper: Element): void {
		const firstElement = this.getFirstContentElement(wrapper);
		if (firstElement?.tagName === "HR") {
			firstElement.remove();
		}
	}

	private normalizeSectionHeadings(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("h2")).forEach((heading) => {
			if (this.isTocHeading(heading)) {
				return;
			}

			const text = heading.textContent?.trim() ?? "";
			const cleanText = this.cleanSectionPrefix(text);
			if (cleanText && cleanText !== text) {
				heading.textContent = cleanText;
			}
		});
	}

	private enhanceReadableBlocks(wrapper: Element, documentLanguage: UiLanguage): void {
		this.enhanceBlockquotes(wrapper);
		this.enhanceCodeFigures(wrapper, documentLanguage);
		this.enhanceTables(wrapper);
	}

	private enhanceBlockquotes(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("blockquote")).forEach((blockquote) => {
			const label = this.getBlockquoteLabel(blockquote);
			const text = blockquote.textContent?.trim() ?? "";
			const kind = this.getBlockquoteKind(label, text);

			blockquote.classList.add("readable-blockquote");
			if (label) {
				blockquote.setAttribute("data-label", label);
			}

			if (kind === "conclusion") {
				blockquote.classList.add("callout-block", "callout-conclusion");
			} else if (kind === "highlight") {
				blockquote.classList.add("callout-block", "callout-highlight");
			} else {
				blockquote.classList.add("quote-block");
			}
		});
	}

	private getBlockquoteLabel(blockquote: Element): string {
		const firstStrong =
			blockquote.querySelector("p:first-child strong:first-child") ??
			blockquote.querySelector("strong:first-child");
		return firstStrong?.textContent?.trim() ?? "";
	}

	private getBlockquoteKind(label: string, text: string): "quote" | "highlight" | "conclusion" {
		const signature = `${label} ${text.slice(0, 80)}`.toLowerCase();
		if (/(结论|总结|小结|结语|最终判断|takeaway|conclusion|summary|final)/i.test(signature)) {
			return "conclusion";
		}

		if (
			/(重点|要点|提示|注意|关键|核心|观察|洞察|提醒|important|note|tip|warning|info|insight)/i.test(
				signature
			)
		) {
			return "highlight";
		}

		return "quote";
	}

	private enhanceCodeFigures(wrapper: Element, documentLanguage: UiLanguage): void {
		Array.from(wrapper.querySelectorAll("pre")).forEach((pre) => {
			const text = pre.textContent ?? "";
			const isAsciiFigure = this.looksLikeAsciiFigure(text);
			pre.classList.add("code-figure");
			if (isAsciiFigure) {
				pre.classList.add("ascii-figure");
			}
			pre.setAttribute(
				"data-label",
				isAsciiFigure
					? this.tForLanguage(documentLanguage, "asciiFigureLabel")
					: this.tForLanguage(documentLanguage, "codeLabel")
			);
		});
	}

	private enhanceTables(wrapper: Element): void {
		Array.from(wrapper.querySelectorAll("table")).forEach((table) => {
			if (table.parentElement?.classList.contains("table-scroll")) {
				return;
			}

			const tableScroll = table.ownerDocument.createElement("div");
			tableScroll.className = "table-scroll";
			table.replaceWith(tableScroll);
			tableScroll.appendChild(table);
		});
	}

	private looksLikeAsciiFigure(text: string): boolean {
		const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
		if (lines.length < 3) {
			return false;
		}

		return /[┌┐└┘├┤┬┴┼│─━┃╭╮╰╯→←↑↓▼▲]|(?:-{2,}>|={2,}>|\|[\s\S]*\||\+-{2,}\+)/.test(
			text
		);
	}

	private getFirstContentElement(wrapper: Element): Element | null {
		return (
			Array.from(wrapper.children).find(
				(child) => child.tagName === "HR" || Boolean(child.textContent?.trim())
			) ?? null
		);
	}

	private isTocHeading(element: Element): boolean {
		return /^H[1-6]$/.test(element.tagName) && /^目录|toc$/i.test(element.textContent?.trim() ?? "");
	}

	private createUniqueHeadingId(text: string, usedIds: Map<string, number>): string {
		const baseId = this.slugify(text);
		const usedCount = usedIds.get(baseId) ?? 0;
		usedIds.set(baseId, usedCount + 1);
		return usedCount === 0 ? baseId : `${baseId}-${usedCount + 1}`;
	}

	private cleanTocLabel(text: string): string {
		return this.cleanSectionPrefix(text);
	}

	private cleanSectionPrefix(text: string): string {
		return (
			text
				.replace(
					/^(?:第[一二三四五六七八九十百千万\d]+[层章节部分篇讲课节讲]*|[一二三四五六七八九十百千万]+|[0-9]{1,2})[：:、.．\s-]+/u,
					""
				)
				.trim() || text
		);
	}

	private stripFrontmatter(raw: string): { content: string; frontmatterTitle: string | null } {
		const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
		if (!match) {
			return { content: raw, frontmatterTitle: null };
		}

		const frontmatter = match[1];
		const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);

		return {
			content: raw.slice(match[0].length),
			frontmatterTitle: titleMatch ? titleMatch[1].trim() : null
		};
	}

	private async prepareMarkdown(markdown: string, sourceFile: TFile): Promise<string> {
		const withoutComments = markdown.replace(/%%[\s\S]*?%%/g, "");

		return this.transformOutsideFences(withoutComments, async (line) => {
			let transformed = this.convertCalloutMarker(line);
			transformed = await this.convertObsidianEmbeds(transformed, sourceFile);
			transformed = await this.convertMarkdownImages(transformed, sourceFile);
			transformed = this.convertWikilinks(transformed);
			return transformed;
		});
	}

	private async transformOutsideFences(
		markdown: string,
		transform: (line: string) => Promise<string>
	): Promise<string> {
		const lines = markdown.split(/\r?\n/);
		const output: string[] = [];
		let inFence = false;
		let fenceChar: "`" | "~" | null = null;
		let fenceLength = 0;

		for (const line of lines) {
			const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
			if (fenceMatch) {
				const marker = fenceMatch[1];
				const markerChar = marker[0] as "`" | "~";

				if (!inFence) {
					inFence = true;
					fenceChar = markerChar;
					fenceLength = marker.length;
				} else if (fenceChar === markerChar && marker.length >= fenceLength) {
					inFence = false;
					fenceChar = null;
					fenceLength = 0;
				}

				output.push(line);
				continue;
			}

			output.push(inFence ? line : await transform(line));
		}

		return output.join("\n");
	}

	private convertCalloutMarker(line: string): string {
		return line.replace(
			/^(\s*>+\s*)\[!([^\]]+)\][+-]?\s*(.*)$/i,
			(_match, prefix: string, type: string, title: string) => {
				const label = title.trim() || this.titleCase(type.replace(/[-_]/g, " "));
				return `${prefix}**${this.escapeMarkdownText(label)}**`;
			}
		);
	}

	private async convertObsidianEmbeds(line: string, sourceFile: TFile): Promise<string> {
		return this.replaceAsync(line, /!\[\[([^\]]+)]]/g, async (_match, inner: string) => {
			const { target, alias } = this.parseObsidianLink(inner);
			const linkedFile = this.resolveLinkedFile(target, sourceFile);
			const label = alias || target;

			if (linkedFile && this.isImageFile(linkedFile)) {
				const src = this.settings.embedLocalImages
					? await this.fileToDataUri(linkedFile)
					: this.getRelativePath(sourceFile.path, linkedFile.path);
				return `![${this.escapeMarkdownText(label)}](${src})`;
			}

			if (linkedFile && linkedFile.extension === "md") {
				return `[${this.escapeMarkdownText(label)}](${this.obsidianTargetToHtmlHref(target)})`;
			}

			return `**${this.escapeMarkdownText(label)}**`;
		});
	}

	private async convertMarkdownImages(line: string, sourceFile: TFile): Promise<string> {
		if (!this.settings.embedLocalImages) {
			return line;
		}

		return this.replaceAsync(
			line,
			/!\[([^\]]*)]\(([^)\s]+)\)/g,
			async (match, alt: string, src: string) => {
				if (this.isRemoteOrDataUri(src)) {
					return match;
				}

				const cleanSrc = src.replace(/^<|>$/g, "");
				const linkedFile = this.resolveLinkedFile(decodeURIComponent(cleanSrc), sourceFile);
				if (!linkedFile || !this.isImageFile(linkedFile)) {
					return match;
				}

				const dataUri = await this.fileToDataUri(linkedFile);
				return `![${this.escapeMarkdownText(alt)}](${dataUri})`;
			}
		);
	}

	private convertWikilinks(line: string): string {
		return line.replace(/(^|[^!])\[\[([^\]]+)]]/g, (_match, prefix: string, inner: string) => {
			const { target, alias } = this.parseObsidianLink(inner);
			const displayText = alias || this.getDisplayTextFromTarget(target);

			if (!this.settings.linkWikilinksToHtml) {
				return `${prefix}${this.escapeMarkdownText(displayText)}`;
			}

			return `${prefix}[${this.escapeMarkdownText(displayText)}](${this.obsidianTargetToHtmlHref(
				target
			)})`;
		});
	}

	private parseObsidianLink(inner: string): { target: string; alias: string | null } {
		const [target, ...aliasParts] = inner.split("|");
		const alias = aliasParts.length > 0 ? aliasParts.join("|").trim() : null;

		return {
			target: target.trim(),
			alias
		};
	}

	private resolveLinkedFile(target: string, sourceFile: TFile): TFile | null {
		const linkPath = target.split("#")[0].split("^")[0].trim();
		if (!linkPath) return null;

		const linkedFile = this.app.metadataCache.getFirstLinkpathDest(linkPath, sourceFile.path);
		return linkedFile instanceof TFile ? linkedFile : null;
	}

	private obsidianTargetToHtmlHref(target: string): string {
		const [pathAndMaybeBlock, heading] = target.split("#");
		const pathWithoutBlock = pathAndMaybeBlock.split("^")[0].trim();
		const headingWithoutBlock = heading?.split("^")[0].trim();
		const htmlPath = pathWithoutBlock
			? pathWithoutBlock.replace(/\.md$/i, "") + ".html"
			: "";
		const hash = headingWithoutBlock ? `#${this.slugify(headingWithoutBlock)}` : "";

		return `${encodeURI(htmlPath)}${hash}`;
	}

	private getDisplayTextFromTarget(target: string): string {
		const withoutBlock = target.split("^")[0];
		const heading = withoutBlock.split("#")[1];
		const path = withoutBlock.split("#")[0];
		const basename = path.split("/").pop()?.replace(/\.md$/i, "") || target;

		return heading?.trim() || basename.trim();
	}

	private getOutputPaths(file: TFile): ExportPaths {
		const htmlPath = this.getOutputPath(file, "html");
		const launcherPath = this.getOutputPath(file, "md");
		const outputFolder = htmlPath.substring(0, htmlPath.lastIndexOf("/"));

		return {
			htmlPath,
			launcherPath,
			outputFolder,
			htmlFileName: htmlPath.split("/").pop() ?? `${this.cleanFileName(file.basename)}.html`,
			htmlWikiTarget: htmlPath,
			launcherWikiTarget: launcherPath.replace(/\.md$/i, "")
		};
	}

	private getOutputPath(file: TFile, extension: "html" | "md"): string {
		const exportFolder = this.cleanVaultPath(this.settings.exportFolder || "Read Along");
		const sourceFolder =
			this.settings.preserveFolderStructure && file.parent?.path ? file.parent.path : "";
		const fileName = `${this.cleanFileName(file.basename)}.${extension}`;

		return normalizePath([exportFolder, sourceFolder, fileName].filter(Boolean).join("/"));
	}

	private isInsideExportFolder(path: string): boolean {
		const exportFolder = this.cleanVaultPath(this.settings.exportFolder || "Read Along");
		return path === exportFolder || path.startsWith(`${exportFolder}/`);
	}

	private cleanVaultPath(path: string): string {
		return normalizePath(path.trim().replace(/^\/+|\/+$/g, ""));
	}

	private cleanFileName(fileName: string): string {
		const cleaned = Array.from(fileName, (character) =>
			INVALID_FILE_NAME_CHARS.has(character) || character.charCodeAt(0) < 32 ? "-" : character
		).join("");

		return cleaned.trim() || "untitled";
	}

	private async ensureFolder(folderPath: string): Promise<void> {
		const cleanPath = this.cleanVaultPath(folderPath);
		if (!cleanPath) return;

		const parts = cleanPath.split("/");
		let current = "";

		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!(await this.app.vault.adapter.exists(current))) {
				await this.app.vault.adapter.mkdir(current);
			}
		}
	}

	private async writeTextFile(path: string, content: string): Promise<void> {
		const existing = this.app.vault.getAbstractFileByPath(path);

		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, content);
			return;
		}

		if (await this.app.vault.adapter.exists(path)) {
			await this.app.vault.adapter.write(path, content);
			return;
		}

		if (path.endsWith(".md")) {
			await this.app.vault.create(path, content);
			return;
		}

		await this.app.vault.adapter.write(path, content);
	}

	private createLauncherNote(file: TFile, title: string, paths: ExportPaths): string {
		const sourceTarget = file.path.replace(/\.md$/i, "");
		const htmlUri = this.getFileUri(paths.htmlPath) ?? encodeURI(paths.htmlFileName);
		const now = new Date().toISOString();

		return [
			"---",
			"readable_html_exporter: true",
			`source: "${this.escapeYamlValue(file.path)}"`,
			`html: "${this.escapeYamlValue(paths.htmlPath)}"`,
			`updated: "${now}"`,
			"---",
			"",
			`# ${this.escapeMarkdownHeading(title)}`,
			"",
			`[${this.t("launcherOpenInBrowser")}](${htmlUri})`,
			"",
			`${this.t("launcherHtmlFile")}：\`${paths.htmlFileName}\``,
			"",
			`${this.t("launcherSourceNote")}：[[${sourceTarget}|${this.escapeMarkdownText(file.basename)}]]`
		].join("\n");
	}

	private async upsertSourceLink(file: TFile, targetPath: string): Promise<void> {
		const raw = await this.app.vault.read(file);
		const withoutOldLink = this.removeSourceLinkBlock(raw);
		const linkTarget = this.toWikiLinkTarget(targetPath);
		const linkBlock = `> ${this.t("sourceLinkLabel")}: [[${linkTarget}|${this.t(
			"sourceLinkAlias"
		)}]]`;
		const updated = this.insertAfterFrontmatter(withoutOldLink, linkBlock);

		if (updated !== raw) {
			await this.app.vault.modify(file, updated);
		}
	}

	private removeSourceLinkBlock(markdown: string): string {
		return markdown.replace(SOURCE_LINK_BLOCK_REGEX, "");
	}

	// Obsidian wikilinks split the target on "#" (heading anchor) and "^" (block ref), so a
	// path whose folder names contain those characters cannot be linked by its full path —
	// clicking it just creates an empty stray note. Drop every segment up to and including the
	// last "unlinkable" one, leaving the longest trailing path Obsidian can still resolve (it
	// matches links by path suffix). For a clean path this returns the full path unchanged, so
	// well-formed exports keep their unambiguous link.
	private toWikiLinkTarget(vaultPath: string): string {
		const segments = vaultPath.split("/");
		let start = 0;
		for (let index = 0; index < segments.length; index++) {
			if (/[#^[\]|]/.test(segments[index])) {
				start = index + 1;
			}
		}
		return segments.slice(start).join("/") || segments[segments.length - 1];
	}

	private insertAfterFrontmatter(markdown: string, block: string): string {
		const insertion = `${block}\n\n`;
		const frontmatter = markdown.match(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/);

		if (!frontmatter) {
			return `${insertion}${markdown.replace(/^\s*\n/, "")}`;
		}

		const frontmatterText = frontmatter[0].replace(/\s*$/, "\n");
		const rest = markdown.slice(frontmatter[0].length).replace(/^\s*\n/, "");

		return `${frontmatterText}${insertion}${rest}`;
	}

	private getFileUri(vaultPath: string): string | null {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return null;
		}

		const basePath = normalizePath(this.app.vault.adapter.getBasePath());
		const absolutePath = normalizePath(`${basePath}/${vaultPath}`);
		const normalized = absolutePath.replace(/\\/g, "/");
		const encoded = normalized
			.split("/")
			.map((part) => encodeURIComponent(part))
			.join("/")
			.replace(/^([A-Za-z])%3A/, "$1:");

		return /^[A-Za-z]:\//.test(normalized) ? `file:///${encoded}` : `file://${encoded}`;
	}

	private async fileToDataUri(file: TFile): Promise<string> {
		const buffer = await this.app.vault.readBinary(file);
		const mime = this.getMimeType(file.extension);
		return `data:${mime};base64,${this.arrayBufferToBase64(buffer)}`;
	}

	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		const chunkSize = 0x8000;
		let binary = "";

		for (let index = 0; index < bytes.length; index += chunkSize) {
			binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
		}

		return btoa(binary);
	}

	private isImageFile(file: TFile): boolean {
		return ["apng", "avif", "gif", "jpg", "jpeg", "png", "svg", "webp"].includes(
			file.extension.toLowerCase()
		);
	}

	private getMimeType(extension: string): string {
		const lower = extension.toLowerCase();
		const mimeTypes: Record<string, string> = {
			apng: "image/apng",
			avif: "image/avif",
			gif: "image/gif",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			svg: "image/svg+xml",
			webp: "image/webp"
		};

		return mimeTypes[lower] ?? "application/octet-stream";
	}

	private isRemoteOrDataUri(src: string): boolean {
		return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src);
	}

	private getRelativePath(fromFilePath: string, toFilePath: string): string {
		const fromParts = fromFilePath.split("/").slice(0, -1);
		const toParts = toFilePath.split("/");
		let shared = 0;

		while (
			shared < fromParts.length &&
			shared < toParts.length &&
			fromParts[shared] === toParts[shared]
		) {
			shared += 1;
		}

		const upward = fromParts.slice(shared).map(() => "..");
		const downward = toParts.slice(shared);
		return encodeURI([...upward, ...downward].join("/") || toFilePath);
	}

	private findFirstHeading(markdown: string): string | null {
		const match = markdown.match(/^#\s+(.+?)\s*#*\s*$/m);
		return match ? this.stripMarkdownInline(match[1]) : null;
	}

	private hasTopLevelHeading(markdown: string): boolean {
		return /^#\s+.+$/m.test(markdown);
	}

	private stripMarkdownInline(text: string): string {
		return text
			.replace(/`([^`]+)`/g, "$1")
			.replace(/\*\*([^*]+)\*\*/g, "$1")
			.replace(/\*([^*]+)\*/g, "$1")
			.replace(/__([^_]+)__/g, "$1")
			.replace(/_([^_]+)_/g, "$1")
			.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
			.replace(/#+$/g, "")
			.trim();
	}

	private titleCase(text: string): string {
		return text.replace(/\b\w/g, (char) => char.toUpperCase());
	}

	private slugify(text: string): string {
		const slug = text
			.toLowerCase()
			.trim()
			.replace(/[^\p{L}\p{N}\s-]/gu, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.slice(0, 80);

		return slug || "section";
	}

	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	private escapeMarkdownText(text: string): string {
		return text.replace(/\\/g, "\\\\").split("[").join("\\[").split("]").join("\\]");
	}

	private escapeMarkdownHeading(text: string): string {
		return text.replace(/\r?\n/g, " ").trim() || this.t("fallbackHtmlPage");
	}

	private escapeYamlValue(text: string): string {
		return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	}

	private async replaceAsync(
		text: string,
		regex: RegExp,
		replacer: (...args: string[]) => Promise<string>
	): Promise<string> {
		const matches = Array.from(text.matchAll(regex));
		if (matches.length === 0) {
			return text;
		}

		const replacements = await Promise.all(matches.map((match) => replacer(...(match as string[]))));
		let result = "";
		let lastIndex = 0;

		matches.forEach((match, index) => {
			result += text.slice(lastIndex, match.index);
			result += replacements[index];
			lastIndex = (match.index ?? 0) + match[0].length;
		});

		return result + text.slice(lastIndex);
	}
}

class ReadableHtmlView extends FileView {
	private iframeEl: HTMLIFrameElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	private themeObserver: MutationObserver | null = null;

	onload(): void {
		super.onload();
		// The iframe's prefers-color-scheme does not follow Obsidian's light/dark toggle, so
		// we mirror Obsidian's theme onto the page ourselves and re-sync when it changes.
		// Watch document.body's class (theme-dark <-> theme-light) directly: it flips exactly
		// when the theme is applied, unlike css-change which can fire before the class swaps.
		this.themeObserver = new MutationObserver(() => this.syncTheme());
		this.themeObserver.observe(activeDocument.body, { attributes: true, attributeFilter: ["class"] });
		this.register(() => {
			this.themeObserver?.disconnect();
			this.themeObserver = null;
		});
	}

	getViewType(): string {
		return VIEW_TYPE_READABLE_HTML;
	}

	getDisplayText(): string {
		return this.file?.basename ?? "Readable HTML";
	}

	async onLoadFile(file: TFile): Promise<void> {
		const html = await this.app.vault.cachedRead(file);
		const hasTts = html.includes('id="tts-player"');
		const iframe = this.createIframe(hasTts);

		this.contentEl.empty();
		this.contentEl.setAttr(
			"style",
			`height: 100%; padding: 0; overflow: hidden; background: ${this.pageColors().bg};`
		);
		this.contentEl.appendChild(iframe);
		this.iframeEl = iframe;
		this.applyPanelTheme();

		this.lastDark = this.isDark();
		const themed = this.applyThemeClass(html);
		iframe.srcdoc = this.injectBaseHref(themed, this.getBaseHref(file.path));
	}

	private lastDark: boolean | null = null;

	private isDark(): boolean {
		return activeDocument.body.classList.contains("theme-dark");
	}

	// Tag the page's <html> with theme-dark / theme-light so CLEAN_HTML_CSS resolves the
	// matching palette. Lets us follow Obsidian's own toggle instead of prefers-color-scheme.
	private applyThemeClass(html: string): string {
		const cls = this.isDark() ? "theme-dark" : "theme-light";
		return html.replace(/<html\b([^>]*)>/i, `<html$1 class="${cls}">`);
	}

	// Re-sync the open page + panel when Obsidian's theme toggles. Toggling the class on the
	// already-loaded iframe document switches the palette live, without reloading (audio keeps playing).
	private syncTheme(): void {
		const dark = this.isDark();
		if (dark === this.lastDark) return;
		this.lastDark = dark;
		const doc = this.iframeEl?.contentDocument;
		if (doc?.documentElement) {
			doc.documentElement.classList.toggle("theme-dark", dark);
			doc.documentElement.classList.toggle("theme-light", !dark);
		}
		const { bg } = this.pageColors();
		this.contentEl.style.setProperty("background", bg);
		if (this.iframeEl) this.iframeEl.style.setProperty("background", bg);
		this.applyPanelTheme();
	}

	// Page palette for the current theme. Mirrors CLEAN_HTML_CSS so the in-Obsidian panel
	// matches the page in both light and dark, tracking Obsidian's toggle (see isDark).
	private pageColors(): { bg: string; border: string } {
		return this.isDark()
			? { bg: "#050606", border: "#212222" }
			: { bg: "#f4f5f6", border: "#e4e4e5" };
	}

	// Make THIS view's header + leaf container match the page background so the panel
	// reads as one color. Inline (!important) beats theme CSS; reverted on unload so no
	// other Obsidian view is affected.
	private applyPanelTheme(): void {
		// Defer to next frame so the view's header is mounted/attached.
		window.requestAnimationFrame(() => {
			const leaf =
				this.contentEl.closest<HTMLElement>(".workspace-leaf-content") ||
				this.containerEl;
			if (!leaf) return;
			const { bg, border } = this.pageColors();
			leaf.addClass("n2h-reader-leaf");
			leaf.style.setProperty("background", bg, "important");
			const header = leaf.querySelector<HTMLElement>(".view-header");
			if (header) {
				header.style.setProperty("background", bg, "important");
				header.style.setProperty("border-bottom", `1px solid ${border}`, "important");
			}
		});
	}

	async onUnloadFile(): Promise<void> {
		const leaf = this.contentEl.closest<HTMLElement>(".workspace-leaf-content");
		if (leaf) {
			leaf.removeClass("n2h-reader-leaf");
			leaf.style.removeProperty("background");
		}
		const header = leaf?.querySelector<HTMLElement>(".view-header");
		if (header) {
			header.style.removeProperty("background");
			header.style.removeProperty("border-bottom");
		}
		this.iframeEl = null;
		this.contentEl.empty();
	}

	private createIframe(hasTts = false): HTMLIFrameElement {
		const iframe = activeDocument.createElement("iframe");
		iframe.setAttribute("title", "Readable HTML");
		iframe.setAttribute(
			"sandbox",
			hasTts
				? "allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-scripts"
				: "allow-same-origin allow-popups allow-popups-to-escape-sandbox"
		);
		iframe.setAttribute(
			"csp",
			[
				"default-src 'none'",
				hasTts ? "script-src 'unsafe-inline'" : "script-src 'none'",
				"object-src 'none'",
				"frame-src 'none'",
				"style-src 'unsafe-inline'",
				"img-src data: file: https: http:",
				"font-src data: file:",
				"media-src data: file:"
			].join("; ")
		);
		iframe.setAttr(
			"style",
			`width: 100%; height: 100%; border: 0; display: block; background: ${this.pageColors().bg};`
		);
		return iframe;
	}

	private injectBaseHref(html: string, baseHref: string | null): string {
		if (!baseHref) {
			return html;
		}

		const parser = new DOMParser();
		const document = parser.parseFromString(html, "text/html");
		let head = document.head;

		if (!head) {
			head = document.createElement("head");
			document.documentElement.prepend(head);
		}

		const existingBase = head.querySelector("base");
		if (existingBase) {
			existingBase.setAttribute("href", baseHref);
		} else {
			const base = document.createElement("base");
			base.setAttribute("href", baseHref);
			head.prepend(base);
		}

		this.preserveSrcdocFragmentLinks(document);
		return `<!doctype html>\n${document.documentElement.outerHTML}`;
	}

	private preserveSrcdocFragmentLinks(document: Document): void {
		document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
			const href = link.getAttribute("href");
			if (href && href !== "#") {
				link.setAttribute("href", `about:srcdoc${href}`);
			}
		});
	}

	private getBaseHref(vaultPath: string): string | null {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return null;
		}

		const basePath = normalizePath(this.app.vault.adapter.getBasePath());
		const folderPath = vaultPath.split("/").slice(0, -1).join("/");
		const absoluteFolder = normalizePath([basePath, folderPath].filter(Boolean).join("/"));
		return `${this.pathToFileUri(absoluteFolder)}/`;
	}

	private pathToFileUri(path: string): string {
		const normalized = path.replace(/\\/g, "/");
		const encoded = normalized
			.split("/")
			.map((part) => encodeURIComponent(part))
			.join("/")
			.replace(/^([A-Za-z])%3A/, "$1:");

		return /^[A-Za-z]:\//.test(normalized) ? `file:///${encoded}` : `file://${encoded}`;
	}
}

class ReadableHtmlSettingTab extends PluginSettingTab {
	private voicePanelOpen = false;

	constructor(app: App, private plugin: ReadableHtmlExporterPlugin) {
		super(app, plugin);
	}

	display(): void {
		this.renderSettings();
	}

	private renderSettings(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName(this.plugin.t("settingsTitle")).setHeading();

		// TTS / voice library first — these are the headline features, keep them on top.
		this.renderTtsSettings(containerEl);

		new Setting(containerEl)
			.setName(this.plugin.t("settingLanguageName"))
			.setDesc(this.plugin.t("settingLanguageDesc"))
			.addDropdown((dropdown) => {
					dropdown
						.addOption("zh", this.plugin.t("languageChinese"))
						.addOption("en", this.plugin.t("languageEnglish"))
						.setValue(this.plugin.getInterfaceLanguage())
						.onChange(async (value) => {
							this.plugin.settings.interfaceLanguage = value === "en" ? "en" : "zh";
							await this.plugin.saveSettings();
							new Notice(this.plugin.t("noticeReloadRequired"));
							this.renderSettings();
						});
				});

		new Setting(containerEl)
			.setName(this.plugin.t("settingExportFolderName"))
			.setDesc(this.plugin.t("settingExportFolderDesc"))
			.addText((text) =>
				text
					.setPlaceholder("Read Along")
					.setValue(this.plugin.settings.exportFolder)
					.onChange(async (value) => {
						this.plugin.settings.exportFolder = value.trim() || DEFAULT_SETTINGS.exportFolder;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingStyleName"))
			.setDesc(this.plugin.t("settingStyleDesc"))
			.addDropdown((dropdown) => {
				Object.keys(HTML_STYLE_OPTIONS).forEach((value) => {
					dropdown.addOption(
						value,
						this.plugin.getStyleLabel(value as HtmlStylePreset)
					);
				});

				dropdown.setValue(this.plugin.settings.stylePreset).onChange(async (value) => {
					this.plugin.settings.stylePreset = value as HtmlStylePreset;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(this.plugin.t("settingPreserveFoldersName"))
			.setDesc(this.plugin.t("settingPreserveFoldersDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.preserveFolderStructure)
					.onChange(async (value) => {
						this.plugin.settings.preserveFolderStructure = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingAddTitleName"))
			.setDesc(this.plugin.t("settingAddTitleDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.addTitleFromFilename).onChange(async (value) => {
					this.plugin.settings.addTitleFromFilename = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingWikilinksName"))
			.setDesc(this.plugin.t("settingWikilinksDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.linkWikilinksToHtml).onChange(async (value) => {
					this.plugin.settings.linkWikilinksToHtml = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingOpenHtmlName"))
			.setDesc(this.plugin.t("settingOpenHtmlDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openHtmlInObsidian).onChange(async (value) => {
					this.plugin.settings.openHtmlInObsidian = value;
					await this.plugin.saveSettings();
					new Notice(this.plugin.t("noticeReloadRequired"));
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingLauncherName"))
			.setDesc(this.plugin.t("settingLauncherDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.createLauncherNote).onChange(async (value) => {
					this.plugin.settings.createLauncherNote = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingInsertLinkName"))
			.setDesc(this.plugin.t("settingInsertLinkDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.insertLinkInSource).onChange(async (value) => {
					this.plugin.settings.insertLinkInSource = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settingEmbedImagesName"))
			.setDesc(this.plugin.t("settingEmbedImagesDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.embedLocalImages).onChange(async (value) => {
					this.plugin.settings.embedLocalImages = value;
					await this.plugin.saveSettings();
				})
			);
	}

	private renderTtsSettings(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(this.plugin.t("settingTtsHeading")).setHeading();

		new Setting(containerEl)
			.setName(this.plugin.t("settingTtsEnabledName"))
			.setDesc(this.plugin.t("settingTtsEnabledDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.ttsEnabled).onChange(async (value) => {
					this.plugin.settings.ttsEnabled = value;
					await this.plugin.saveSettings();
					this.renderSettings();
				})
			);

		if (this.plugin.settings.ttsEnabled) {
			new Setting(containerEl)
				.setName(this.plugin.t("settingTtsAccessKeyName"))
				.addText((text) => {
					text.inputEl.type = "password";
					text.setValue(this.plugin.settings.ttsAccessKey).onChange(async (value) => {
						this.plugin.settings.ttsAccessKey = value.trim();
						await this.plugin.saveSettings();
					});
				})
				.then((setting) => {
					setting.descEl.appendText(this.plugin.t("settingTtsAccessKeyDesc") + " ");
					const link = setting.descEl.createEl("a", {
						text: this.plugin.t("settingTtsGetKeyLink"),
						href: "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
					});
					link.setAttr("target", "_blank");
				});

			new Setting(containerEl).setName(this.plugin.t("settingTtsVoiceLibraryName")).setHeading();
			const voiceListEl = containerEl.createDiv({ cls: "n2h-voice-list" });
			this.renderVoiceList(voiceListEl);
		}
	}

	private hueFor(seed: string): number {
		let h = 0;
		for (let i = 0; i < seed.length; i++) {
			h = (h * 31 + seed.charCodeAt(i)) % 360;
		}
		return h;
	}

	private renderVoiceList(listEl: HTMLElement): void {
		listEl.empty();
		const voices = this.plugin.settings.ttsVoices;
		const selectedType = this.plugin.settings.ttsVoiceType;
		const selected = voices.find((v) => v.voiceType === selectedType);

		// Collapsed trigger: shows only the currently selected voice.
		const trigger = listEl.createDiv({ cls: "n2h-voice-trigger" });
		this.fillVoiceRow(trigger, selected, false);
		trigger.createSpan({ cls: "n2h-voice-chevron", text: this.voicePanelOpen ? "▴" : "▾" });
		trigger.addEventListener("click", () => {
			this.voicePanelOpen = !this.voicePanelOpen;
			this.renderVoiceList(listEl);
		});

		if (!this.voicePanelOpen) {
			return;
		}

		const panel = listEl.createDiv({ cls: "n2h-voice-panel" });
		const scroll = panel.createDiv({ cls: "n2h-voice-scroll" });

		voices.forEach((voice, index) => {
			const row = scroll.createDiv({ cls: "n2h-voice-row" });
			this.fillVoiceRow(row, voice, voice.voiceType === selectedType);

			const del = row.createEl("button", {
				cls: "n2h-voice-del",
				attr: { "aria-label": this.plugin.t("ttsVoiceDelete"), title: this.plugin.t("ttsVoiceDelete") }
			});
			setIcon(del, "trash-2");
			del.addEventListener("click", (e) => {
				void (async () => {
					e.stopPropagation();
					this.plugin.settings.ttsVoices.splice(index, 1);
					if (voice.voiceType === this.plugin.settings.ttsVoiceType) {
						this.plugin.settings.ttsVoiceType = this.plugin.settings.ttsVoices[0]?.voiceType || "";
					}
					await this.plugin.saveSettings();
					this.renderVoiceList(listEl);
				})();
			});

			row.addEventListener("click", () => {
				void (async () => {
					this.plugin.settings.ttsVoiceType = voice.voiceType;
					this.voicePanelOpen = false;
					await this.plugin.saveSettings();
					this.renderVoiceList(listEl);
				})();
			});
		});

		// Add a custom voice.
		const addRow = panel.createDiv({ cls: "n2h-voice-addrow" });
		const nameInput = addRow.createEl("input", {
			cls: "n2h-voice-input n2h-voice-input-name",
			attr: { type: "text", placeholder: this.plugin.t("ttsVoiceAddNamePlaceholder") }
		});
		const idInput = addRow.createEl("input", {
			cls: "n2h-voice-input n2h-voice-input-id",
			attr: { type: "text", placeholder: "voice_type" }
		});
		const testBtn = addRow.createEl("button", { text: this.plugin.t("ttsVoiceTest") });
		const addBtn = addRow.createEl("button", { cls: "mod-cta", text: this.plugin.t("ttsVoiceAddButton") });

		// Inline status card for the test action (spinner → result), in place of a toast.
		const testStatus = panel.createDiv({ cls: "n2h-test-status" });

		testBtn.addEventListener("click", () => {
			void (async () => {
				const vt = (idInput.value.trim() || this.plugin.settings.ttsVoiceType || "").trim();
				const voice = this.plugin.settings.ttsVoices.find((v) => v.voiceType === vt);
				const sub = vt ? (voice && voice.name ? voice.name + "  ·  " + vt : vt) : "";
				this.renderTestStatus(testStatus, "loading", this.plugin.t("ttsVoiceTesting"), sub);
				testBtn.setAttr("disabled", "true");
				try {
					const bytes = await this.plugin.synthesizeTestSample(idInput.value.trim());
					const buf = new Uint8Array(bytes.length);
					buf.set(bytes);
					const url = URL.createObjectURL(new Blob([buf], { type: "audio/mp3" }));
					const audio = new Audio(url);
					audio.addEventListener("ended", () => URL.revokeObjectURL(url));
					await audio.play();
					this.renderTestStatus(testStatus, "ok", this.plugin.t("ttsVoiceTestOk"), sub);
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					this.renderTestStatus(testStatus, "error", this.plugin.t("ttsVoiceTestFailTitle"), msg);
				} finally {
					testBtn.removeAttribute("disabled");
				}
			})();
		});
		addBtn.addEventListener("click", () => {
			void (async () => {
				const newId = idInput.value.trim();
				const newName = nameInput.value.trim();
				if (!newId) {
					new Notice(this.plugin.t("ttsVoiceAddNeedId"));
					return;
				}
				if (this.plugin.settings.ttsVoices.some((v) => v.voiceType === newId)) {
					new Notice(this.plugin.t("ttsVoiceAddDup"));
					return;
				}
				this.plugin.settings.ttsVoices.push({ name: newName || newId, voiceType: newId, hue: this.hueFor(newId) });
				this.plugin.settings.ttsVoiceType = newId;
				await this.plugin.saveSettings();
				this.renderVoiceList(listEl);
			})();
		});

		// Restore the preset voices.
		const footer = panel.createDiv({ cls: "n2h-voice-footer" });
		const restoreBtn = footer.createEl("button", { text: this.plugin.t("ttsVoiceRestore") });
		restoreBtn.addEventListener("click", () => {
			void (async () => {
				const existing = new Set(this.plugin.settings.ttsVoices.map((v) => v.voiceType));
				for (const v of DEFAULT_TTS_VOICES) {
					if (!existing.has(v.voiceType)) this.plugin.settings.ttsVoices.push({ ...v });
				}
				await this.plugin.saveSettings();
				this.renderVoiceList(listEl);
			})();
		});
	}

	private fillVoiceRow(row: HTMLElement, voice: TtsVoice | undefined, showCheck: boolean): void {
		if (!voice) {
			row.createSpan({ cls: "n2h-voice-sub", text: this.plugin.t("ttsVoicePickPlaceholder") });
			return;
		}
		const label = voice.name || voice.voiceType;
		const hue = typeof voice.hue === "number" ? voice.hue : this.hueFor(voice.voiceType);
		const avatar = row.createSpan({ cls: "n2h-voice-avatar", text: label.charAt(0) });
		avatar.setAttribute("style", `background:hsl(${hue},55%,55%);`);
		const meta = row.createDiv({ cls: "n2h-voice-meta" });
		const nameLine = meta.createDiv({ cls: "n2h-voice-name" });
		nameLine.createSpan({ text: label });
		if (voice.recommended) {
			nameLine.createSpan({ cls: "n2h-voice-badge", text: this.plugin.t("ttsVoiceRecommended") });
		}
		if (showCheck) {
			nameLine.createSpan({ cls: "n2h-voice-check", text: "✓" });
		}
		meta.createDiv({ cls: "n2h-voice-sub", text: voice.voiceType + (voice.style ? "  ·  " + voice.style : "") });
	}

	// Inline test-status card (shadcn "Item"-style): spinner/icon + title + description.
	private renderTestStatus(
		el: HTMLElement,
		state: "loading" | "ok" | "error",
		title: string,
		desc: string
	): void {
		el.empty();
		el.addClass("is-visible");
		const media = el.createDiv({ cls: "n2h-test-media" });
		if (state === "loading") {
			media.addClass("is-loading");
			media.createEl("img", { cls: "n2h-loader-gif", attr: { src: this.plugin.loaderImgSrc() } });
		} else {
			media.createSpan({
				cls: state === "ok" ? "n2h-test-ok" : "n2h-test-err",
				text: state === "ok" ? "✓" : "✗"
			});
		}
		const content = el.createDiv({ cls: "n2h-test-content" });
		content.createDiv({ cls: "n2h-test-title", text: title });
		if (desc) {
			content.createDiv({ cls: "n2h-test-desc", text: desc });
		}
	}

}

const CLEAN_HTML_CSS = `
:root {
	color-scheme: light dark;
	--page-bg: #f4f5f6;
	--paper: #ffffff;
	--ink: #181819;
	--muted: #717274;
	--line: #dddedf;
	--line-soft: #e4e4e5;
	--accent: #0485f7;
	--accent-soft: #e1f0ff;
	--quote-bg: #efeff0;
	--code-bg: #eaeaeb;
	--link: #0485f7;
}

/* Standalone (browser): follow the OS color scheme, unless the host forces light. */
@media (prefers-color-scheme: dark) {
	:root:not(.theme-light) {
		--page-bg: #050606;
		--paper: #17181a;
		--ink: #fbfcfd;
		--muted: #9fa0a2;
		--line: #28292a;
		--line-soft: #212222;
		--accent: #0485f7;
		--accent-soft: #173455;
		--quote-bg: #222324;
		--code-bg: #262728;
		--link: #0485f7;
	}
}

/* Explicit dark — set by the Obsidian view to track Obsidian's own light/dark toggle
   (the iframe's prefers-color-scheme does not follow Obsidian's theme). */
:root.theme-dark {
	color-scheme: dark;
	--page-bg: #050606;
	--paper: #17181a;
	--ink: #fbfcfd;
	--muted: #9fa0a2;
	--line: #28292a;
	--line-soft: #212222;
	--accent: #0485f7;
	--accent-soft: #173455;
	--quote-bg: #222324;
	--code-bg: #262728;
	--link: #0485f7;
}

* {
	box-sizing: border-box;
}

html {
	background: var(--page-bg);
	font-size: 16px;
	scroll-behavior: smooth;
	scroll-padding-top: 1.4rem;
}

body {
	margin: 0;
	color: var(--ink);
	background: var(--page-bg);
	font-family: Georgia, "Times New Roman", "Noto Serif SC", "Songti SC", SimSun, serif;
	line-height: 1.76;
	letter-spacing: 0;
	text-rendering: optimizeLegibility;
	-webkit-font-smoothing: antialiased;
}

.page {
	width: min(100%, 860px);
	margin: 0 auto;
	padding: 2.8rem 1.6rem 5rem;
}

.article-hero {
	width: 100%;
	max-width: 720px;
	margin: 0 auto 2.4rem;
	padding: 1.4rem 0 2rem;
	text-align: center;
	border-bottom: 1px solid var(--line);
	background: transparent;
}

.article-hero h1 {
	max-width: 720px;
	margin: 0 auto;
	color: var(--ink);
	font-size: 2.25rem;
	font-weight: 700;
	line-height: 1.25;
	letter-spacing: 0;
	text-align: center;
}

.article-hero h1 span {
	display: block;
}

.article-deck {
	max-width: 680px;
	margin: 0.95rem auto 0;
	color: var(--muted);
	font-size: 1rem;
	font-style: italic;
	line-height: 1.72;
}

.article-deck p {
	margin: 0;
}

.article-deck strong {
	color: inherit;
	font-weight: 600;
}

.hero-rule {
	width: 3.4rem;
	height: 2px;
	margin: 1.55rem auto 0;
	background: var(--accent);
}

.table-of-contents {
	max-width: 720px;
	margin: 0 auto 3.2rem;
	padding: 1.35rem 1.45rem 1.25rem;
	border: 1px solid var(--line);
	border-radius: 8px;
	background: var(--paper);
}

.table-of-contents h2 {
	margin: 0 0 0.85rem;
	padding: 0;
	border: 0;
	color: var(--muted);
	font-size: 0.9rem;
	font-weight: 700;
	line-height: 1.3;
}

.table-of-contents h2::before {
	content: none;
}

.table-of-contents ol {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.32rem 1.35rem;
	margin: 0;
	padding: 0;
	list-style: none;
	counter-reset: toc;
	font-size: 0.86rem;
	line-height: 1.48;
}

.table-of-contents li {
	margin: 0;
	padding: 0;
	counter-increment: toc;
	break-inside: avoid;
}

.table-of-contents a {
	display: grid;
	grid-template-columns: 1.9em minmax(0, 1fr);
	gap: 0.3rem;
	margin: 0 -0.35rem;
	padding: 0.1rem 0.35rem;
	border-radius: 5px;
	color: var(--ink);
	text-decoration: none;
	cursor: pointer;
	transition: color 160ms ease, background-color 160ms ease;
}

.table-of-contents a::before {
	content: counter(toc) ".";
	color: var(--muted);
	text-align: right;
	transition: color 160ms ease;
}

.table-of-contents a:hover,
.table-of-contents a:focus-visible {
	background: var(--accent-soft);
	color: var(--accent);
}

.table-of-contents a:hover::before,
.table-of-contents a:focus-visible::before {
	color: var(--accent);
}

.side-table-of-contents {
	display: none;
}

.side-toc-title {
	margin: 0 0 0.75rem;
	color: var(--muted);
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
}

.side-table-of-contents ol {
	margin: 0;
	padding: 0;
	list-style: none;
	counter-reset: side-toc;
	font-size: 0.76rem;
	line-height: 1.36;
}

.side-table-of-contents li {
	margin: 0;
	padding: 0;
	counter-increment: side-toc;
}

.side-table-of-contents a {
	display: grid;
	grid-template-columns: 2em minmax(0, 1fr);
	gap: 0.28rem;
	margin: 0 -0.35rem;
	padding: 0.22rem 0.35rem;
	border-radius: 5px;
	color: var(--muted);
	text-decoration: none;
	cursor: pointer;
	transition: color 160ms ease, background-color 160ms ease;
}

.side-table-of-contents a::before {
	content: counter(side-toc) ".";
	color: var(--muted);
	text-align: right;
	transition: color 160ms ease;
}

.side-table-of-contents a:hover,
.side-table-of-contents a:focus-visible {
	background: var(--accent-soft);
	color: var(--accent);
}

.side-table-of-contents a:hover::before,
.side-table-of-contents a:focus-visible::before {
	color: var(--accent);
}

.article-body {
	counter-reset: section;
	width: 100%;
	max-width: 720px;
	margin: 0 auto;
	font-size: 1rem;
}

.article-body > * {
	max-width: 100%;
}

.article-body h2,
.article-body h3,
.article-body h4 {
	color: var(--ink);
	letter-spacing: 0;
	line-height: 1.32;
}

.article-body h2 {
	counter-increment: section;
	position: relative;
	margin: 2.85rem 0 1rem;
	padding: 0;
	border: 0;
	font-size: 1.55rem;
	font-weight: 700;
}

.article-body h2:target {
	color: var(--accent);
}

.article-body h2::before {
	content: counter(section, cjk-ideographic) "、";
	display: inline-block;
	min-width: 2.35em;
	margin-right: 0.2rem;
	color: var(--accent);
	font-weight: 500;
}

.article-body h3 {
	margin: 2.1rem 0 0.72rem;
	font-size: 1.25rem;
	font-weight: 700;
}

.article-body h4 {
	margin: 1.65rem 0 0.58rem;
	font-size: 1.08rem;
	font-weight: 700;
}

p {
	margin: 0.9rem 0;
}

a {
	color: var(--link);
	text-decoration-thickness: 1px;
	text-underline-offset: 0.18em;
}

strong {
	color: var(--accent);
	font-weight: 700;
}

em {
	color: var(--muted);
}

blockquote {
	position: relative;
	margin: 1.55rem 0;
	padding: 0.95rem 1.15rem 0.95rem 1.25rem;
	border: 0;
	border-left: 3px solid var(--line);
	border-radius: 6px;
	background: var(--quote-bg);
	color: var(--ink);
}

blockquote.quote-block {
	color: var(--ink);
}

blockquote.callout-block {
	border: 1px solid var(--line);
	border-left: 4px solid var(--accent);
	background: var(--quote-bg);
}

blockquote.callout-highlight {
	box-shadow: inset 0 0 0 1px var(--line);
}

blockquote.callout-conclusion {
	padding: 1.05rem 1.25rem;
	border: 1px solid var(--line);
	border-top: 3px solid var(--accent);
	border-left-color: var(--line);
	background: var(--paper);
	box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
}

blockquote p:first-child {
	margin-top: 0;
}

blockquote p:last-child {
	margin-bottom: 0;
}

blockquote strong {
	color: var(--accent);
}

blockquote.callout-block p:first-child strong:first-child {
	display: inline-block;
	margin-bottom: 0.25rem;
	padding: 0.06rem 0.42rem;
	border-radius: 999px;
	background: var(--accent-soft);
	color: var(--accent);
	font-size: 0.78rem;
	line-height: 1.45;
}

ul,
ol {
	margin: 0.9rem 0 1.05rem 1.35rem;
	padding: 0;
}

li {
	margin: 0.35rem 0;
	padding-left: 0.25rem;
}

li::marker {
	color: var(--ink);
	font-weight: 600;
}

hr {
	margin: 2.2rem 0;
	border: 0;
	border-top: 1px solid var(--line-soft);
}

.table-scroll {
	max-width: 100%;
	margin: 1.45rem 0;
	border: 1px solid var(--line);
	border-radius: 6px;
	background: var(--paper);
	overflow-x: auto;
}

table {
	width: max-content;
	min-width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	background: var(--paper);
	font-size: 0.84rem;
	line-height: 1.55;
}

thead {
	background: transparent;
}

th {
	background: var(--quote-bg);
	color: var(--ink);
	font-weight: 700;
	white-space: nowrap;
}

th,
td {
	padding: 0.55rem 0.66rem;
	border: 0;
	border-right: 1px solid var(--line);
	border-bottom: 1px solid var(--line);
	text-align: left;
	vertical-align: top;
}

tr > :last-child {
	border-right: 0;
}

tbody tr:last-child td {
	border-bottom: 0;
}

tbody tr:nth-child(even) {
	background: var(--quote-bg);
}

tbody tr:hover {
	background: var(--code-bg);
}

pre,
code {
	font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

code {
	padding: 0.08rem 0.28rem;
	border-radius: 4px;
	background: var(--code-bg);
	font-size: 0.82em;
}

pre {
	position: relative;
	margin: 1.6rem 0;
	padding: 2rem 1rem 1rem;
	border: 1px solid var(--line);
	border-left: 4px solid var(--line);
	border-radius: 6px;
	background: var(--code-bg);
	overflow-x: auto;
	line-height: 1.5;
}

pre::before {
	content: "代码 / 图示";
	position: absolute;
	top: 0.55rem;
	left: 0.9rem;
	color: var(--muted);
	font-family: Georgia, "Times New Roman", "Noto Serif SC", "Songti SC", SimSun, serif;
	font-size: 0.72rem;
	font-weight: 700;
	line-height: 1;
}

pre.code-figure::before {
	content: attr(data-label);
}

pre.code-figure.ascii-figure {
	border-left-color: var(--accent);
	background: var(--code-bg);
}

pre.code-figure.ascii-figure::before {
	color: var(--accent);
}

pre code {
	padding: 0;
	background: transparent;
	font-size: 0.78rem;
}

img {
	display: block;
	max-width: 100%;
	height: auto;
	margin: 1.5rem auto;
}

sup {
	line-height: 0;
}

@media (min-width: 1360px) {
	.side-table-of-contents {
		display: block;
		position: fixed;
		top: 4.6rem;
		right: max(1.2rem, calc((100vw - 860px) / 2 - 14.8rem));
		width: 13rem;
		max-height: calc(100vh - 6rem);
		padding: 0.85rem 0.95rem;
		border-left: 1px solid var(--line-soft);
		background: var(--page-bg);
		overflow: auto;
	}
}

@media (max-width: 780px) {
	html {
		font-size: 16px;
	}

	.page {
		padding: 1.8rem 1rem 3.2rem;
	}

	.article-hero {
		margin-bottom: 1.9rem;
		padding-top: 0.8rem;
		padding-bottom: 1.55rem;
	}

	.article-hero h1 {
		font-size: 1.75rem;
	}

	.article-deck {
		font-size: 0.95rem;
	}

	.table-of-contents {
		margin-bottom: 2.5rem;
		padding: 1.1rem 1rem;
	}

	.table-of-contents ol {
		grid-template-columns: 1fr;
		gap: 0.45rem;
	}

	.article-body h2 {
		margin-top: 2.45rem;
		font-size: 1.35rem;
	}

	.article-body h2::before {
		min-width: 0;
		margin-right: 0.15rem;
	}

	blockquote {
		padding: 0.85rem 0.95rem;
	}

	table {
		font-size: 0.8rem;
	}
}

@media print {
	html,
	body {
		background: #fff;
	}

	.page {
		width: 100%;
		padding: 0;
	}

	.article-hero {
		margin-inline: 0;
		padding-inline: 0;
	}

	a {
		color: inherit;
	}

	.tts-player {
		display: none !important;
	}
}

.page.has-tts-player {
	padding-bottom: 5.5rem;
}

.tts-player {
	position: fixed;
	bottom: 1rem;
	left: 50%;
	z-index: 1000;
	width: calc(100% - 2rem);
	max-width: 680px;
	padding: 0.45rem 0.85rem;
	background: color-mix(in srgb, var(--paper) 82%, transparent);
	backdrop-filter: blur(18px) saturate(180%);
	-webkit-backdrop-filter: blur(18px) saturate(180%);
	border: 1px solid var(--line);
	border-radius: 999px;
	box-shadow: 0 10px 34px rgba(15, 40, 90, 0.14), 0 2px 8px rgba(15, 40, 90, 0.06);
	transform: translate(-50%, 0);
	transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
	will-change: transform;
}

/* Tucked away: capsule slides below the viewport, only the handle peeks. */
.tts-player.is-collapsed {
	transform: translate(-50%, calc(100% + 1rem));
}

.tts-controls {
	display: flex;
	align-items: center;
	gap: 0.55rem;
}

.tts-btn {
	border: none;
	background: none;
	cursor: pointer;
	padding: 0;
	font-size: 1rem;
	color: var(--ink);
	line-height: 1;
}

.tts-play-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.2rem;
	height: 2.2rem;
	border-radius: 50%;
	background: var(--accent);
	color: #fff;
	font-size: 0.9rem;
	flex-shrink: 0;
}

.tts-play-btn:hover {
	opacity: 0.85;
}

/* Quiet progress line: a thin track with an accent fill and a low-key
   playhead dot. It has no motion of its own — the reader's attention
   belongs to the in-text sentence highlight, not the player chrome. */
.tts-progress-wrap {
	flex: 1;
	height: 3px;
	background: var(--line);
	border-radius: 999px;
	cursor: pointer;
	position: relative;
}

.tts-progress-bar {
	position: relative;
	height: 100%;
	width: 0%;
	background: var(--accent);
	border-radius: 999px;
	transition: width 0.25s ease;
}

.tts-progress-bar::after {
	content: "";
	position: absolute;
	right: 0;
	top: 50%;
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: var(--accent);
	transform: translate(50%, -50%);
	box-shadow: 0 1px 4px rgba(15, 40, 90, 0.25);
	opacity: 0;
	transition: opacity 0.2s ease;
}

.tts-progress-wrap:hover .tts-progress-bar::after,
.tts-player.is-playing .tts-progress-bar::after {
	opacity: 1;
}

/* Animated waveform after the progress line — a live "playing" indicator.
   A calm static silhouette when paused; the bars pulse from their baseline
   while audio plays (driven by .is-playing on the player). */
.tts-eq {
	display: inline-flex;
	align-items: flex-end;
	gap: 2px;
	height: 1rem;
	flex-shrink: 0;
}

.tts-eq i {
	display: block;
	width: 3px;
	border-radius: 2px;
	background: var(--accent);
	opacity: 0.85;
	transform-origin: bottom;
}

.tts-eq i:nth-child(1) { height: 45%; animation-delay: -0.20s; }
.tts-eq i:nth-child(2) { height: 75%; animation-delay: -0.55s; }
.tts-eq i:nth-child(3) { height: 100%; animation-delay: -0.80s; }
.tts-eq i:nth-child(4) { height: 60%; animation-delay: -0.35s; }
.tts-eq i:nth-child(5) { height: 40%; animation-delay: -0.65s; }

.tts-player.is-playing .tts-eq i {
	animation: tts-eq-bounce 0.85s ease-in-out infinite;
}

@keyframes tts-eq-bounce {
	0%, 100% { transform: scaleY(0.45); }
	50% { transform: scaleY(1); }
}

.tts-time {
	display: none;
	font-size: 0.72rem;
	color: var(--muted);
	white-space: nowrap;
	font-family: "SFMono-Regular", Consolas, monospace;
	min-width: 6.5em;
}

.tts-skip-btn {
	font-size: 0.72rem;
	color: var(--muted);
	font-weight: 600;
}

.tts-skip-btn:hover {
	color: var(--ink);
}

.tts-speed {
	border: 1px solid var(--line);
	border-radius: 4px;
	background: var(--paper);
	color: var(--ink);
	font-size: 0.72rem;
	padding: 0.15rem 0.25rem;
	cursor: pointer;
}

/* The native dropdown popup ignores color-scheme when a custom background is set,
   so theme its options explicitly — otherwise it stays white in dark mode. */
.tts-speed option {
	background: var(--paper);
	color: var(--ink);
}

.tts-s {
	transition: background-color 300ms ease, color 300ms ease;
	border-radius: 2px;
}

.tts-s.tts-active {
	background: var(--accent-soft);
	color: var(--accent);
}

body.tts-playing .article-body p,
body.tts-playing .article-body li,
body.tts-playing .article-body blockquote p {
	color: var(--muted);
	transition: color 300ms ease;
}

body.tts-playing .article-body .tts-s.tts-active {
	color: var(--ink);
}

body.tts-playing .article-body .tts-s.tts-active strong {
	color: var(--accent);
}

.tts-collapse-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	font-size: 0.7rem;
	color: var(--muted);
	border-radius: 50%;
	flex-shrink: 0;
}

.tts-collapse-btn:hover {
	color: var(--ink);
	background: var(--accent-soft);
}

/* Peeking grip shown only while the capsule is tucked away. */
.tts-handle {
	position: absolute;
	left: 50%;
	top: -1.1rem;
	transform: translateX(-50%);
	display: none;
	align-items: flex-end;
	justify-content: center;
	width: 3.4rem;
	height: 1.55rem;
	padding-bottom: 0.32rem;
	border: 1px solid var(--line);
	border-bottom: none;
	border-radius: 14px 14px 0 0;
	background: color-mix(in srgb, var(--paper) 86%, transparent);
	backdrop-filter: blur(18px) saturate(180%);
	-webkit-backdrop-filter: blur(18px) saturate(180%);
	box-shadow: 0 -6px 18px rgba(15, 40, 90, 0.1);
	cursor: pointer;
}

.tts-handle:hover {
	background: var(--paper);
}

.tts-player.is-collapsed .tts-handle {
	display: inline-flex;
}

/* Collapsed-state mini waveform on the peeking handle: a clear static
   silhouette when paused, and it pulses together with playback (it inherits
   the .is-playing animation from .tts-eq since it lives inside the player). */
.tts-eq-mini {
	height: 0.95rem;
	gap: 2px;
}

.tts-eq-mini i {
	width: 3px;
	opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
	.tts-player { transition: none; }
	.tts-progress-bar { transition: none; }
	.tts-player.is-playing .tts-eq i { animation: none; }
}

@media (max-width: 780px) {
	.tts-skip-btn {
		display: none;
	}

	.tts-controls {
		gap: 0.4rem;
	}

	.tts-player {
		padding: 0.4rem 0.7rem;
	}

	.tts-time {
		min-width: 0;
	}
}
`.trim();

const TTS_PLAYER_JS = `
(function() {
	document.addEventListener("DOMContentLoaded", function() {
		var audio = document.getElementById("tts-audio");
		var playBtn = document.getElementById("tts-play-btn");
		var progressWrap = document.getElementById("tts-progress-wrap");
		var progressBar = document.getElementById("tts-progress-bar");
		var timeEl = document.getElementById("tts-time");
		var skipBack = document.getElementById("tts-skip-back");
		var skipForward = document.getElementById("tts-skip-forward");
		var speedSelect = document.getElementById("tts-speed");
		var player = document.getElementById("tts-player");
		var collapseBtn = document.getElementById("tts-collapse");
		var handle = document.getElementById("tts-handle");
		var dataEl = document.getElementById("tts-data");
		if (!audio || !playBtn || !dataEl) return;

		var clips = [];
		try { clips = JSON.parse(dataEl.textContent || "[]"); } catch (e) {}
		if (!clips.length) return;

		var audioByIdx = {};
		var order = [];
		clips.forEach(function(c) { audioByIdx[c.idx] = c.audio; order.push(c.idx); });
		order.sort(function(a, b) { return a - b; });

		var spanByIdx = {};
		document.querySelectorAll(".tts-s").forEach(function(s) {
			var i = parseInt(s.getAttribute("data-idx") || "-1", 10);
			if (i < 0) return;
			spanByIdx[i] = s;
			if (audioByIdx[i] !== undefined) {
				s.style.cursor = "pointer";
				s.addEventListener("click", function() { playAt(i); });
			}
		});

		var pos = -1;   // index into order[]
		var rate = 1;

		function highlight(idx) {
			Object.keys(spanByIdx).forEach(function(k) { spanByIdx[k].classList.remove("tts-active"); });
			if (idx >= 0 && spanByIdx[idx]) {
				spanByIdx[idx].classList.add("tts-active");
				spanByIdx[idx].scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}

		function updateProgress() {
			var clipFrac = (audio.duration && isFinite(audio.duration)) ? (audio.currentTime / audio.duration) : 0;
			var frac = order.length ? (pos + clipFrac) / order.length : 0;
			if (progressBar) progressBar.style.width = (Math.min(1, Math.max(0, frac)) * 100) + "%";
			if (timeEl) timeEl.textContent = (Math.max(0, pos) + 1) + " / " + order.length;
		}

		function stopAll() {
			audio.pause();
			highlight(-1);
			document.body.classList.remove("tts-playing");
			if (player) player.classList.remove("is-playing");
			playBtn.textContent = "\\u25B6";
			if (progressBar) progressBar.style.width = "0%";
			pos = -1;
			if (timeEl) timeEl.textContent = "0 / " + order.length;
		}

		function loadPos(p, autoplay) {
			if (p < 0 || p >= order.length) { stopAll(); return; }
			pos = p;
			var idx = order[p];
			audio.src = "data:audio/mp3;base64," + audioByIdx[idx];
			audio.playbackRate = rate;
			highlight(idx);
			updateProgress();
			if (autoplay) { var pr = audio.play(); if (pr && pr.catch) pr.catch(function() {}); }
		}

		function playAt(idx) {
			var p = order.indexOf(idx);
			if (p >= 0) loadPos(p, true);
		}

		playBtn.addEventListener("click", function() {
			if (audio.paused) {
				if (pos < 0) loadPos(0, true);
				else { var pr = audio.play(); if (pr && pr.catch) pr.catch(function() {}); }
			} else {
				audio.pause();
			}
		});

		audio.addEventListener("play", function() {
			playBtn.textContent = "\\u275A\\u275A";
			document.body.classList.add("tts-playing");
			if (player) player.classList.add("is-playing");
		});
		audio.addEventListener("pause", function() {
			if (!audio.ended) playBtn.textContent = "\\u25B6";
			if (player) player.classList.remove("is-playing");
		});
		audio.addEventListener("timeupdate", updateProgress);
		audio.addEventListener("ended", function() {
			if (pos + 1 < order.length) loadPos(pos + 1, true);
			else stopAll();
		});

		if (progressWrap) {
			progressWrap.addEventListener("click", function(e) {
				var rect = progressWrap.getBoundingClientRect();
				var frac = (e.clientX - rect.left) / rect.width;
				var p = Math.floor(frac * order.length);
				loadPos(Math.min(order.length - 1, Math.max(0, p)), true);
			});
		}
		if (skipBack) {
			skipBack.addEventListener("click", function() {
				loadPos(Math.max(0, (pos < 0 ? 0 : pos) - 1), true);
			});
		}
		if (skipForward) {
			skipForward.addEventListener("click", function() {
				loadPos(Math.min(order.length - 1, (pos < 0 ? -1 : pos) + 1), true);
			});
		}
		if (speedSelect) {
			speedSelect.addEventListener("change", function() {
				rate = parseFloat(speedSelect.value) || 1;
				audio.playbackRate = rate;
			});
		}

		// --- floating show / hide -------------------------------------------
		// pinnedCollapsed is sticky: once the user manually collapses, scrolling
		// up will not auto-reveal the capsule until they tap the handle.
		var pinnedCollapsed = false;
		function setCollapsed(on) {
			if (!player) return;
			player.classList.toggle("is-collapsed", on);
		}
		if (collapseBtn) {
			collapseBtn.addEventListener("click", function() {
				pinnedCollapsed = true;
				setCollapsed(true);
			});
		}
		if (handle) {
			handle.addEventListener("click", function() {
				pinnedCollapsed = false;
				setCollapsed(false);
			});
		}

		var lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
		var ticking = false;
		function onScroll() {
			var y = window.pageYOffset || document.documentElement.scrollTop || 0;
			var dy = y - lastY;
			if (Math.abs(dy) > 6) {
				if (dy > 0 && y > 80) {
					setCollapsed(true);              // scrolling down -> hide
				} else if (dy < 0 && !pinnedCollapsed) {
					setCollapsed(false);             // scrolling up -> reveal
				}
				lastY = y;
			}
			ticking = false;
		}
		window.addEventListener("scroll", function() {
			if (!ticking) {
				window.requestAnimationFrame(onScroll);
				ticking = true;
			}
		}, { passive: true });

		if (timeEl) timeEl.textContent = "0 / " + order.length;
	});
})();
`.trim();
