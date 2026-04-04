# BPM Detector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based BPM detection app that analyzes audio files entirely client-side using Web Audio API + Essentia.js (WASM).

**Architecture:** Next.js static SPA with three layers — Audio Engine (Web Audio API for decode/playback), Analysis Engine (Essentia.js in Web Worker for BPM/beat detection), UI Layer (React + jotai + Canvas). No server communication.

**Tech Stack:** Next.js 15, React 19, Essentia.js 0.1.3, jotai, Tailwind CSS v4, shadcn/ui, Recharts, Vitest, Biome, pnpm

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with metadata, fonts
│   ├── page.tsx                # Main SPA page, composes all components
│   └── globals.css             # Tailwind v4 imports
│
├── components/
│   ├── FileDropZone.tsx        # Drag & drop / file select for audio files
│   ├── BpmDisplay.tsx          # Large BPM value + confidence badge
│   ├── ModeSelector.tsx        # Music / SE mode toggle
│   ├── WaveformView.tsx        # Canvas waveform + beat markers + interactions
│   ├── PlaybackControls.tsx    # Play/Stop buttons + seek bar + time display
│   └── BpmGraph.tsx            # Recharts line chart for BPM over time
│
├── engine/
│   ├── audio.ts                # decodeAudioFile(), createPlayback(), toMono()
│   ├── analyzer.ts             # AnalysisManager class — sends work to worker, returns AnalysisResult
│   └── worker.ts               # Web Worker — loads Essentia WASM, runs RhythmExtractor2013 / OnsetDetection
│
├── store/
│   ├── audioAtoms.ts           # audioBuffer, fileName, duration, playbackState, currentTime
│   ├── analysisAtoms.ts        # beats, bpmCurve, bpm, confidence, analysisMode, isAnalyzing
│   └── uiAtoms.ts              # zoom, scrollOffset, undoStack
│
├── types/
│   └── index.ts                # Beat, BpmPoint, AnalysisResult, AnalysisMode, PlaybackState
│
└── lib/
    └── waveform.ts             # drawWaveform(), drawBeatMarkers(), drawPlayhead() — Canvas helpers
```

```
public/
└── (essentia WASM files are loaded from node_modules via worker import)

biome.json                      # Biome config
tsconfig.json                   # TypeScript config
next.config.ts                  # WASM + Worker webpack config
postcss.config.mjs              # Tailwind v4 PostCSS
vitest.config.ts                # Vitest with jsdom
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `biome.json`
- Create: `vitest.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
.next/
out/
*.tsbuildinfo
.env*.local
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    config.module?.rules?.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "ignore": [".next", "out", "node_modules"]
  },
  "formatter": {
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

- [ ] **Step 6: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 7: Create `src/app/globals.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 8: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BPM Detector",
  description: "Browser-based BPM detection tool for audio files",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Create `src/app/page.tsx` (placeholder)**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">BPM Detector</h1>
      <p className="mt-4 text-gray-400">Coming soon</p>
    </main>
  );
}
```

- [ ] **Step 10: Initialize shadcn/ui**

Run: `pnpm dlx shadcn@latest init -d`

This sets up `components.json` and `lib/utils.ts`.

- [ ] **Step 11: Verify build**

Run: `pnpm build`
Expected: Build succeeds, `out/` directory is created.

- [ ] **Step 12: Verify lint and typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: No errors.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Biome, Vitest, shadcn/ui"
```

---

## Task 2: Types and Store

**Files:**
- Create: `src/types/index.ts`
- Create: `src/store/audioAtoms.ts`
- Create: `src/store/analysisAtoms.ts`
- Create: `src/store/uiAtoms.ts`
- Test: `src/__tests__/store/analysisAtoms.test.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export interface Beat {
  time: number;
  confidence: number;
  manual: boolean;
}

export interface BpmPoint {
  time: number;
  bpm: number;
}

export interface AnalysisResult {
  bpm: number;
  beats: Beat[];
  bpmCurve: BpmPoint[];
  confidence: number;
}

export type AnalysisMode = "music" | "se";

export type PlaybackState = "idle" | "playing" | "paused";
```

- [ ] **Step 2: Create `src/store/audioAtoms.ts`**

