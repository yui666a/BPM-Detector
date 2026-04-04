import { atom } from "jotai";
import type { PlaybackState } from "@/types";

export const audioBufferAtom = atom<AudioBuffer | null>(null);
export const fileNameAtom = atom<string>("");
export const durationAtom = atom<number>(0);
export const playbackStateAtom = atom<PlaybackState>("idle");
export const currentTimeAtom = atom<number>(0);
