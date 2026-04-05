export function toMono(
	left: Float32Array,
	numberOfChannels: number,
	right?: Float32Array,
): Float32Array {
	if (numberOfChannels === 1 || !right) {
		return left;
	}
	const mono = new Float32Array(left.length);
	for (let i = 0; i < left.length; i++) {
		mono[i] = (left[i] + right[i]) / 2;
	}
	return mono;
}

export function extractMonoData(buffer: AudioBuffer): Float32Array {
	const left = buffer.getChannelData(0);
	const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : undefined;
	return toMono(left, buffer.numberOfChannels, right);
}

let audioContext: AudioContext | null = null;

/** Essentia's RhythmExtractor2013 / BeatTrackerMultiFeature assume 44100 Hz internally */
const ANALYSIS_SAMPLE_RATE = 44100;

function getAudioContext(): AudioContext {
	if (!audioContext) {
		audioContext = new AudioContext({ sampleRate: ANALYSIS_SAMPLE_RATE });
	}
	return audioContext;
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
	const arrayBuffer = await file.arrayBuffer();
	const ctx = getAudioContext();
	return ctx.decodeAudioData(arrayBuffer);
}

export function createPlayback(
	buffer: AudioBuffer,
	onTimeUpdate: (time: number) => void,
	onEnded: () => void,
): {
	play: (startTime?: number) => Promise<void>;
	stop: () => void;
	seek: (time: number) => void;
} {
	const ctx = getAudioContext();
	let source: AudioBufferSourceNode | null = null;
	let startOffset = 0;
	let startedAt = 0;
	let rafId: number | null = null;

	function tick() {
		if (source && startedAt > 0) {
			const elapsed = ctx.currentTime - startedAt + startOffset;
			onTimeUpdate(Math.min(elapsed, buffer.duration));
		}
		rafId = requestAnimationFrame(tick);
	}

	async function play(seekTime?: number) {
		stop();
		if (ctx.state === "suspended") {
			await ctx.resume();
		}
		source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		startOffset = seekTime ?? startOffset;
		source.start(0, startOffset);
		startedAt = ctx.currentTime;
		source.onended = () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			onEnded();
		};
		tick();
	}

	function stop() {
		if (source) {
			source.onended = null;
			source.stop();
			source.disconnect();
			startOffset = ctx.currentTime - startedAt + startOffset;
			source = null;
		}
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		startedAt = 0;
	}

	function seek(time: number) {
		startOffset = time;
		onTimeUpdate(time);
	}

	return { play, stop, seek };
}
