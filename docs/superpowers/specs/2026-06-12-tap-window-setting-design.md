# タップ計測の「最新nタップ」設定機能 — 設計

**日付:** 2026-06-12
**ステータス:** 承認済み（実装計画待ち）

## 背景

手動タップ計測は現在、直近最大 8 タップ（`MAX_TAPS = 8`、ハードコード）からBPMを算出している。
利用者がこの「最新何タップでBPMを測るか」を画面上から調整できるようにしたい。

## 要件

- 「手動で計測」エリア内に、BPM算出に使う**最大タップ数 n** を調整するUIを設ける。
- **n の意味**: 保持する最大タップ数（現状の `MAX_TAPS` と同義）。n タップを保持し、その間隔（最大 n−1 個）の平均でBPMを算出する。古いタップは捨てる。
- **範囲**: 2〜16、デフォルト 8。
- **UI形式**: range スライダー（`min=2 max=16 step=1`）＋現在値ラベル。
- **n 変更時の挙動**: タップ履歴をリセットして測り直す。

## アーキテクチャ

### 1. ロジック層 — `src/lib/tapTempo.ts`

- 既存の `appendTapTime(prev, next, resetMs, maxTaps)` は `maxTaps` を引数で受け取れる作りのため、シグネチャ変更は不要。`MAX_TAPS = 8` はデフォルト値として残す。
- 範囲定数を追加: `MIN_MAX_TAPS = 2`, `MAX_MAX_TAPS = 16`。
- `calculateTapBpm(tapTimes)` は変更不要。保持済みの `tapTimes` をそのまま平均するだけで、n には依存しない。

### 2. 状態管理 — `src/store/uiAtoms.ts`

- `maxTapsAtom`（初期値 8）を追加。
- グローバルな `uiResetVersionAtom` リセット時には、デフォルト 8 に戻すのではなく**ユーザー設定値を維持**する（設定は計測のクリアとは別概念のため）。タップ履歴のみリセットする。

### 3. UI層 — `src/components/TapTempo.tsx`

- `maxTapsAtom` を読み、`registerTap` 内の `appendTapTime(prev, tapTime, TAP_RESET_MS, maxTaps)` に渡す。
- TAP / クリアボタン群の下に独立した行として、range スライダーと現在値ラベル（例:「最新 8 タップで測定」）を配置。
- スライダー操作で `maxTapsAtom` を更新し、同時にタップ履歴をリセット（`setTapTimes([])` + `setTapMarkers([])` + `setTapTempoBpm(null)`）。既存の `clearTapTempo` ロジックを再利用する。

### 4. i18n — `src/i18n/ja.ts` / `src/i18n/en.ts` / `src/i18n/types.ts`

- ラベル文言を追加。例:
  - 日本語: `tapWindowLabel(n)` → 「最新 {n} タップで測定」
  - 英語: → "Measure from last {n} taps"

## データフロー

```
スライダー操作
  → maxTapsAtom 更新
  → タップ履歴リセット（tapTimes / tapMarkers / tapTempoBpm）
  → 以降のタップは新しい n で appendTapTime
  → calculateTapBpm が再計算
```

## エラー処理 / 境界条件

- スライダーは `min/max/step` で 2〜16 の整数に制約されるため、範囲外の値は入らない。
- n を変更してもタップ履歴はリセットされるため、`calculateTapBpm` は最低 2 タップ揃うまで `null`（"--" 表示）を返す。既存挙動と同じ。

## テスト

- `src/__tests__/lib/tapTempo.test.ts`:
  - `maxTaps` を変えたときに保持件数が切り替わることを境界値 2 と 16 で検証。
- `src/__tests__/components/TapTempo.test.tsx`:
  - スライダー操作でタップ履歴がリセットされること。
  - ラベルが現在値に応じて更新されること。

## スコープ外（YAGNI）

- リセット時刻（`TAP_RESET_MS = 2000`）の設定化は今回は含めない。
- BPM算出の重み付け（直近を重視する等）は含めない。単純平均を維持する。
