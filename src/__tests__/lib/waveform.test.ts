import { describe, expect, it, vi } from "vitest";
import { downsample, drawTapMarkers } from "@/lib/waveform";

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

describe("drawTapMarkers", () => {
	it("draws visible tap markers onto the waveform", () => {
		const ctx = {
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			stroke: vi.fn(),
			strokeStyle: "",
			lineWidth: 0,
			globalAlpha: 1,
		} as unknown as CanvasRenderingContext2D;

		drawTapMarkers(ctx, [1, 3, 12], 10, 1000, 200, 1, 0);

		expect(ctx.beginPath).toHaveBeenCalledTimes(2);
		expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 100, 0);
		expect(ctx.moveTo).toHaveBeenNthCalledWith(2, 300, 0);
		expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 100, 200);
		expect(ctx.lineTo).toHaveBeenNthCalledWith(2, 300, 200);
	});
});