```typescript
import { atom } from "jotai";
import type { PlaybackState } from "@/types";

export const audioBufferAtom = atom<AudioBuffer | null>(null);
export const fileNameAtom = atom<string>("");
export const durationAtom = atom<number>(0);
export const playbackStateAtom = atom<PlaybackState>("idle");
export const currentTimeAtom = atom<number>(0);
```

- [ ] **Step 3: Create `src/store/analysisAtoms.ts`**

```typescript
import { atom } from "jotai";
import type { AnalysisMode, AnalysisResult, Beat, BpmPoint } from "@/types";

export const analysisModeAtom = atom<AnalysisMode>("music");
export const isAnalyzingAtom = atom<boolean>(false);
export const bpmAtom = atom<number>(0);
export const confidenceAtom = atom<number>(0);
export const beatsAtom = atom<Beat[]>([]);
export const bpmCurveAtom = atom<BpmPoint[]>([]);

export const setAnalysisResultAtom = atom(null, (_get, set, result: AnalysisResult) => {
  set(bpmAtom, result.bpm);
  set(confidenceAtom, result.confidence);
  set(beatsAtom, result.beats);
  set(bpmCurveAtom, result.bpmCurve);
});
```

- [ ] **Step 4: Create `src/store/uiAtoms.ts`**

```typescript
import { atom } from "jotai";
import type { Beat } from "@/types";

export const zoomAtom = atom<number>(1);
export const scrollOffsetAtom = atom<number>(0);

interface UndoEntry {
  beats: Beat[];
}

export const undoStackAtom = atom<UndoEntry[]>([]);
```

- [ ] **Step 5: Write test for `setAnalysisResultAtom`**

Create `src/__tests__/store/analysisAtoms.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createStore } from "jotai";
import {
  bpmAtom,
  confidenceAtom,
  beatsAtom,
  bpmCurveAtom,
  setAnalysisResultAtom,
} from "@/store/analysisAtoms";
import type { AnalysisResult } from "@/types";

describe("setAnalysisResultAtom", () => {
  it("sets all analysis atoms from AnalysisResult", () => {
    const store = createStore();
    const result: AnalysisResult = {
      bpm: 128,
      confidence: 0.92,
      beats: [
        { time: 0.5, confidence: 0.9, manual: false },
        { time: 1.0, confidence: 0.85, manual: false },
      ],
      bpmCurve: [
        { time: 0.5, bpm: 120 },
        { time: 1.0, bpm: 128 },
      ],
    };

    store.set(setAnalysisResultAtom, result);

    expect(store.get(bpmAtom)).toBe(128);
    expect(store.get(confidenceAtom)).toBe(0.92);
    expect(store.get(beatsAtom)).toHaveLength(2);
    expect(store.get(bpmCurveAtom)).toHaveLength(2);
  });
});
```

- [ ] **Step 6: Run test**

Run: `pnpm test:run src/__tests__/store/analysisAtoms.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/types src/store src/__tests__
git commit -m "feat: add types and jotai store atoms"
```

---

## Task 3: Audio Engine

**Files:**
- Create: `src/engine/audio.ts`
- Test: `src/__tests__/engine/audio.test.ts`

- [ ] **Step 1: Write tests for `toMono()`**

Create `src/__tests__/engine/audio.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { toMono } from "@/engine/audio";

describe("toMono", () => {
  it("returns the same data for mono input", () => {
    const mono = new Float32Array([0.1, 0.2, 0.3]);
    const result = toMono(mono, 1);
    expect(result).toEqual(mono);
  });

  it("averages channels for stereo input", () => {
    const left = new Float32Array([1.0, 0.0, 0.5]);
    const right = new Float32Array([0.0, 1.0, 0.5]);
    const result = toMono(left, 2, right);
    expect(result[0]).toBeCloseTo(0.5);
    expect(result[1]).toBeCloseTo(0.5);
    expect(result[2]).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/__tests__/engine/audio.test.ts`
Expected: FAIL — `toMono` not found

- [ ] **Step 3: Create `src/engine/audio.ts`**

