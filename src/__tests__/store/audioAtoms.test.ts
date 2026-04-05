import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import type { WaveformPyramid } from "@/lib/waveform";
import {
	audioBufferAtom,
	currentTimeAtom,
	durationAtom,
	fileNameAtom,
	playbackStateAtom,
	resetAudioStateAtom,
	setLoadedAudioAtom,
} from "@/store/audioAtoms";

describe("audio state atoms", () => {
	it("sets loaded audio metadata and playback defaults", () => {
		const store = createStore();
		const buffer = { duration: 12.5 } as AudioBuffer;
		const waveformPyramid = { totalSamples: 1, levels: [] } satisfies WaveformPyramid;

		store.set(setLoadedAudioAtom, { buffer, fileName: "demo.wav", waveformPyramid });

		expect(store.get(audioBufferAtom)).toBe(buffer);
		expect(store.get(fileNameAtom)).toBe("demo.wav");
		expect(store.get(durationAtom)).toBe(12.5);
		expect(store.get(playbackStateAtom)).toBe("idle");
		expect(store.get(currentTimeAtom)).toBe(0);
	});

	it("resets loaded audio state", () => {
		const store = createStore();
		const buffer = { duration: 12.5 } as AudioBuffer;
		const waveformPyramid = { totalSamples: 1, levels: [] } satisfies WaveformPyramid;

		store.set(setLoadedAudioAtom, { buffer, fileName: "demo.wav", waveformPyramid });
		store.set(currentTimeAtom, 3);
		store.set(playbackStateAtom, "playing");

		store.set(resetAudioStateAtom);

		expect(store.get(audioBufferAtom)).toBeNull();
		expect(store.get(fileNameAtom)).toBe("");
		expect(store.get(durationAtom)).toBe(0);
		expect(store.get(playbackStateAtom)).toBe("idle");
		expect(store.get(currentTimeAtom)).toBe(0);
	});
});
