# BPM Detector

ブラウザ上でオーディオファイルの BPM（テンポ）を解析・可視化する Web アプリケーションです。

Essentia.js（WASM）による自動 BPM 推定と、Tap Tempo による手動計測を並べて比較できます。

## 主な機能

- **BPM 自動検出** — Essentia.js の RhythmExtractor2013 による自動テンポ推定
- **Tap Tempo** — ボタン連打または Enter キーで手動 BPM 計測
- **2つの解析モード**
  - **Music モード**: 楽曲向け。ビート位置・BPM・信頼度を検出
  - **SE/SFX モード**: 効果音向け。エネルギーベースのオンセット検出
- **波形ビジュアライザ** — Canvas 2D による高速な波形描画とビートマーカー表示
- **部分解析** — 再生位置周辺だけを切り出して再解析
- **Tap Marker 表示** — 再生中のタップ位置を波形上に縦バー表示
- **BPMカーブグラフ** — 時間軸に沿ったBPM変化の折れ線グラフ
- **信頼度表示** — 自動解析結果に confidence と解析範囲を表示
- **ズーム & パン** — マウスホイール / トラックパッドのピンチ操作でズーム、横スクロールでパン
- **対応フォーマット** — MP3, WAV, M4A, AAC, OGG, FLAC

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 15 (React 19) / TypeScript |
| 音声解析 | Essentia.js (WASM) / Web Audio API / Web Workers |
| 状態管理 | Jotai |
| スタイリング | Tailwind CSS 4 |
| グラフ | Recharts |
| リンター / フォーマッター | Biome |
| テスト | Vitest / Testing Library |
| パッケージマネージャ | pnpm |

## セットアップ

### 必要環境

- Node.js 22 以上
- pnpm 10 以上

### インストール

```bash
pnpm install
```

### 開発サーバー起動

```bash
pnpm dev
```

http://localhost:3000 でアプリが起動します。

### ビルド

```bash
pnpm build
```

`out/` ディレクトリに静的ファイルとしてエクスポートされます。

## スクリプト一覧

| コマンド | 説明 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド（静的エクスポート） |
| `pnpm start` | プロダクションサーバー起動 |
| `pnpm lint` | Biome によるリントチェック |
| `pnpm lint:fix` | リント自動修正 |
| `pnpm format` | コードフォーマット |
| `pnpm typecheck` | TypeScript 型チェック |
| `pnpm test` | テスト実行（ウォッチモード） |
| `pnpm test:run` | テスト実行（単発） |

## プロジェクト構成

```
src/
├── app/                  # Next.js App Router（ページ・レイアウト）
├── components/           # UIコンポーネント
│   ├── BpmDisplay.tsx    #   BPM・信頼度の表示
│   ├── BpmGraph.tsx      #   BPMカーブグラフ
│   ├── FileDropZone.tsx  #   ファイルドロップゾーン
│   ├── ModeSelector.tsx  #   解析モード切替
│   ├── PlaybackControls.tsx  #   再生コントロール
│   ├── TapTempo.tsx      #   手動 BPM 計測
│   ├── WaveformView.tsx  #   波形ビジュアライザ
│   └── ui/               #   汎用UIパーツ
├── engine/               # 音声処理エンジン
│   ├── audio.ts          #   Web Audio API ラッパー
│   ├── analyzer.ts       #   Web Worker 管理
│   └── worker.ts         #   Essentia.js 解析ワーカー
├── hooks/                # カスタムフック
│   └── useCanvasGesture.ts   #   ズーム・パン操作
├── lib/                  # ユーティリティ
│   ├── analysis.ts       #   解析範囲と confidence 表示用ロジック
│   └── tapTempo.ts       #   Tap Tempo 計算
├── store/                # Jotai アトム（状態管理）
├── types/                # TypeScript 型定義
└── __tests__/            # テスト
```

## アーキテクチャ

```
ファイルドロップ → Web Audio API でデコード → 全体または一部区間を切り出し → Web Worker に送信
                                                    ↓
                                         Essentia.js (WASM) で解析
                                                    ↓
                                         BPM・ビート位置・信頼度・解析範囲を返却
                                                    ↓
                                         Jotai アトムに格納 → Auto BPM / Tap BPM / 波形 / グラフ描画
```

音声解析は Web Worker 上で実行されるため、メインスレッドをブロックせずスムーズなUI操作を維持します。
