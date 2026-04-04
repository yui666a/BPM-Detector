// @ts-expect-error essentia.js has no TypeScript types
import { Essentia, EssentiaWASM } from "essentia.js";

let essentia: Essentia | null = null;

async function init() {
	const wasmModule = await EssentiaWASM();
	essentia = new Essentia(wasmModule);
	self.postMessage({ type: "READY" });
}

function analyzeMusic(pcmData: Float32Array) {
	if (!essentia) throw new Error("Essentia not initialized");

	const signal = essentia.arrayToVector(pcmData);
	const rhythm = essentia.RhythmExtractor2013(signal);

	const bpm: number = rhythm.bpm;
	const ticks: number[] = essentia.vectorToArray(rhythm.ticks);
	const confidence: number = rhythm.confidence;

	const beats = ticks.map((time) => ({
		time,
		confidence,
		manual: false,
	}));

	const bpmCurve = [];
	for (let i = 1; i < ticks.length; i++) {
		const interval = ticks[i] - ticks[i - 1];
		if (interval > 0) {
			bpmCurve.push({
				time: ticks[i],
				bpm: 60 / interval,
			});
		}
	}

	self.postMessage({
		type: "RESULT",
		data: { bpm, beats, bpmCurve, confidence },
	});
}

function analyzeSE(pcmData: Float32Array, sampleRate: number) {
	if (!essentia) throw new Error("Essentia not initialized");

	const frameSize = 2048;
	const hopSize = 512;
	const onsetTimes: number[] = [];
	let prevEnergy = 0;
	const threshold = 0.3;

	for (let i = 0; i + frameSize < pcmData.length; i += hopSize) {
		const frame = pcmData.slice(i, i + frameSize);
		let energy = 0;
		for (let j = 0; j < frame.length; j++) {
			energy += frame[j] * frame[j];
		}
		energy /= frame.length;

		const diff = energy - prevEnergy;
		if (diff > threshold && prevEnergy > 0) {
			onsetTimes.push(i / sampleRate);
		}
		prevEnergy = energy;
	}

	const beats = onsetTimes.map((time) => ({
		time,
		confidence: 0.7,
		manual: false,
	}));

	let bpm = 0;
	if (onsetTimes.length >= 2) {
		const intervals = [];
		for (let i = 1; i < onsetTimes.length; i++) {
			intervals.push(onsetTimes[i] - onsetTimes[i - 1]);
		}
		const medianInterval = intervals.sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
		bpm = 60 / medianInterval;
	}

	const bpmCurve = [];
	for (let i = 1; i < onsetTimes.length; i++) {
		const interval = onsetTimes[i] - onsetTimes[i - 1];
		if (interval > 0) {
			bpmCurve.push({
				time: onsetTimes[i],
				bpm: 60 / interval,
			});
		}
	}

	self.postMessage({
		type: "RESULT",
		data: { bpm, beats, bpmCurve, confidence: 0.7 },
	});
}

self.onmessage = async (event: MessageEvent) => {
	const { type, pcmData, sampleRate, mode } = event.data;

	if (type === "INIT") {
		await init();
	} else if (type === "ANALYZE") {
		if (mode === "music") {
			analyzeMusic(pcmData);
		} else {
			analyzeSE(pcmData, sampleRate);
		}
	}
};
