import type { Beat } from "@/types";

/** Canvas drawing colors */
const COLORS = {
	waveform: "#4f46e5",
	beatAuto: "#ef4444",
	beatManual: "#f59e0b",
	playhead: "#ffffff",
} as const;

/** Beat marker opacity range: base + confidence * range */
const BEAT_OPACITY_BASE = 0.4;
const BEAT_OPACITY_RANGE = 0.6;

export interface DownsampleResult {
	min: Float32Array;
	max: Float32Array;
}

export function downsample(data: Float32Array, buckets: number): DownsampleResult {
	if (buckets >= data.length) {
		return { min: new Float32Array(data), max: new Float32Array(data) };
	}

	const bucketSize = data.length / buckets;
	const min = new Float32Array(buckets);
	const max = new Float32Array(buckets);

	for (let i = 0; i < buckets; i++) {
		const start = Math.floor(i * bucketSize);
		const end = Math.floor((i + 1) * bucketSize);
		let lo = Infinity;
		let hi = -Infinity;
		for (let j = start; j < end; j++) {
			if (data[j] < lo) lo = data[j];
			if (data[j] > hi) hi = data[j];
		}
		min[i] = lo;
		max[i] = hi;
	}

	return { min, max };
}

export function drawWaveform(
	ctx: CanvasRenderingContext2D,
	data: Float32Array,
	width: number,
	height: number,
	zoom: number,
	scrollOffset: number,
) {
	const visibleSamples = Math.floor(data.length / zoom);
	const startSample = Math.floor(scrollOffset * data.length);
	const endSample = Math.min(startSample + visibleSamples, data.length);
	const slice = data.slice(startSample, endSample);
	const { min, max } = downsample(slice, width);

	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = COLORS.waveform;
	const mid = height / 2;

	for (let i = 0; i < min.length; i++) {
		const yMin = mid - max[i] * mid;
		const yMax = mid - min[i] * mid;
		ctx.fillRect(i, yMin, 1, Math.max(1, yMax - yMin));
	}
}

export function drawBeatMarkers(
	ctx: CanvasRenderingContext2D,
	beats: Beat[],
	duration: number,
	width: number,
	height: number,
	zoom: number,
	scrollOffset: number,
) {
	const visibleDuration = duration / zoom;
	const startTime = scrollOffset * duration;
	const endTime = startTime + visibleDuration;

	for (const beat of beats) {
		if (beat.time < startTime || beat.time > endTime) continue;

		const x = ((beat.time - startTime) / visibleDuration) * width;
		ctx.strokeStyle = beat.manual ? COLORS.beatManual : COLORS.beatAuto;
		ctx.lineWidth = beat.manual ? 2 : 1;
		ctx.globalAlpha = BEAT_OPACITY_BASE + beat.confidence * BEAT_OPACITY_RANGE;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
}

export function drawPlayhead(
	ctx: CanvasRenderingContext2D,
	currentTime: number,
	duration: number,
	width: number,
	height: number,
	zoom: number,
	scrollOffset: number,
) {
	const visibleDuration = duration / zoom;
	const startTime = scrollOffset * duration;
	const x = ((currentTime - startTime) / visibleDuration) * width;

	if (x < 0 || x > width) return;

	ctx.strokeStyle = COLORS.playhead;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x, 0);
	ctx.lineTo(x, height);
	ctx.stroke();
}

export function timeToX(
	time: number,
	duration: number,
	width: number,
	zoom: number,
	scrollOffset: number,
): number {
	const visibleDuration = duration / zoom;
	const startTime = scrollOffset * duration;
	return ((time - startTime) / visibleDuration) * width;
}

export function xToTime(
	x: number,
	duration: number,
	width: number,
	zoom: number,
	scrollOffset: number,
): number {
	const visibleDuration = duration / zoom;
	const startTime = scrollOffset * duration;
	return startTime + (x / width) * visibleDuration;
}