```typescript
export function toMono(
  left: Float32Array,
  numberOfChannels: number,
  right?: Float32Array,
): Float32Array {
  if (numberOfChannels === 1 || !right) {
    return left;
  }
  const mono = new Float32Array(left.length);
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }
  return mono;
}

export function extractMonoData(buffer: AudioBuffer): Float32Array {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : undefined;
  return toMono(left, buffer.numberOfChannels, right);
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = getAudioContext();
  return ctx.decodeAudioData(arrayBuffer);
}

export function createPlayback(
  buffer: AudioBuffer,
  onTimeUpdate: (time: number) => void,
  onEnded: () => void,
): { play: (startTime?: number) => void; stop: () => void; seek: (time: number) => void } {
  const ctx = getAudioContext();
  let source: AudioBufferSourceNode | null = null;
  let startOffset = 0;
  let startedAt = 0;
  let rafId: number | null = null;

  function tick() {
    if (source && startedAt > 0) {
      const elapsed = ctx.currentTime - startedAt + startOffset;
      onTimeUpdate(Math.min(elapsed, buffer.duration));
    }
    rafId = requestAnimationFrame(tick);
  }

  function play(seekTime?: number) {
    stop();
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    startOffset = seekTime ?? startOffset;
    source.start(0, startOffset);
    startedAt = ctx.currentTime;
    source.onended = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      onEnded();
    };
    tick();
  }

  function stop() {
    if (source) {
      source.onended = null;
      source.stop();
      source.disconnect();
      startOffset = ctx.currentTime - startedAt + startOffset;
      source = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    startedAt = 0;
  }

  function seek(time: number) {
    startOffset = time;
    onTimeUpdate(time);
  }

  return { play, stop, seek };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/__tests__/engine/audio.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/audio.ts src/__tests__/engine/audio.test.ts
git commit -m "feat: add audio engine with decode, playback, and mono conversion"
```

---

## Task 4: Analysis Engine (Worker + Manager)

**Files:**
- Create: `src/engine/worker.ts`
- Create: `src/engine/analyzer.ts`
- Test: `src/__tests__/engine/analyzer.test.ts`

- [ ] **Step 1: Create `src/engine/worker.ts`**

```typescript
import { Essentia, EssentiaWASM } from "essentia.js";

let essentia: Essentia | null = null;

async function init() {
  const wasmModule = await EssentiaWASM();
  essentia = new Essentia(wasmModule);
  self.postMessage({ type: "READY" });
}

function analyzeMusic(pcmData: Float32Array) {
  if (!essentia) throw new Error("Essentia not initialized");

  const signal = essentia.arrayToVector(pcmData);
  const rhythm = essentia.RhythmExtractor2013(signal);

  const bpm: number = rhythm.bpm;
  const ticks: number[] = essentia.vectorToArray(rhythm.ticks);
  const confidence: number = rhythm.confidence;

  const beats = ticks.map((time) => ({
    time,
    confidence,
    manual: false,
  }));

  const bpmCurve = [];
  for (let i = 1; i < ticks.length; i++) {
    const interval = ticks[i] - ticks[i - 1];
    if (interval > 0) {
      bpmCurve.push({
        time: ticks[i],
        bpm: 60 / interval,
      });
    }
  }

  self.postMessage({
    type: "RESULT",
    data: { bpm, beats, bpmCurve, confidence },
  });
}

function analyzeSE(pcmData: Float32Array, sampleRate: number) {
  if (!essentia) throw new Error("Essentia not initialized");

  const frameSize = 2048;
  const hopSize = 512;
  const onsetTimes: number[] = [];
  let prevEnergy = 0;
  const threshold = 0.3;

  for (let i = 0; i + frameSize < pcmData.length; i += hopSize) {
    const frame = pcmData.slice(i, i + frameSize);
    let energy = 0;
    for (let j = 0; j < frame.length; j++) {
      energy += frame[j] * frame[j];
    }
    energy /= frame.length;

    const diff = energy - prevEnergy;
    if (diff > threshold && prevEnergy > 0) {
      onsetTimes.push(i / sampleRate);
    }
    prevEnergy = energy;
  }

  const beats = onsetTimes.map((time) => ({
    time,
    confidence: 0.7,
    manual: false,
  }));

  let bpm = 0;
  if (onsetTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < onsetTimes.length; i++) {
      intervals.push(onsetTimes[i] - onsetTimes[i - 1]);
    }
    const medianInterval = intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
    bpm = 60 / medianInterval;
  }

  const bpmCurve = [];
  for (let i = 1; i < onsetTimes.length; i++) {
    const interval = onsetTimes[i] - onsetTimes[i - 1];
    if (interval > 0) {
      bpmCurve.push({
        time: onsetTimes[i],
        bpm: 60 / interval,
      });
    }
  }

  self.postMessage({
    type: "RESULT",
    data: { bpm, beats, bpmCurve, confidence: 0.7 },
  });
}

self.onmessage = async (event: MessageEvent) => {
  const { type, pcmData, sampleRate, mode } = event.data;

  if (type === "INIT") {
    await init();
  } else if (type === "ANALYZE") {
    if (mode === "music") {
      analyzeMusic(pcmData);
    } else {
      analyzeSE(pcmData, sampleRate);
    }
  }
};
```

