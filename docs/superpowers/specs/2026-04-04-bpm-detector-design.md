# BPM Detector - Design Spec

## Overview

音声ファイルをブラウザ内で完全に処理し、BPMとビート位置を自動検出するWebアプリ。
サーバー通信なし。音声データは一切外部に送信されない。

### 対象ユーザー
- 舞台スタッフ（自チーム向け社内ツール）

### 解決する課題
- 舞台スタッフがBPMを手動タップで計測していた作業を自動化
- 楽曲だけでなくSE/効果音の繰り返しパターンも検出対象

### 将来展望
- ネイティブアプリ化を視野に入れた設計

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (fully client-side)                     │
│                                                   │
│  ┌───────────┐   ┌──────────────┐   ┌─────────┐ │
│  │ Audio     │   │ Analysis     │   │ UI      │ │
│  │ Engine    │──▶│ Engine       │──▶│ Layer   │ │
│  │           │   │ (Essentia.js)│   │ (React) │ │
│  └───────────┘   └──────────────┘   └─────────┘ │
│   Web Audio API    WASM Worker       Next.js     │
│   - Decode         - BPM detection   - Waveform  │
│   - Playback       - Beat tracking   - Beat edit │
│   - PCM extract    - Onset detection - BPM graph │
└─────────────────────────────────────────────────┘
  No server communication. Static hosting only.
```

### Data Flow

1. ファイル読み込み → `AudioContext.decodeAudioData()` → `AudioBuffer`
2. `AudioBuffer` → モノラル `Float32Array` に変換
3. `Float32Array` を Transferable として Web Worker に転送（コピーなし）
4. Worker 内で Essentia.js (WASM) により解析
5. 結果（`AnalysisResult`）をメインスレッドに返却
6. UI に反映（波形、ビートマーカー、BPMグラフ）

---

## Tech Stack

| Category | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) | ユーザーの既存スタック。`output: 'export'` で静的ビルド |
| Analysis | Essentia.js (WASM) | 学術的に検証済みのBPM検出アルゴリズム |
| Audio | Web Audio API | ブラウザ標準。デコード・再生を担当 |
| State | jotai | アトミックな状態管理。個別atom で不要な再レンダリング回避 |
| UI | Tailwind CSS + shadcn/ui | 高速なUI構築 |
| Waveform | Canvas 2D (custom) | ビートマーカー操作との統合が容易 |
| Hosting | Static (Vercel / GitHub Pages / S3) | サーバー不要 |

---

## Analysis Engine

### Detection Modes

#### Music Mode (楽曲モード)
- Algorithm: Essentia `RhythmExtractor2013`
- Output: 全体BPM, ビート位置配列, 信頼度スコア
- 用途: ドラム/ベース等のビートがある音楽

#### SE Mode (SE/効果音モード)
- Algorithm: Essentia `OnsetDetection` (energy / hfc)
- Output: オンセット位置配列 → パターン周期性からBPM推定
- 用途: 規則的な効果音パターン、照明キュー用音源

### BPM Curve Calculation
- ビート間隔（隣接ビート位置の差分）から区間BPMを算出
- 時間軸グラフ用の `BpmPoint[]` を生成

### Worker Architecture
- Essentia.js WASM は Web Worker 内で実行
- メインスレッドをブロックしない
- WASM ファイルは `public/essentia-wasm/` から動的ロード

---

## Data Types

```typescript
interface Beat {
  time: number;       // seconds
  confidence: number; // 0-1
  manual: boolean;    // true if manually added/edited
}

interface BpmPoint {
  time: number;       // seconds
  bpm: number;        // BPM at this point
}

interface AnalysisResult {
  bpm: number;            // overall estimated BPM
  beats: Beat[];          // beat positions
  bpmCurve: BpmPoint[];   // BPM over time
  confidence: number;     // overall confidence 0-1
}
```

---

## UI Design

### Screen Layout

```
┌──────────────────────────────────────────────┐
│  Header: App name + Mode selector (Music/SE)  │
├──────────────────────────────────────────────┤
│  File Drop Zone                               │
│  "Drag & drop audio file or click to select"  │
├──────────────────────────────────────────────┤
│  BPM Display: ● 128.0 BPM  (Confidence: 92%) │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐    │
│  │  Waveform View                        │    │
│  │  ┃  ┃ ┃  ┃ ┃  ┃ ┃  ← beat markers   │    │
│  │  ▁▂▃▅▇▅▃▂▁▂▃▅▇▅▃▂▁  ← waveform      │    │
│  │  0:00            0:30          1:00   │    │
│  └──────────────────────────────────────┘    │
│  [▶ Play] [■ Stop]  ───●─────── 0:15 / 1:00 │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐    │
│  │  BPM Curve Graph                      │    │
│  │  130 ┤      ╭─╮                       │    │
│  │  128 ┤──╮╭──╯ ╰──╮╭──               │    │
│  │  126 ┤  ╰╯       ╰╯                  │    │
│  │      0:00            0:30      1:00   │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Beat Marker Interactions

| Action | Behavior |
|---|---|
| Drag marker | Adjust beat position |
| Right-click / long-press marker | Delete beat |
| Double-click waveform | Add manual beat at position |
| Ctrl+Z / Cmd+Z | Undo last action |

### Waveform View Features

- Zoom: mouse wheel / pinch to zoom time axis
- Scroll: drag to scroll horizontally
- Playback sync: cursor line follows playback, waveform auto-scrolls
- Performance: downsample for large files

---

## Project Structure

```
bpm-detector/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── FileDropZone.tsx
│   │   ├── BpmDisplay.tsx
│   │   ├── WaveformView.tsx
│   │   ├── BpmGraph.tsx
│   │   ├── PlaybackControls.tsx
│   │   └── ModeSelector.tsx
│   │
│   ├── engine/
│   │   ├── audio.ts            # Web Audio API wrapper
│   │   ├── analyzer.ts         # Worker request management
│   │   └── worker.ts           # Web Worker (Essentia.js)
│   │
│   ├── store/
│   │   ├── audioAtoms.ts       # audioBuffer, playbackState, currentTime
│   │   ├── analysisAtoms.ts    # beats, bpmCurve, bpm, confidence
│   │   └── uiAtoms.ts          # zoom, scroll, mode
│   │
│   └── types/
│       └── index.ts
│
├── public/
│   └── essentia-wasm/
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Design Decisions

- **SPA**: Single page, no routing needed
- **engine/ separation**: Analysis logic fully decoupled from UI for future native app migration
- **Worker isolation**: `worker.ts` bundled separately by Next.js
- **WASM in public/**: Dynamic load, not included in main bundle

---

## Supported Formats

Supported via browser's `AudioContext.decodeAudioData()`:

| Format | Browser Support |
|---|---|
| MP3 | All |
| WAV | All |
| AAC / M4A | All |
| OGG / Vorbis | Chrome, Firefox (not Safari) |
| FLAC | Chrome, Edge |

### Constraints

- Stereo → mono conversion (BPM detection doesn't need stereo, halves memory)
- Sample rate: use original (Essentia handles resampling internally)
- No file size limit (memory-dependent), but show processing time estimate for long files

### Error Handling

- Unsupported format: "This file format is not supported"
- Decode failure: "Could not read this file"

---

## Security

- No server communication whatsoever
- Audio files never leave the browser
- No cookies, no analytics, no external requests
- Static hosting only (no server-side code)
