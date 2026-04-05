export type Locale = "en" | "ja";

export interface Dictionary {
	title: string;
	dropZone: string;
	dropZoneFormats: string;
	modeMusic: string;
	modeMusicDesc: string;
	modeSE: string;
	modeSEDesc: string;
	analyzing: string;
	autoBpm: string;
	estimatedBpm: string;
	confidence: string;
	fullTrack: string;
	confidenceLow: string;
	confidenceMedium: string;
	confidenceHigh: string;
	stop: string;
	play: string;
	analyzePrefix: string;
	analyzeSuffix: string;
	analyzeButton: string;
	tapTempo: string;
	tapButton: string;
	tapInstruction: string;
	tapResetNotice: (seconds: number) => string;
	clear: string;
	bpmUnit: string;
	unsupportedFormat: string;
	unexpectedError: string;
}
