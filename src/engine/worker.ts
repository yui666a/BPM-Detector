/** SE/SFX onset detection parameters */
const SE_FRAME_SIZE = 2048;
const SE_HOP_SIZE = 512;
const SE_ENERGY_THRESHOLD = 0.3;
const SE_DEFAULT_CONFIDENCE = 0.7;

/** RhythmExtractor2013 confidence normalization (raw scale: 0–5.32) */
const RHYTHM_CONFIDENCE_MAX = 5.32;

interface EssentiaInstance {
	arrayToVector(data: Float32Array): unknown;
	RhythmExtractor2013(signal: unknown): {
		bpm: number;
		ticks: unknown;
		confidence: number;
	};
	vectorToArray(vector: unknown): number[];
}

interface EssentiaConstructor {
	new (wasmModule: unknown): EssentiaInstance;
}

let essentia: EssentiaInstance | null = null;

async function init() {
	// essentia.js ES builds:
	// - essentia-wasm.es.js: named export `EssentiaWASM` which is the Emscripten Module object (not a function)
	// - essentia.js-core.es.js: default export `Essentia` constructor
	// @ts-expect-error essentia.js has no proper ESM type exports
	const { EssentiaWASM } = await import("essentia.js/dist/essentia-wasm.es.js");
	const { default: Essentia } = (await import("essentia.js/dist/essentia.js-core.es.js")) as {
		default: EssentiaConstructor;
	};

	// EssentiaWASM is already the initialized Module object
	essentia = new Essentia(EssentiaWASM);
	self.postMessage({ type: "READY" });
}

function calculateBpmCurve(times: number[]): { time: number; bpm: number }[] {
	const curve = [];
	for (let i = 1; i < times.length; i++) {
		const interval = times[i] - times[i - 1];
		if (interval > 0) {
			curve.push({ time: times[i], bpm: 60 / interval });
		}
	}
	return curve;
}

function analyzeMusic(pcmData: Float32Array) {
	if (!essentia) throw new Error("Essentia not initialized");

	const signal = essentia.arrayToVector(pcmData);
	const rhythm = essentia.RhythmExtractor2013(signal);

	const bpm: number = rhythm.bpm;
	const ticks: number[] = essentia.vectorToArray(rhythm.ticks);
	// RhythmExtractor2013 returns confidence on a 0–5.32 scale; normalize to 0–1
	const confidence: number = Math.min(rhythm.confidence / RHYTHM_CONFIDENCE_MAX, 1);

	const beats = ticks.map((time) => ({
		time,
		confidence,
		manual: false,
	}));

	const bpmCurve = calculateBpmCurve(ticks);

	self.postMessage({
		type: "RESULT",
		data: { bpm, beats, bpmCurve, confidence },
	});
}

function analyzeSE(pcmData: Float32Array, sampleRate: number) {
	if (!essentia) throw new Error("Essentia not initialized");

	const onsetTimes: number[] = [];
	let prevEnergy = 0;

	for (let i = 0; i + SE_FRAME_SIZE < pcmData.length; i += SE_HOP_SIZE) {
		const frame = pcmData.slice(i, i + SE_FRAME_SIZE);
		let energy = 0;
		for (let j = 0; j < frame.length; j++) {
			energy += frame[j] * frame[j];
		}
		energy /= frame.length;

		const diff = energy - prevEnergy;
		if (diff > SE_ENERGY_THRESHOLD && prevEnergy > 0) {
			onsetTimes.push(i / sampleRate);
		}
		prevEnergy = energy;
	}

	const beats = onsetTimes.map((time) => ({
		time,
		confidence: SE_DEFAULT_CONFIDENCE,
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

	const bpmCurve = calculateBpmCurve(onsetTimes);

	self.postMessage({
		type: "RESULT",
		data: { bpm, beats, bpmCurve, confidence: SE_DEFAULT_CONFIDENCE },
	});
}

self.onmessage = async (event: MessageEvent) => {
	const { type, pcmData, sampleRate, mode } = event.data;

	try {
		if (type === "INIT") {
			await init();
		} else if (type === "ANALYZE") {
			if (mode === "music") {
				analyzeMusic(pcmData);
			} else {
				analyzeSE(pcmData, sampleRate);
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		self.postMessage({ type: "ERROR", message });
	}
};
