import { describe, expect, it } from "vitest";
import {
	ANALYSIS_WINDOW_SECONDS,
	createWindowedAnalysisMetadata,
	getConfidenceLabel,
	offsetAnalysisResult,
	slicePcmWindow,
} from "@/lib/analysis";
import type { AnalysisResult } from "@/types";

describe("createWindowedAnalysisMetadata", () => {
	it("returns a centered analysis window when the track is long enough", () => {
		expect(createWindowedAnalysisMetadata(120, 50)).toEqual({
			scope: "window",
			startTime: 40,
			endTime: 40 + ANALYSIS_WINDOW_SECONDS,
		});
	});

	it("falls back to full-track analysis for short files", () => {
		expect(createWindowedAnalysisMetadata(12, 6)).toEqual({
			scope: "full",
			startTime: 0,
			endTime: 12,
		});
	});
});

describe("offsetAnalysisResult", () => {
	it("shifts beats and bpm curve into track time", () => {
		const result: AnalysisResult = {
			bpm: 120,
			confidence: 0.8,
			beats: [{ time: 1, confidence: 0.8, manual: false }],
			bpmCurve: [{ time: 1, bpm: 120 }],
		};

		expect(offsetAnalysisResult(result, 10)).toEqual({
			bpm: 120,
			confidence: 0.8,
			beats: [{ time: 11, confidence: 0.8, manual: false }],
			bpmCurve: [{ time: 11, bpm: 120 }],
		});
	});
});

describe("slicePcmWindow", () => {
	it("extracts the selected PCM range", () => {
		const pcmData = new Float32Array([0, 1, 2, 3, 4, 5]);
		expect(Array.from(slicePcmWindow(pcmData, 2, 1, 2.5))).toEqual([2, 3, 4]);
	});
});

describe("getConfidenceLabel", () => {
	it("maps numeric confidence into user-facing bands", () => {
		expect(getConfidenceLabel(0.2)).toBe("low");
		expect(getConfidenceLabel(0.5)).toBe("medium");
		expect(getConfidenceLabel(0.9)).toBe("high");
	});
});
