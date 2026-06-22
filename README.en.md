<div align="center">

# Read Along · 语音伴读

[中文](README.md) · **English**

Export Markdown notes into clean, offline-readable web pages — with optional "listen while you read": sentence-by-sentence narration that highlights each sentence as it plays.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-1.5.0%2B-7c3aed.svg)
![Platform](https://img.shields.io/badge/platform-Desktop-555.svg)
![Version](https://img.shields.io/badge/version-0.5.8-green.svg)

</div>

---

## Overview

**Read Along (语音伴读)** is an Obsidian plugin. At its core it is a **deep-reading exporter**: it turns crowded Markdown notes into article-, report-, and booklet-like reading pages. On top of that, **Read Along** narrates the whole note sentence-by-sentence via TTS, **highlighting the current sentence as it plays**, driven by a small floating player (play / pause, speed, previous · next sentence, progress bar) — so long notes can be **listened to while you read**.

Exported `.html` is fully self-contained (inline CSS, optional inline images and audio) and needs no network at read time — double-click to open it in a browser, or read it right inside Obsidian.

**Great for**

- Turning long notes, research docs, year-end reviews, and deep articles into a more comfortable reading version;
- "Listening" to long-form text — commuting, resting your eyes, or going through content a different way;
- Auto-generated clickable table of contents for quick navigation in long notes;
- Offline archiving and sharing: pure CSS and inline assets, readable with no connection.

## Preview

![Before / after: Markdown to a Read Along reading page](assets/before-after-read-along.png)

![Floating table of contents and the redesigned data table](assets/1.png)

![Full reading page: TOC, table, and the side floating TOC](assets/2.png)

![Read Along page: highlighting, player, and floating TOC](assets/3.png)

## Features

- **🔊 Read Along (optional):** synthesizes the note sentence-by-sentence via TTS and embeds the audio into the exported page, with a floating player (play / pause, speed, prev / next sentence, progress bar) and **sentence highlighting synced to playback**.
- **📄 Self-contained export:** export the current note or a whole folder to `.html` — inline CSS, optional inline images and audio, no read-time network dependency.
- **📖 Clean reading layout:** narrow body, serif typography, clear heading hierarchy, a clickable table of contents, tables, code blocks, blockquotes, highlighted notes, conclusion callouts, and ASCII-diagram blocks.
- **🧭 In-app reading:** registers an `.html` reader view so exported pages open straight from the file explorer, without leaving your vault.
- **🔗 Source back-link:** optionally inserts a tidy back-link at the top of the source note — and it resolves correctly even when the export path contains `#`.
- **🗂️ Structure & links preserved:** preserves folder structure, converts wiki-links to same-name HTML pages, and embeds local images as data URIs (all optional).
- **🌐 Bilingual UI:** Chinese / English menus and settings. Desktop-first in the current version.

## Install

### Manual

1. Download these two files from a Release: `main.js` and `manifest.json`.
2. Create the plugin folder inside your vault:

   ```text
   .obsidian/plugins/read-along/
   ```

3. Put `main.js` and `manifest.json` in that folder.
4. Restart (or reload) Obsidian.
5. Enable **Read Along (语音伴读)** under Community plugins.

## Use

**Export the current note** — open the command palette and run:

```text
语音伴读: 导出当前笔记为语音伴读页面
```

You can also **right-click** a Markdown file or folder in the file explorer and choose the export command. Exported files are saved to `Read Along/` by default (configurable in settings).

The settings also let you change the export folder, style preset, folder-structure behavior, wiki-link conversion, image embedding, in-app HTML reading, launcher-note generation, and source-note back-link insertion.

### Enable Read Along

1. Open the plugin settings and turn on **TTS (语音合成)**;
2. Paste your **own Volcengine (火山引擎) speech-synthesis API key**;
3. Pick a voice.

The next export then bakes the per-sentence audio and synced highlighting into the page.

![TTS (语音合成) settings: enable Read Along, paste your API key, and pick a voice](assets/tts-settings.png)

## Privacy

The HTML export itself runs entirely **locally** — your note content is never uploaded for the page conversion.

**Read Along is the one exception:** when TTS is enabled, the note's sentences are sent to Volcengine's (火山引擎) speech-synthesis API using *your own* API key, and the returned audio is embedded into the exported page. Leave Read Along off and nothing ever leaves your vault.

## Development

```bash
npm install
npm run build
```

The production build writes `main.js` to the repository root.

> **Release:** for Obsidian community releases, the GitHub release tag must exactly match the version in `manifest.json`, **without a `v` prefix**; the release assets must include `main.js` and `manifest.json` as separate files.

## Credits & License

Based on the open-source project [notes-to-html-pages](https://github.com/afanos/notes-to-html-pages) by Afan (MIT). The original copyright notice is retained in `LICENSE`; this fork adds the Read Along (语音伴读) branding and features (Read Along narration, `#` path-link fixes, and more). Thanks to the original author.

Released under the [MIT](LICENSE) license.