- [ ] **Step 2: Create `src/engine/analyzer.ts`**

```typescript
import type { AnalysisMode, AnalysisResult } from "@/types";

export class AnalysisManager {
  private worker: Worker | null = null;
  private ready = false;
  private readyPromise: Promise<void> | null = null;

  init(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve) => {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (event: MessageEvent) => {
        if (event.data.type === "READY") {
          this.ready = true;
          resolve();
        }
      };
      this.worker.postMessage({ type: "INIT" });
    });

    return this.readyPromise;
  }

  async analyze(
    pcmData: Float32Array,
    sampleRate: number,
    mode: AnalysisMode,
  ): Promise<AnalysisResult> {
    if (!this.worker || !this.ready) {
      await this.init();
    }

    return new Promise<AnalysisResult>((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "RESULT") {
          this.worker!.removeEventListener("message", handler);
          resolve(event.data.data as AnalysisResult);
        }
      };
      this.worker!.addEventListener("message", handler);
      this.worker!.postMessage(
        { type: "ANALYZE", pcmData, sampleRate, mode },
        [pcmData.buffer],
      );
    });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.readyPromise = null;
  }
}
```

- [ ] **Step 3: Write test for `AnalysisManager` interface**

Create `src/__tests__/engine/analyzer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { AnalysisManager } from "@/engine/analyzer";

describe("AnalysisManager", () => {
  it("can be instantiated", () => {
    const manager = new AnalysisManager();
    expect(manager).toBeDefined();
    expect(manager.terminate).toBeTypeOf("function");
    expect(manager.analyze).toBeTypeOf("function");
    expect(manager.init).toBeTypeOf("function");
  });
});
```

Note: Full integration testing of the Worker + Essentia WASM requires a browser environment.
Manual verification will be done in Task 8 (integration test).

- [ ] **Step 4: Run test**

Run: `pnpm test:run src/__tests__/engine/analyzer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/worker.ts src/engine/analyzer.ts src/__tests__/engine/analyzer.test.ts
git commit -m "feat: add analysis engine with Essentia.js worker and manager"
```

---

## Task 5: Waveform Canvas Helpers

**Files:**
- Create: `src/lib/waveform.ts`
- Test: `src/__tests__/lib/waveform.test.ts`

- [ ] **Step 1: Write tests for `downsample()`**

Create `src/__tests__/lib/waveform.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { downsample } from "@/lib/waveform";

describe("downsample", () => {
  it("reduces sample count to target bucket count", () => {
    const data = new Float32Array([0.1, 0.9, -0.5, 0.3, 0.7, -0.2, 0.4, 0.8]);
    const result = downsample(data, 4);
    expect(result.max).toHaveLength(4);
    expect(result.min).toHaveLength(4);
  });

  it("computes correct min/max per bucket", () => {
    const data = new Float32Array([0.2, 0.8, -0.3, 0.5]);
    const result = downsample(data, 2);
    expect(result.max[0]).toBeCloseTo(0.8);
    expect(result.min[0]).toBeCloseTo(0.2);
    expect(result.max[1]).toBeCloseTo(0.5);
    expect(result.min[1]).toBeCloseTo(-0.3);
  });

  it("returns original data when bucket count >= data length", () => {
    const data = new Float32Array([0.1, 0.2]);
    const result = downsample(data, 10);
    expect(result.max).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/__tests__/lib/waveform.test.ts`
Expected: FAIL

- [ ] **Step 3: Create `src/lib/waveform.ts`**

