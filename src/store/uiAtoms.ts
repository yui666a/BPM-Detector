import { atom } from "jotai";
import { MAX_TAPS } from "@/lib/tapTempo";

export const zoomAtom = atom<number>(1);
export const scrollOffsetAtom = atom<number>(0);
export const tapMarkersAtom = atom<number[]>([]);
export const tapTempoBpmAtom = atom<number | null>(null);
export const maxTapsAtom = atom<number>(MAX_TAPS);
export const uiResetVersionAtom = atom<number>(0);

export const errorMessageAtom = atom<string | null>(null);

export const resetUiStateAtom = atom(null, (_get, set) => {
	set(zoomAtom, 1);
	set(scrollOffsetAtom, 0);
	set(tapMarkersAtom, []);
	set(tapTempoBpmAtom, null);
	set(uiResetVersionAtom, (version) => version + 1);
	set(errorMessageAtom, null);
});
