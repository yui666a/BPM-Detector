import type { AnalysisMetadata, AnalysisResult } from "@/types";

export const DEFAULT_ANALYSIS_WINDOW_SECONDS = 20;

export function createWindowedAnalysisMetadata(
	duration: number,
	startFrom: number,
	windowSeconds = DEFAULT_ANALYSIS_WINDOW_SECONDS,
): AnalysisMetadata {
	if (duration <= 0) {
		return { scope: "full", startTime: 0, endTime: 0 };
	}

	const remaining = duration - startFrom;
	if (remaining <= 0) {
		return { scope: "full", startTime: 0, endTime: duration };
	}

	if (remaining <= windowSeconds) {
		return { scope: "window", startTime: startFrom, endTime: duration };
	}

	return { scope: "window", startTime: startFrom, endTime: startFrom + windowSeconds };
}

export function offsetAnalysisResult(result: AnalysisResult, offsetTime: number): AnalysisResult {
	if (offsetTime === 0) return result;

	return {
		...result,
		beats: result.beats.map((beat) => ({ ...beat, time: beat.time + offsetTime })),
		bpmCurve: result.bpmCurve.map((point) => ({ ...point, time: point.time + offsetTime })),
	};
}

export function slicePcmWindow(
	pcmData: Float32Array,
	sampleRate: number,
	startTime: number,
	endTime: number,
): Float32Array {
	const startSample = Math.max(0, Math.floor(startTime * sampleRate));
	const endSample = Math.min(pcmData.length, Math.ceil(endTime * sampleRate));
	return pcmData.slice(startSample, endSample);
}

export function getConfidenceLabel(confidence: number): "low" | "medium" | "high" {
	if (confidence < 0.35) return "low";
	if (confidence < 0.65) return "medium";
	return "high";
}
