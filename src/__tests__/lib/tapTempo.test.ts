import { describe, expect, it } from "vitest";
import { appendTapTime, calculateTapBpm, MAX_TAPS, TAP_RESET_MS } from "@/lib/tapTempo";

describe("appendTapTime", () => {
	it("appends taps while the rhythm is continuous", () => {
		expect(appendTapTime([1000, 1500], 2000)).toEqual([1000, 1500, 2000]);
	});

	it("resets tap history after a long pause", () => {
		expect(appendTapTime([1000, 1500], 1500 + TAP_RESET_MS + 1)).toEqual([3501]);
	});

	it("keeps only the most recent taps", () => {
		const taps = Array.from({ length: MAX_TAPS }, (_, index) => index * 500);
		expect(appendTapTime(taps, MAX_TAPS * 500)).toHaveLength(MAX_TAPS);
	});
});

describe("calculateTapBpm", () => {
	it("returns null until there are at least two taps", () => {
		expect(calculateTapBpm([])).toBeNull();
		expect(calculateTapBpm([1000])).toBeNull();
	});

	it("calculates bpm from the average tap interval", () => {
		expect(calculateTapBpm([0, 500, 1000, 1500])).toBeCloseTo(120);
		expect(calculateTapBpm([0, 400, 800, 1200])).toBeCloseTo(150);
	});
});
