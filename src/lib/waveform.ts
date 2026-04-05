import type { Beat } from "@/types";

/** Canvas drawing colors */
const COLORS = {
	waveform: "#4f46e5",
	beatAuto: "#ef4444",
	beatManual: "#f59e0b",
	tapMarker: "#fbbf24",
	playhead: "#ffffff",
} as const;

/** Beat marker opacity range: base + confidence * range */
const BEAT_OPACITY_BASE = 0.4;
const BEAT_OPACITY_RANGE = 0.6;
const MIN_WAVEFORM_BUCKETS = 512;
const MAX_WAVEFORM_BUCKETS = 65536;

export interface DownsampleResult {
	min: Float32Array;
	max: Float32Array;
}

export interface WaveformLevel {
	bucketCount: number;
	min: Float32Array;
	max: Float32Array;
}

export interface WaveformPyramid {
	totalSamples: number;
	levels: WaveformLevel[];
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

function summarizeAudioBuffer(buffer: AudioBuffer, bucketCount: number): WaveformLevel {
	const channelCount = buffer.numberOfChannels;
	const channels = Array.from({ length: channelCount }, (_, index) => buffer.getChannelData(index));
	const totalSamples = buffer.length;
	const min = new Float32Array(bucketCount);
	const max = new Float32Array(bucketCount);

	for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex++) {
		const start = Math.floor((bucketIndex * totalSamples) / bucketCount);
		const end = Math.min(
			totalSamples,
			Math.floor(((bucketIndex + 1) * totalSamples) / bucketCount),
		);

		if (end <= start) {
			const sampleIndex = Math.min(start, totalSamples - 1);
			let sample = 0;
			for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
				sample += channels[channelIndex]?.[sampleIndex] ?? 0;
			}
			sample /= channelCount;
			min[bucketIndex] = sample;
			max[bucketIndex] = sample;
			continue;
		}

		let lo = Infinity;
		let hi = -Infinity;
		for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
			let sample = 0;
			for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
				sample += channels[channelIndex]?.[sampleIndex] ?? 0;
			}
			sample /= channelCount;
			if (sample < lo) lo = sample;
			if (sample > hi) hi = sample;
		}
		min[bucketIndex] = lo;
		max[bucketIndex] = hi;
	}

	return { bucketCount, min, max };
}

function downsampleLevel(level: WaveformLevel, bucketCount: number): WaveformLevel {
	if (bucketCount >= level.bucketCount) {
		return {
			bucketCount: level.bucketCount,
			min: new Float32Array(level.min),
			max: new Float32Array(level.max),
		};
	}

	const min = new Float32Array(bucketCount);
	const max = new Float32Array(bucketCount);

	for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex++) {
		const start = Math.floor((bucketIndex * level.bucketCount) / bucketCount);
		const end = Math.min(
			level.bucketCount,
			Math.floor(((bucketIndex + 1) * level.bucketCount) / bucketCount),
		);
		let lo = Infinity;
		let hi = -Infinity;

		for (let sampleIndex = start; sampleIndex < end; sampleIndex++) {
			if (level.min[sampleIndex] < lo) lo = level.min[sampleIndex];
			if (level.max[sampleIndex] > hi) hi = level.max[sampleIndex];
		}

		min[bucketIndex] = lo;
		max[bucketIndex] = hi;
	}

	return { bucketCount, min, max };
}

export function buildWaveformPyramid(buffer: AudioBuffer): WaveformPyramid {
	const totalSamples = buffer.length;
	if (totalSamples === 0) {
		return { totalSamples: 0, levels: [] };
	}

	const highestBucketCount = Math.min(
		MAX_WAVEFORM_BUCKETS,
		Math.max(MIN_WAVEFORM_BUCKETS, totalSamples),
	);
	const highestResolution = summarizeAudioBuffer(buffer, highestBucketCount);
	const levels: WaveformLevel[] = [highestResolution];
	let currentLevel = highestResolution;

	while (currentLevel.bucketCount > MIN_WAVEFORM_BUCKETS) {
		const nextBucketCount = Math.max(
			MIN_WAVEFORM_BUCKETS,
			Math.floor(currentLevel.bucketCount / 2),
		);
		if (nextBucketCount === currentLevel.bucketCount) break;
		currentLevel = downsampleLevel(currentLevel, nextBucketCount);
		levels.unshift(currentLevel);
	}

	return { totalSamples, levels };
}

export function selectWaveformLevel(
	pyramid: WaveformPyramid,
	width: number,
	zoom: number,
): WaveformLevel | null {
	if (pyramid.levels.length === 0) return null;

	const targetBucketCount = Math.max(Math.ceil(width * zoom), MIN_WAVEFORM_BUCKETS);
	return (
		pyramid.levels.find((level) => level.bucketCount >= targetBucketCount) ??
		pyramid.levels[pyramid.levels.length - 1] ??
		null
	);
}

export function drawWaveform(
	ctx: CanvasRenderingContext2D,
	pyramid: WaveformPyramid,
	width: number,
	height: number,
	zoom: number,
	scrollOffset: number,
) {
	const level = selectWaveformLevel(pyramid, width, zoom);
	if (!level) return;

	const visibleBuckets = Math.max(1, Math.ceil(level.bucketCount / zoom));
	const maxStartBucket = Math.max(0, level.bucketCount - visibleBuckets);
	const startBucket = Math.min(maxStartBucket, Math.floor(scrollOffset * level.bucketCount));
	const endBucket = Math.min(level.bucketCount, startBucket + visibleBuckets);

	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = COLORS.waveform;
	const mid = height / 2;

	for (let x = 0; x < width; x++) {
		const bucketStart = startBucket + Math.floor((x * visibleBuckets) / width);
		const bucketEnd = startBucket + Math.ceil(((x + 1) * visibleBuckets) / width);
		let lo = Infinity;
		let hi = -Infinity;

		for (
			let bucketIndex = bucketStart;
			bucketIndex < Math.min(bucketEnd, endBucket);
			bucketIndex++
		) {
			if (level.min[bucketIndex] < lo) lo = level.min[bucketIndex];
			if (level.max[bucketIndex] > hi) hi = level.max[bucketIndex];
		}

		if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;

		const yMin = mid - hi * mid;
		const yMax = mid - lo * mid;
		ctx.fillRect(x, yMin, 1, Math.max(1, yMax - yMin));
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

export function drawTapMarkers(
	ctx: CanvasRenderingContext2D,
	tapMarkers: number[],
	duration: number,
	width: number,
	height: number,
	zoom: number,
	scrollOffset: number,
) {
	const visibleDuration = duration / zoom;
	const startTime = scrollOffset * duration;
	const endTime = startTime + visibleDuration;

	ctx.strokeStyle = COLORS.tapMarker;
	ctx.lineWidth = 2;
	ctx.globalAlpha = 0.85;

	for (const markerTime of tapMarkers) {
		if (markerTime < startTime || markerTime > endTime) continue;

		const x = ((markerTime - startTime) / visibleDuration) * width;
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
