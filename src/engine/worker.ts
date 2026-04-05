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

function normalizeSignal(data: Float32Array): Float32Array {
	let peak = 0;
	for (let i = 0; i < data.length; i++) {
		peak = Math.max(peak, Math.abs(data[i]));
	}

	if (peak === 0) return data;

	const normalized = new Float32Array(data.length);
	for (let i = 0; i < data.length; i++) {
		normalized[i] = data[i] / peak;
	}
	return normalized;
}

function emphasizePercussiveSignal(pcmData: Float32Array): Float32Array {
	const emphasized = new Float32Array(pcmData.length);
	let previousSample = 0;

	for (let i = 0; i < pcmData.length; i++) {
		const currentSample = pcmData[i];
		const differentiated = currentSample - previousSample * 0.98;
		emphasized[i] = Math.max(0, differentiated);
		previousSample = currentSample;
	}

	return normalizeSignal(emphasized);
}

function runMusicAnalysis(signalData: Float32Array) {
	if (!essentia) throw new Error("Essentia not initialized");

	const signal = essentia.arrayToVector(signalData);
	const rhythm = essentia.RhythmExtractor2013(signal);
	const ticks: number[] = essentia.vectorToArray(rhythm.ticks);

	return {
		bpm: rhythm.bpm as number,
		ticks,
		confidence: Math.min(rhythm.confidence / RHYTHM_CONFIDENCE_MAX, 1),
	};
}

function analyzeMusic(pcmData: Float32Array, sampleRate: number) {
	const rawAnalysis = runMusicAnalysis(pcmData);
	const emphasizedAnalysis = runMusicAnalysis(emphasizePercussiveSignal(pcmData));
	const rhythm =
		emphasizedAnalysis.confidence > rawAnalysis.confidence ? emphasizedAnalysis : rawAnalysis;

	console.log("[music-analysis]", {
		rhythmExtractor2013: {
			bpm: rawAnalysis.bpm,
			confidence: rawAnalysis.confidence,
			ticks: rawAnalysis.ticks.length,
			sampleRate,
		},
		emphasized: {
			bpm: emphasizedAnalysis.bpm,
			confidence: emphasizedAnalysis.confidence,
			ticks: emphasizedAnalysis.ticks.length,
		},
		selected: {
			source:
				emphasizedAnalysis.confidence > rawAnalysis.confidence ? "emphasized" : "rhythm-extractor",
			bpm: rhythm.bpm,
			confidence: rhythm.confidence,
			ticks: rhythm.ticks.length,
		},
	});

	const bpm: number = rhythm.bpm;
	const ticks = rhythm.ticks;
	const confidence: number = rhythm.confidence;

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
				analyzeMusic(pcmData, sampleRate);
			} else {
				analyzeSE(pcmData, sampleRate);
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		self.postMessage({ type: "ERROR", message });
	}
};