```typescript
import type { Beat } from "@/types";

export interface DownsampleResult {
  min: Float32Array;
  max: Float32Array;
}

export function downsample(data: Float32Array, buckets: number): DownsampleResult {
  if (buckets >= data.length) {
    return { min: new Float32Array(data), max: new Float32Array(data) };
  }

  const bucketSize = data.length / buckets;
  const min = new Float32Array(buckets);
  const max = new Float32Array(buckets);

  for (let i = 0; i < buckets; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = start; j < end; j++) {
      if (data[j] < lo) lo = data[j];
      if (data[j] > hi) hi = data[j];
    }
    min[i] = lo;
    max[i] = hi;
  }

  return { min, max };
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  zoom: number,
  scrollOffset: number,
) {
  const visibleSamples = Math.floor(data.length / zoom);
  const startSample = Math.floor(scrollOffset * data.length);
  const endSample = Math.min(startSample + visibleSamples, data.length);
  const slice = data.slice(startSample, endSample);
  const { min, max } = downsample(slice, width);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#4f46e5";
  const mid = height / 2;

  for (let i = 0; i < min.length; i++) {
    const yMin = mid - max[i] * mid;
    const yMax = mid - min[i] * mid;
    ctx.fillRect(i, yMin, 1, Math.max(1, yMax - yMin));
  }
}

export function drawBeatMarkers(
  ctx: CanvasRenderingContext2D,
  beats: Beat[],
  duration: number,
  width: number,
  height: number,
  zoom: number,
  scrollOffset: number,
) {
  const visibleDuration = duration / zoom;
  const startTime = scrollOffset * duration;
  const endTime = startTime + visibleDuration;

  for (const beat of beats) {
    if (beat.time < startTime || beat.time > endTime) continue;

    const x = ((beat.time - startTime) / visibleDuration) * width;
    ctx.strokeStyle = beat.manual ? "#f59e0b" : "#ef4444";
    ctx.lineWidth = beat.manual ? 2 : 1;
    ctx.globalAlpha = 0.4 + beat.confidence * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  duration: number,
  width: number,
  height: number,
  zoom: number,
  scrollOffset: number,
) {
  const visibleDuration = duration / zoom;
  const startTime = scrollOffset * duration;
  const x = ((currentTime - startTime) / visibleDuration) * width;

  if (x < 0 || x > width) return;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
}

export function timeToX(
  time: number,
  duration: number,
  width: number,
  zoom: number,
  scrollOffset: number,
): number {
  const visibleDuration = duration / zoom;
  const startTime = scrollOffset * duration;
  return ((time - startTime) / visibleDuration) * width;
}

export function xToTime(
  x: number,
  duration: number,
  width: number,
  zoom: number,
  scrollOffset: number,
): number {
  const visibleDuration = duration / zoom;
  const startTime = scrollOffset * duration;
  return startTime + (x / width) * visibleDuration;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/__tests__/lib/waveform.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/waveform.ts src/__tests__/lib/waveform.test.ts
git commit -m "feat: add waveform canvas drawing helpers with downsample"
```

---

## Task 6: UI Components — FileDropZone, BpmDisplay, ModeSelector

**Files:**
- Create: `src/components/FileDropZone.tsx`
- Create: `src/components/BpmDisplay.tsx`
- Create: `src/components/ModeSelector.tsx`

- [ ] **Step 1: Add shadcn/ui button component**

Run: `pnpm dlx shadcn@latest add button badge`

- [ ] **Step 2: Create `src/components/ModeSelector.tsx`**

```tsx
"use client";

import { useAtom } from "jotai";
import { analysisModeAtom } from "@/store/analysisAtoms";
import type { AnalysisMode } from "@/types";

const modes: { value: AnalysisMode; label: string }[] = [
  { value: "music", label: "Music" },
  { value: "se", label: "SE / SFX" },
];

export function ModeSelector() {
  const [mode, setMode] = useAtom(analysisModeAtom);

  return (
    <div className="flex gap-1 rounded-lg bg-gray-800 p-1">
      {modes.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => setMode(m.value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === m.value
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/BpmDisplay.tsx`**

```tsx
"use client";

import { useAtomValue } from "jotai";
import { bpmAtom, confidenceAtom, isAnalyzingAtom } from "@/store/analysisAtoms";

export function BpmDisplay() {
  const bpm = useAtomValue(bpmAtom);
  const confidence = useAtomValue(confidenceAtom);
  const isAnalyzing = useAtomValue(isAnalyzingAtom);

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-lg text-gray-400">Analyzing...</span>
      </div>
    );
  }

  if (bpm === 0) return null;

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold tabular-nums">{bpm.toFixed(1)}</span>
        <span className="text-xl text-gray-400">BPM</span>
      </div>
      <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
        Confidence: {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/FileDropZone.tsx`**

