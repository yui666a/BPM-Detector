import { describe, expect, it } from "vitest";
import { toMono } from "@/engine/audio";

describe("toMono", () => {
	it("returns the same data for mono input", () => {
		const mono = new Float32Array([0.1, 0.2, 0.3]);
		const result = toMono(mono, 1);
		expect(result).toEqual(mono);
	});

	it("averages channels for stereo input", () => {
		const left = new Float32Array([1.0, 0.0, 0.5]);
		const right = new Float32Array([0.0, 1.0, 0.5]);
		const result = toMono(left, 2, right);
		expect(result[0]).toBeCloseTo(0.5);
		expect(result[1]).toBeCloseTo(0.5);
		expect(result[2]).toBeCloseTo(0.5);
	});
});
