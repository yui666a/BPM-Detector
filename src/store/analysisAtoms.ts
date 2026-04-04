import { atom } from "jotai";
import type { AnalysisMode, AnalysisResult, Beat, BpmPoint } from "@/types";

export const analysisModeAtom = atom<AnalysisMode>("music");
export const isAnalyzingAtom = atom<boolean>(false);

type BeatUpdate = Beat[] | ((prev: Beat[]) => Beat[]);

const EMPTY_ANALYSIS_RESULT: AnalysisResult = {
	bpm: 0,
	confidence: 0,
	beats: [],
	bpmCurve: [],
};

function calculateBpmCurve(times: number[]): BpmPoint[] {
	const curve: BpmPoint[] = [];
	for (let i = 1; i < times.length; i++) {
		const interval = times[i] - times[i - 1];
		if (interval > 0) {
			curve.push({ time: times[i], bpm: 60 / interval });
		}
	}
	return curve;
}

function calculateBpm(times: number[]): number {
	if (times.length < 2) return 0;

	const intervals = [];
	for (let i = 1; i < times.length; i++) {
		const interval = times[i] - times[i - 1];
		if (interval > 0) {
			intervals.push(interval);
		}
	}

	if (intervals.length === 0) return 0;

	const sortedIntervals = [...intervals].sort((a, b) => a - b);
	const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
	return 60 / medianInterval;
}

function recomputeAnalysisResult(beats: Beat[], confidence: number): AnalysisResult {
	const sortedTimes = beats
		.map((beat) => beat.time)
		.filter((time) => Number.isFinite(time))
		.sort((a, b) => a - b);

	return {
		bpm: calculateBpm(sortedTimes),
		confidence,
		beats,
		bpmCurve: calculateBpmCurve(sortedTimes),
	};
}

const analysisResultAtom = atom<AnalysisResult>(EMPTY_ANALYSIS_RESULT);

export const bpmAtom = atom<number>((get) => get(analysisResultAtom).bpm);
export const confidenceAtom = atom<number>((get) => get(analysisResultAtom).confidence);
export const bpmCurveAtom = atom<BpmPoint[]>((get) => get(analysisResultAtom).bpmCurve);
export const beatsAtom = atom<Beat[], [BeatUpdate], void>(
	(get) => get(analysisResultAtom).beats,
	(get, set, update) => {
		const current = get(analysisResultAtom);
		const nextBeats = typeof update === "function" ? update(current.beats) : update;
		set(analysisResultAtom, recomputeAnalysisResult(nextBeats, current.confidence));
	},
);

export const setAnalysisResultAtom = atom(null, (_get, set, result: AnalysisResult) => {
	set(analysisResultAtom, result);
});

export const resetAnalysisResultAtom = atom(null, (_get, set) => {
	set(analysisResultAtom, EMPTY_ANALYSIS_RESULT);
});
