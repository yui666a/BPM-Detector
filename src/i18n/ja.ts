import type { Dictionary } from "./types";

const ja: Dictionary = {
	title: "BPM Detector",

	// FileDropZone
	dropZone: "音声ファイルをドラッグ＆ドロップ、またはクリックして選択",
	dropZoneFormats: "MP3, WAV, M4A, AAC, OGG, FLAC",

	// ModeSelector
	modeMusic: "Music",
	modeMusicDesc: "ドラム/ベースなどビートがある音楽向け（RhythmExtractor2013）",
	modeSE: "SE / SFX",
	modeSEDesc: "パルス的な音のタイミングからパターンの周期性を推定（エネルギーベース）",

	// BpmDisplay
	analyzing: "解析中...",
	autoBpm: "Auto BPM",
	estimatedBpm: "推定 BPM",
	confidence: "信頼度",
	fullTrack: "全体",
	confidenceLow: "低信頼度",
	confidenceMedium: "中信頼度",
	confidenceHigh: "高信頼度",

	// PlaybackControls
	stop: "Stop",
	play: "Play",
	analyzePrefix: "現在の再生位置から",
	analyzeSuffix: "秒間でBPMを",
	analyzeButton: "解析する",

	// TapTempo
	tapTempo: "手動で計測",
	tapButton: "クリック",
	tapInstruction: "ボタンを連続で押すか Space キーを叩くと、間隔から BPM を計測します。",
	tapResetNotice: (seconds: number) => `${seconds}秒以上空くと計測を自動でリセットします。`,
	clear: "クリア",

	// BpmGraph tooltip
	bpmUnit: "BPM",

	// Errors
	unsupportedFormat: "このファイル形式は対応していません",
	unexpectedError: "予期しないエラーが発生しました",
};

export default ja;
