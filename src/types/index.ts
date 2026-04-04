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
