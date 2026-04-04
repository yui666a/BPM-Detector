// eslint-disable-next-line @typescript-eslint/no-explicit-any
let essentia: any = null;

async function init() {
	// essentia.js ES builds:
	// - essentia-wasm.es.js: named export `EssentiaWASM` which is the Emscripten Module object (not a function)
	// - essentia.js-core.es.js: default export `Essentia` constructor
	// @ts-expect-error essentia.js has no proper ESM type exports
	const { EssentiaWASM } = await import("essentia.js/dist/essentia-wasm.es.js");
	// @ts-expect-error essentia.js has no proper ESM type exports
	const { default: Essentia } = await import("essentia.js/dist/essentia.js-core.es.js");

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
	const confidence: number = Math.min(rhythm.confidence / 5.32, 1);

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

	const bpmCurve = calculateBpmCurve(onsetTimes);

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
