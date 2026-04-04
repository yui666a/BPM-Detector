import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import {
	beatsAtom,
	bpmAtom,
	bpmCurveAtom,
	confidenceAtom,
	resetAnalysisResultAtom,
	setAnalysisResultAtom,
} from "@/store/analysisAtoms";
import type { AnalysisResult } from "@/types";

describe("setAnalysisResultAtom", () => {
	it("sets all analysis atoms from AnalysisResult", () => {
		const store = createStore();
		const result: AnalysisResult = {
			bpm: 128,
			confidence: 0.92,
			beats: [
				{ time: 0.5, confidence: 0.9, manual: false },
				{ time: 1.0, confidence: 0.85, manual: false },
			],
			bpmCurve: [
				{ time: 0.5, bpm: 120 },
				{ time: 1.0, bpm: 128 },
			],
		};

		store.set(setAnalysisResultAtom, result);

		expect(store.get(bpmAtom)).toBe(128);
		expect(store.get(confidenceAtom)).toBe(0.92);
		expect(store.get(beatsAtom)).toHaveLength(2);
		expect(store.get(bpmCurveAtom)).toHaveLength(2);
	});

	it("resets analysis atoms", () => {
		const store = createStore();
		store.set(setAnalysisResultAtom, {
			bpm: 128,
			confidence: 0.92,
			beats: [{ time: 0.5, confidence: 0.9, manual: false }],
			bpmCurve: [{ time: 0.5, bpm: 120 }],
		});

		store.set(resetAnalysisResultAtom);

		expect(store.get(bpmAtom)).toBe(0);
		expect(store.get(confidenceAtom)).toBe(0);
		expect(store.get(beatsAtom)).toEqual([]);
		expect(store.get(bpmCurveAtom)).toEqual([]);
	});

	it("recomputes bpm and curve when beats are edited manually", () => {
		const store = createStore();
		store.set(setAnalysisResultAtom, {
			bpm: 128,
			confidence: 0.92,
			beats: [
				{ time: 0.0, confidence: 0.9, manual: false },
				{ time: 0.5, confidence: 0.9, manual: false },
				{ time: 1.0, confidence: 0.9, manual: false },
			],
			bpmCurve: [
				{ time: 0.5, bpm: 120 },
				{ time: 1.0, bpm: 120 },
			],
		});

		store.set(beatsAtom, (prev) => [prev[0], { ...prev[1], time: 0.75, manual: true }, prev[2]]);

		expect(store.get(beatsAtom)).toEqual([
			{ time: 0.0, confidence: 0.9, manual: false },
			{ time: 0.75, confidence: 0.9, manual: true },
			{ time: 1.0, confidence: 0.9, manual: false },
		]);
		expect(store.get(bpmAtom)).toBeCloseTo(80);
		expect(store.get(confidenceAtom)).toBe(0.92);
		expect(store.get(bpmCurveAtom)).toEqual([
			{ time: 0.75, bpm: 80 },
			{ time: 1.0, bpm: 240 },
		]);
	});
});
