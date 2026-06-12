# タップ計測の「最新nタップ」設定機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 手動タップ計測でBPM算出に使う最大タップ数(n, 2〜16, デフォルト8)を画面上のスライダーから調整できるようにする。

**Architecture:** ロジック層 `tapTempo.ts` は既に `maxTaps` を引数で受け取れるため範囲定数のみ追加。新規 `maxTapsAtom` を jotai に追加し、`TapTempo.tsx` がそれを読んで `appendTapTime` に渡す。スライダー操作時はタップ履歴をリセットする。i18n にラベルを追加。

**Tech Stack:** Next.js (App Router), React, jotai, vitest, @testing-library/react, Tailwind CSS

---

### Task 1: ロジック層に範囲定数を追加

**Files:**
- Modify: `src/lib/tapTempo.ts`
- Test: `src/__tests__/lib/tapTempo.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/lib/tapTempo.test.ts` の import 行を更新し、`describe("appendTapTime", ...)` ブロックの末尾（既存の `it("keeps only the most recent taps", ...)` の後）に新しいテストを追加する。

import 行を以下に変更:

```ts
import {
	appendTapTime,
	calculateTapBpm,
	MAX_MAX_TAPS,
	MAX_TAPS,
	MIN_MAX_TAPS,
	TAP_RESET_MS,
} from "@/lib/tapTempo";
```

`describe("appendTapTime", ...)` 内、`it("keeps only the most recent taps", ...)` の直後に追加:

```ts
	it("honors a custom maxTaps and keeps only that many", () => {
		const taps = Array.from({ length: 10 }, (_, index) => index * 500);
		expect(appendTapTime(taps, 5000, TAP_RESET_MS, 4)).toHaveLength(4);
	});

	it("exposes a 2..16 settable range with default 8", () => {
		expect(MIN_MAX_TAPS).toBe(2);
		expect(MAX_MAX_TAPS).toBe(16);
		expect(MAX_TAPS).toBe(8);
	});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/lib/tapTempo.test.ts`
Expected: FAIL — `MIN_MAX_TAPS` / `MAX_MAX_TAPS` が export されていないためエラー。

- [ ] **Step 3: Add the range constants**

`src/lib/tapTempo.ts` の先頭の定数定義を変更する。現状:

```ts
const TAP_RESET_MS = 2000;
const MAX_TAPS = 8;
```

を以下に変更:

```ts
const TAP_RESET_MS = 2000;
const MAX_TAPS = 8;
const MIN_MAX_TAPS = 2;
const MAX_MAX_TAPS = 16;
```

ファイル末尾の export 文を変更する。現状:

```ts
export { MAX_TAPS, TAP_RESET_MS };
```

を以下に変更:

```ts
export { MAX_MAX_TAPS, MAX_TAPS, MIN_MAX_TAPS, TAP_RESET_MS };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/lib/tapTempo.test.ts`
Expected: PASS（全テスト green）

- [ ] **Step 5: Commit**

```bash
git add src/lib/tapTempo.ts src/__tests__/lib/tapTempo.test.ts
git commit -m "feat: タップ計測の最大タップ数に設定範囲定数を追加"
```

---

### Task 2: maxTapsAtom を追加

**Files:**
- Modify: `src/store/uiAtoms.ts`

**注:** このアトムは UI 経由で `src/components/TapTempo.tsx` から消費される（Task 4）。単体テストは不要（単純な atom 定義のため、Task 4 のコンポーネントテストでカバーされる）。`resetUiStateAtom` には**含めない** — ユーザー設定値は曲の切替などのグローバルリセットでも維持する。

- [ ] **Step 1: Add the atom**

`src/store/uiAtoms.ts` の import 行を変更する。現状:

```ts
import { atom } from "jotai";
```

を以下に変更:

```ts
import { atom } from "jotai";
import { MAX_TAPS } from "@/lib/tapTempo";
```

`tapTempoBpmAtom` の定義の直後（`export const tapTempoBpmAtom = atom<number | null>(null);` の次の行）に追加:

```ts
export const maxTapsAtom = atom<number>(MAX_TAPS);
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm tsc --noEmit`
Expected: 型エラーなし（exit 0）

