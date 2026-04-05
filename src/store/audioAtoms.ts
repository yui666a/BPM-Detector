import { atom } from "jotai";
import type { WaveformPyramid } from "@/lib/waveform";
import type { PlaybackState } from "@/types";

export const audioBufferAtom = atom<AudioBuffer | null>(null);
export const waveformPyramidAtom = atom<WaveformPyramid | null>(null);
export const fileNameAtom = atom<string>("");
export const durationAtom = atom<number>(0);
export const playbackStateAtom = atom<PlaybackState>("idle");
export const currentTimeAtom = atom<number>(0);

export const resetAudioStateAtom = atom(null, (_get, set) => {
	set(audioBufferAtom, null);
	set(waveformPyramidAtom, null);
	set(fileNameAtom, "");
	set(durationAtom, 0);
	set(playbackStateAtom, "idle");
	set(currentTimeAtom, 0);
});

export const setLoadedAudioAtom = atom(
	null,
	(
		_get,
		set,
		payload: { buffer: AudioBuffer; fileName: string; waveformPyramid: WaveformPyramid },
	) => {
		set(audioBufferAtom, payload.buffer);
		set(waveformPyramidAtom, payload.waveformPyramid);
		set(fileNameAtom, payload.fileName);
		set(durationAtom, payload.buffer.duration);
		set(playbackStateAtom, "idle");
		set(currentTimeAtom, 0);
	},
);