```tsx
"use client";

import { useCallback, useState, useRef } from "react";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.flac";

export function FileDropZone({ onFileSelect, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect, disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? "border-indigo-500 bg-indigo-500/10"
          : "border-gray-700 hover:border-gray-500"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <p className="text-lg text-gray-300">
        Drag &amp; drop audio file or click to select
      </p>
      <p className="mt-1 text-sm text-gray-500">
        MP3, WAV, M4A, AAC, OGG, FLAC
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/FileDropZone.tsx src/components/BpmDisplay.tsx src/components/ModeSelector.tsx
git commit -m "feat: add FileDropZone, BpmDisplay, and ModeSelector components"
```

---

## Task 7: UI Components — WaveformView, PlaybackControls, BpmGraph

**Files:**
- Create: `src/components/WaveformView.tsx`
- Create: `src/components/PlaybackControls.tsx`
- Create: `src/components/BpmGraph.tsx`

- [ ] **Step 1: Create `src/components/WaveformView.tsx`**

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { audioBufferAtom, durationAtom, currentTimeAtom } from "@/store/audioAtoms";
import { beatsAtom } from "@/store/analysisAtoms";
import { zoomAtom, scrollOffsetAtom, undoStackAtom } from "@/store/uiAtoms";
import { drawWaveform, drawBeatMarkers, drawPlayhead, xToTime } from "@/lib/waveform";
import { extractMonoData } from "@/engine/audio";
import type { Beat } from "@/types";

const CANVAS_HEIGHT = 200;
const MARKER_HIT_RADIUS = 8;

export function WaveformView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioBuffer = useAtomValue(audioBufferAtom);
  const duration = useAtomValue(durationAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const [beats, setBeats] = useAtom(beatsAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const [scrollOffset, setScrollOffset] = useAtom(scrollOffsetAtom);
  const setUndoStack = useSetAtom(undoStackAtom);
  const monoDataRef = useRef<Float32Array | null>(null);
  const draggingRef = useRef<{ index: number; startX: number } | null>(null);

  useEffect(() => {
    if (audioBuffer) {
      monoDataRef.current = extractMonoData(audioBuffer);
    }
  }, [audioBuffer]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !monoDataRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    drawWaveform(ctx, monoDataRef.current, width, height, zoom, scrollOffset);
    drawBeatMarkers(ctx, beats, duration, width, height, zoom, scrollOffset);
    drawPlayhead(ctx, currentTime, duration, width, height, zoom, scrollOffset);
  }, [beats, currentTime, duration, zoom, scrollOffset]);

  useEffect(() => {
    const rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const canvas = canvasRef.current;
      if (!canvas || !entries[0]) return;
      canvas.width = entries[0].contentRect.width;
      canvas.height = CANVAS_HEIGHT;
      draw();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  const pushUndo = useCallback(() => {
    setUndoStack((stack) => [...stack, { beats: [...beats] }]);
  }, [beats, setUndoStack]);

  const findBeatAtX = useCallback(
    (x: number): number => {
      const canvas = canvasRef.current;
      if (!canvas) return -1;
      const time = xToTime(x, duration, canvas.width, zoom, scrollOffset);
      const pixelPerSec = canvas.width / (duration / zoom);

      for (let i = 0; i < beats.length; i++) {
        const dist = Math.abs(beats[i].time - time) * pixelPerSec;
        if (dist < MARKER_HIT_RADIUS) return i;
      }
      return -1;
    },
    [beats, duration, zoom, scrollOffset],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const index = findBeatAtX(x);
      if (index >= 0) {
        draggingRef.current = { index, startX: x };
      }
    },
    [findBeatAtX],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newTime = xToTime(x, duration, canvasRef.current.width, zoom, scrollOffset);
      const { index } = draggingRef.current;

      setBeats((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], time: Math.max(0, Math.min(newTime, duration)) };
        return next;
      });
    },
    [duration, zoom, scrollOffset, setBeats],
  );

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current) {
      pushUndo();
      draggingRef.current = null;
    }
  }, [pushUndo]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = xToTime(x, duration, canvas.width, zoom, scrollOffset);

      pushUndo();
      const newBeat: Beat = { time, confidence: 1, manual: true };
      setBeats((prev) => [...prev, newBeat].sort((a, b) => a.time - b.time));
    },
    [duration, zoom, scrollOffset, pushUndo, setBeats],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const index = findBeatAtX(x);
      if (index >= 0) {
        pushUndo();
        setBeats((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [findBeatAtX, pushUndo, setBeats],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setZoom((z) => Math.max(1, Math.min(z * (e.deltaY > 0 ? 0.9 : 1.1), 100)));
      } else {
        setScrollOffset((s) => Math.max(0, Math.min(s + e.deltaX * 0.001, 1 - 1 / zoom)));
      }
    },
    [zoom, setZoom, setScrollOffset],
  );

  if (!audioBuffer) return null;

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        height={CANVAS_HEIGHT}
        className="w-full cursor-crosshair rounded-lg bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/PlaybackControls.tsx`**

