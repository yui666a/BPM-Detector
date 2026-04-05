import { describe, expect, it, vi } from "vitest";
import {
	buildWaveformPyramid,
	downsample,
	drawTapMarkers,
	drawWaveform,
	selectWaveformLevel,
} from "@/lib/waveform";

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

describe("buildWaveformPyramid", () => {
	it("builds multiple waveform levels from an AudioBuffer", () => {
		const channelA = Float32Array.from({ length: 4096 }, (_, index) => Math.sin(index / 16));
		const channelB = Float32Array.from({ length: 4096 }, (_, index) => Math.cos(index / 16) * 0.5);
		const buffer = {
			length: 4096,
			numberOfChannels: 2,
			getChannelData: vi.fn((channel: number) => (channel === 0 ? channelA : channelB)),
		} as unknown as AudioBuffer;

		const pyramid = buildWaveformPyramid(buffer);

		expect(pyramid.totalSamples).toBe(4096);
		expect(pyramid.levels.length).toBeGreaterThan(1);
		expect(pyramid.levels[0]?.bucketCount).toBe(512);
		expect(pyramid.levels.at(-1)?.bucketCount).toBe(4096);
	});
});

describe("selectWaveformLevel", () => {
	it("selects a level that matches the current zoom density", () => {
		const pyramid = {
			totalSamples: 4096,
			levels: [
				{ bucketCount: 512, min: new Float32Array(512), max: new Float32Array(512) },
				{ bucketCount: 1024, min: new Float32Array(1024), max: new Float32Array(1024) },
				{ bucketCount: 2048, min: new Float32Array(2048), max: new Float32Array(2048) },
			],
		};

		expect(selectWaveformLevel(pyramid, 400, 1)?.bucketCount).toBe(512);
		expect(selectWaveformLevel(pyramid, 400, 2)?.bucketCount).toBe(1024);
		expect(selectWaveformLevel(pyramid, 400, 8)?.bucketCount).toBe(2048);
	});
});

describe("drawWaveform", () => {
	it("renders from a precomputed waveform pyramid", () => {
		const clearRect = vi.fn();
		const fillRect = vi.fn();
		const ctx = {
			clearRect,
			fillRect,
			fillStyle: "",
		} as unknown as CanvasRenderingContext2D;
		const pyramid = {
			totalSamples: 1024,
			levels: [
				{
					bucketCount: 512,
					min: new Float32Array(512).fill(-0.5),
					max: new Float32Array(512).fill(0.5),
				},
			],
		};

		drawWaveform(ctx, pyramid, 100, 50, 1, 0);

		expect(clearRect).toHaveBeenCalledWith(0, 0, 100, 50);
		expect(fillRect).toHaveBeenCalledTimes(100);
	});
});