- [ ] **Step 3: Commit**

```bash
git add src/store/uiAtoms.ts
git commit -m "feat: 最大タップ数を保持する maxTapsAtom を追加"
```

---

### Task 3: i18n にスライダーラベルを追加

**Files:**
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/ja.ts`
- Modify: `src/i18n/en.ts`

**注:** ラベルは Task 4 のコンポーネントテストで検証される。

- [ ] **Step 1: Add the type**

`src/i18n/types.ts` の `Dictionary` interface 内、`tapResetNotice: (seconds: number) => string;` の直後に追加:

```ts
	tapWindowLabel: (count: number) => string;
```

- [ ] **Step 2: Add the Japanese string**

`src/i18n/ja.ts` の `tapResetNotice` 行の直後（`clear:` の前）に追加:

```ts
	tapWindowLabel: (count: number) => `最新 ${count} タップで測定`,
```

- [ ] **Step 3: Add the English string**

`src/i18n/en.ts` の `tapResetNotice` 行の直後（`clear:` の前）に追加:

```ts
	tapWindowLabel: (count: number) => `Measure from last ${count} taps`,
```

- [ ] **Step 4: Verify it compiles**

Run: `pnpm tsc --noEmit`
Expected: 型エラーなし（exit 0）。`Dictionary` を満たさない辞書があればここで検出される。

- [ ] **Step 5: Commit**

```bash
git add src/i18n/types.ts src/i18n/ja.ts src/i18n/en.ts
git commit -m "feat: タップ計測ウィンドウ用の i18n ラベルを追加"
```

---

### Task 4: TapTempo にスライダーUIを組み込む

**Files:**
- Modify: `src/components/TapTempo.tsx`
- Test: `src/__tests__/components/TapTempo.test.tsx`

- [ ] **Step 1: Write the failing tests**

`src/__tests__/components/TapTempo.test.tsx` の import に `maxTapsAtom` を追加する。現状の uiAtoms import 行:

```ts
import { tapMarkersAtom } from "@/store/uiAtoms";
```

を以下に変更:

```ts
import { maxTapsAtom, tapMarkersAtom } from "@/store/uiAtoms";
```

`describe("TapTempo", ...)` 内、末尾の `it("clears both tap history and stored markers", ...)` の後に追加:

```ts
	it("renders the tap window label from maxTapsAtom", () => {
		const store = createEnglishStore();
		store.set(maxTapsAtom, 5);

		render(
			React.createElement(Provider, { store }, React.createElement(TapTempo, { now: () => 0 })),
		);

		expect(screen.getByText("Measure from last 5 taps")).toBeTruthy();
	});

	it("updates maxTapsAtom and resets tap history when the slider changes", () => {
		const tapTimes = [0, 500];
		let tapIndex = 0;
		const store = createEnglishStore();

		render(
			React.createElement(
				Provider,
				{ store },
				React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }),
			),
		);

		fireEvent.click(screen.getByRole("button", { name: "Tap" }));
		fireEvent.click(screen.getByRole("button", { name: "Tap" }));
		expect(screen.getByText("120.0")).toBeTruthy();

		fireEvent.change(screen.getByRole("slider"), { target: { value: "4" } });

		expect(store.get(maxTapsAtom)).toBe(4);
		expect(screen.getByText("--")).toBeTruthy();
	});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/__tests__/components/TapTempo.test.tsx`
Expected: FAIL — slider role の要素が存在せず、ラベルも描画されていないため。

- [ ] **Step 3: Wire maxTapsAtom into TapTempo**

`src/components/TapTempo.tsx` を編集する。

(a) import を更新。現状:

```ts
import { appendTapTime, calculateTapBpm, TAP_RESET_MS } from "@/lib/tapTempo";
import { currentTimeAtom, playbackStateAtom } from "@/store/audioAtoms";
import { tapMarkersAtom, tapTempoBpmAtom, uiResetVersionAtom } from "@/store/uiAtoms";
```

を以下に変更:

```ts
import {
	appendTapTime,
	calculateTapBpm,
	MAX_MAX_TAPS,
	MIN_MAX_TAPS,
	TAP_RESET_MS,
} from "@/lib/tapTempo";
import { currentTimeAtom, playbackStateAtom } from "@/store/audioAtoms";
import {
	maxTapsAtom,
	tapMarkersAtom,
	tapTempoBpmAtom,
	uiResetVersionAtom,
} from "@/store/uiAtoms";
```

(b) アトムを読む。`const setTapTempoBpm = useSetAtom(tapTempoBpmAtom);` の直後に追加:

```ts
	const [maxTaps, setMaxTaps] = useAtom(maxTapsAtom);