```tsx
"use client";

import { useCallback, useRef, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  audioBufferAtom,
  playbackStateAtom,
  currentTimeAtom,
  durationAtom,
} from "@/store/audioAtoms";
import { beatsAtom } from "@/store/analysisAtoms";
import { undoStackAtom } from "@/store/uiAtoms";
import { createPlayback } from "@/engine/audio";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaybackControls() {
  const audioBuffer = useAtomValue(audioBufferAtom);
  const duration = useAtomValue(durationAtom);
  const [playbackState, setPlaybackState] = useAtom(playbackStateAtom);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [beats, setBeats] = useAtom(beatsAtom);
  const [undoStack, setUndoStack] = useAtom(undoStackAtom);
  const playbackRef = useRef<ReturnType<typeof createPlayback> | null>(null);

  useEffect(() => {
    if (!audioBuffer) return;
    playbackRef.current = createPlayback(
      audioBuffer,
      (time) => setCurrentTime(time),
      () => setPlaybackState("idle"),
    );
    return () => {
      playbackRef.current?.stop();
    };
  }, [audioBuffer, setCurrentTime, setPlaybackState]);

  const handlePlay = useCallback(() => {
    if (!playbackRef.current) return;
    playbackRef.current.play(currentTime);
    setPlaybackState("playing");
  }, [currentTime, setPlaybackState]);

  const handleStop = useCallback(() => {
    if (!playbackRef.current) return;
    playbackRef.current.stop();
    setPlaybackState("paused");
  }, [setPlaybackState]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Number.parseFloat(e.target.value);
      setCurrentTime(time);
      playbackRef.current?.seek(time);
      if (playbackState === "playing") {
        playbackRef.current?.play(time);
      }
    },
    [playbackState, setCurrentTime],
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setBeats(prev.beats);
    setUndoStack((stack) => stack.slice(0, -1));
  }, [undoStack, setBeats, setUndoStack]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo]);

  if (!audioBuffer) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        {playbackState === "playing" ? (
          <button
            type="button"
            onClick={handleStop}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
          >
            ■ Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            ▶ Play
          </button>
        )}
        <button
          type="button"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-600 disabled:opacity-30"
        >
          Undo
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={currentTime}
        onChange={handleSeek}
        className="flex-1"
      />

      <span className="min-w-[5rem] text-right text-sm tabular-nums text-gray-400">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/BpmGraph.tsx`**

```tsx
"use client";

import { useAtomValue } from "jotai";
import { bpmCurveAtom, bpmAtom } from "@/store/analysisAtoms";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

function formatTick(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BpmGraph() {
  const bpmCurve = useAtomValue(bpmCurveAtom);
  const bpm = useAtomValue(bpmAtom);

  if (bpmCurve.length === 0) return null;

  return (
    <div className="h-48 w-full rounded-lg bg-gray-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={bpmCurve}>
          <XAxis
            dataKey="time"
            tickFormatter={formatTick}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            domain={["auto", "auto"]}
            stroke="#6b7280"
            fontSize={12}
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)} BPM`, "BPM"]}
            labelFormatter={(label: number) => formatTick(label)}
            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8 }}
          />
          <ReferenceLine y={bpm} stroke="#6366f1" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="bpm"
            stroke="#818cf8"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/WaveformView.tsx src/components/PlaybackControls.tsx src/components/BpmGraph.tsx
git commit -m "feat: add WaveformView, PlaybackControls, and BpmGraph components"
```

---

## Task 8: Main Page Integration

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update `src/app/page.tsx`**

```tsx
"use client";

