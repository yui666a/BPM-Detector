import type { Dictionary } from "./types";

const en: Dictionary = {
	title: "BPM Detector",

	// FileDropZone
	dropZone: "Drag & drop audio file or click to select",
	dropZoneFormats: "MP3, WAV, M4A, AAC, OGG, FLAC",

	// ModeSelector
	modeMusic: "Music",
	modeMusicDesc: "For music with drums/bass beats (RhythmExtractor2013)",
	modeSE: "SE / SFX",
	modeSEDesc: "Estimates periodicity from pulse-like sound timings (energy-based)",

	// BpmDisplay
	analyzing: "Analyzing...",
	autoBpm: "Auto BPM",
	estimatedBpm: "Estimated BPM",
	confidence: "Confidence",
	fullTrack: "Full Track",
	confidenceLow: "low confidence",
	confidenceMedium: "medium confidence",
	confidenceHigh: "high confidence",

	// PlaybackControls
	stop: "Stop",
	play: "Play",
	analyzePrefix: "Analyze",
	analyzeSuffix: "sec from playhead",
	analyzeButton: "Go",

	// TapTempo
	tapTempo: "Tap Tempo",
	tapButton: "Tap",
	tapInstruction: "Press the button repeatedly or hit the Space key to measure BPM from intervals.",
	tapResetNotice: (seconds: number) => `Resets automatically after ${seconds}s of inactivity.`,
	clear: "Clear",

	// BpmGraph tooltip
	bpmUnit: "BPM",

	// Errors
	unsupportedFormat: "This file format is not supported",
	unexpectedError: "An unexpected error occurred",
};

export default en;