```

これに伴い、`jotai` の import に `useAtom` を追加する。現状:

```ts
import { useAtomValue, useSetAtom } from "jotai";
```

を以下に変更:

```ts
import { useAtom, useAtomValue, useSetAtom } from "jotai";
```

(c) `appendTapTime` に `maxTaps` を渡す。現状の `registerTap`:

```ts
	const registerTap = React.useCallback(
		(tapTime = getNow()) => {
			setTapTimes((previousTapTimes) => appendTapTime(previousTapTimes, tapTime));
			if (playbackState === "playing") {
				setTapMarkers((previousMarkers) => [...previousMarkers, currentTime]);
			}
		},
		[currentTime, getNow, playbackState, setTapMarkers],
	);
```

を以下に変更:

```ts
	const registerTap = React.useCallback(
		(tapTime = getNow()) => {
			setTapTimes((previousTapTimes) =>
				appendTapTime(previousTapTimes, tapTime, TAP_RESET_MS, maxTaps),
			);
			if (playbackState === "playing") {
				setTapMarkers((previousMarkers) => [...previousMarkers, currentTime]);
			}
		},
		[currentTime, getNow, maxTaps, playbackState, setTapMarkers],
	);
```

(d) スライダー変更ハンドラを追加。既存の `clearTapTempo` の `React.useCallback` 定義の直後に追加:

```ts
	const handleMaxTapsChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setMaxTaps(Number(event.target.value));
			clearTapTempo();
		},
		[clearTapTempo, setMaxTaps],
	);
```

(e) スライダーUIを描画する。`<p className="text-xs text-gray-500">` で始まる `tapResetNotice` の `</p>` の直後（同じ親 `<div className="space-y-1">` 内、`tapResetNotice` の段落の後）に追加:

```tsx
					<div className="space-y-1 pt-2">
						<label
							htmlFor="tap-window"
							className="block text-xs text-gray-400"
						>
							{t.tapWindowLabel(maxTaps)}
						</label>
						<input
							id="tap-window"
							type="range"
							min={MIN_MAX_TAPS}
							max={MAX_MAX_TAPS}
							step={1}
							value={maxTaps}
							onChange={handleMaxTapsChange}
							className="w-full accent-amber-500"
						/>
					</div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/__tests__/components/TapTempo.test.tsx`
Expected: PASS（既存テスト + 新規2件すべて green）

- [ ] **Step 5: Run the full test suite and type check**

Run: `pnpm vitest run && pnpm tsc --noEmit`
Expected: 全テスト PASS、型エラーなし

- [ ] **Step 6: Commit**

```bash
git add src/components/TapTempo.tsx src/__tests__/components/TapTempo.test.tsx
git commit -m "feat: タップ計測ウィンドウを調整するスライダーUIを追加"
```

---

## Self-Review チェック結果

- **Spec coverage:** 範囲定数(Task 1) / maxTapsAtom・リセット維持(Task 2) / i18n(Task 3) / スライダーUI・履歴リセット(Task 4) で仕様の全項目をカバー。
- **Placeholder scan:** プレースホルダなし。全ステップに実コード/実コマンドを記載。
- **Type consistency:** `maxTapsAtom`, `MIN_MAX_TAPS`, `MAX_MAX_TAPS`, `tapWindowLabel`, `handleMaxTapsChange` の名称はタスク間で一貫。`appendTapTime(prev, tapTime, TAP_RESET_MS, maxTaps)` の引数順は既存シグネチャ `(previousTapTimes, nextTapTime, resetMs, maxTaps)` と一致。