import { useCallback, useRef } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { audioBufferAtom, fileNameAtom, durationAtom, currentTimeAtom, playbackStateAtom } from "@/store/audioAtoms";
import { isAnalyzingAtom, setAnalysisResultAtom, analysisModeAtom, bpmAtom } from "@/store/analysisAtoms";
import { zoomAtom, scrollOffsetAtom, undoStackAtom } from "@/store/uiAtoms";
import { decodeAudioFile, extractMonoData } from "@/engine/audio";
import { AnalysisManager } from "@/engine/analyzer";
import { FileDropZone } from "@/components/FileDropZone";
import { BpmDisplay } from "@/components/BpmDisplay";
import { ModeSelector } from "@/components/ModeSelector";
import { WaveformView } from "@/components/WaveformView";
import { PlaybackControls } from "@/components/PlaybackControls";
import { BpmGraph } from "@/components/BpmGraph";

export default function Home() {
  const setAudioBuffer = useSetAtom(audioBufferAtom);
  const setFileName = useSetAtom(fileNameAtom);
  const setDuration = useSetAtom(durationAtom);
  const setCurrentTime = useSetAtom(currentTimeAtom);
  const setPlaybackState = useSetAtom(playbackStateAtom);
  const setIsAnalyzing = useSetAtom(isAnalyzingAtom);
  const setAnalysisResult = useSetAtom(setAnalysisResultAtom);
  const setZoom = useSetAtom(zoomAtom);
  const setScrollOffset = useSetAtom(scrollOffsetAtom);
  const setUndoStack = useSetAtom(undoStackAtom);
  const analysisMode = useAtomValue(analysisModeAtom);
  const isAnalyzing = useAtomValue(isAnalyzingAtom);
  const bpm = useAtomValue(bpmAtom);
  const managerRef = useRef<AnalysisManager | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        setIsAnalyzing(true);
        setZoom(1);
        setScrollOffset(0);
        setCurrentTime(0);
        setPlaybackState("idle");
        setUndoStack([]);

        const buffer = await decodeAudioFile(file);
        setAudioBuffer(buffer);
        setFileName(file.name);
        setDuration(buffer.duration);

        if (!managerRef.current) {
          managerRef.current = new AnalysisManager();
        }

        const monoData = extractMonoData(buffer);
        const result = await managerRef.current.analyze(
          monoData,
          buffer.sampleRate,
          analysisMode,
        );
        setAnalysisResult(result);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      analysisMode,
      setAudioBuffer,
      setFileName,
      setDuration,
      setCurrentTime,
      setPlaybackState,
      setIsAnalyzing,
      setAnalysisResult,
      setZoom,
      setScrollOffset,
      setUndoStack,
    ],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">BPM Detector</h1>
        <ModeSelector />
      </header>

      <FileDropZone onFileSelect={handleFileSelect} disabled={isAnalyzing} />

      <BpmDisplay />

      <WaveformView />

      <PlaybackControls />

      <BpmGraph />
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Verify dev server**

Run: `pnpm dev`
Open: `http://localhost:3000`
Expected: Page renders with header, mode selector, and file drop zone

- [ ] **Step 4: Manual integration test**

1. Drop an MP3 file onto the drop zone
2. Verify: BPM is detected and displayed
3. Verify: Waveform renders with beat markers
4. Verify: BPM graph shows tempo curve
5. Verify: Play/Stop works, playhead moves
6. Verify: Double-click adds a beat marker
7. Verify: Right-click removes a beat marker
8. Verify: Drag moves a beat marker
9. Verify: Cmd+Z undoes the last action
10. Switch to SE mode and test with an effect sound file

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate all components into main page"
```

---

## Task 9: Polish and Final Verification

**Files:**
- Possibly modify: various files for lint/type fixes

- [ ] **Step 1: Run full lint**

Run: `pnpm lint`
Fix any issues reported by Biome.

- [ ] **Step 2: Run full typecheck**

Run: `pnpm typecheck`
Fix any type errors.

- [ ] **Step 3: Run all tests**

Run: `pnpm test:run`
Expected: All tests pass.

- [ ] **Step 4: Run production build**

Run: `pnpm build`
Expected: Static export succeeds, `out/` directory is created.

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "chore: lint fixes and final polish"
git push origin main
```
