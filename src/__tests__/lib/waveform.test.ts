import { describe, expect, it } from "vitest";
import { downsample } from "@/lib/waveform";

describe("downsample", () => {
	it("reduces sample count to target bucket count", () => {
		const data = new Float32Array([0.1, 0.9, -0.5, 0.3, 0.7, -0.2, 0.4, 0.8]);
		const result = downsample(data, 4);
		expect(result.max).toHaveLength(4);
		expect(result.min).toHaveLength(4);
	});

	it("computes correct min/max per bucket", () => {
		const data = new Float32Array([0.2, 0.8, -0.3, 0.5]);
		const result = downsample(data, 2);
		expect(result.max[0]).toBeCloseTo(0.8);
		expect(result.min[0]).toBeCloseTo(0.2);
		expect(result.max[1]).toBeCloseTo(0.5);
		expect(result.min[1]).toBeCloseTo(-0.3);
	});

	it("returns original data when bucket count >= data length", () => {
		const data = new Float32Array([0.1, 0.2]);
		const result = downsample(data, 10);
		expect(result.max).toHaveLength(2);
	});
});
