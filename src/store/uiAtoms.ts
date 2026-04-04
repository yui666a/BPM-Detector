import { atom } from "jotai";
import type { Beat } from "@/types";

export const zoomAtom = atom<number>(1);
export const scrollOffsetAtom = atom<number>(0);

interface UndoEntry {
	beats: Beat[];
}

export const undoStackAtom = atom<UndoEntry[]>([]);

export const errorMessageAtom = atom<string | null>(null);

export const resetUiStateAtom = atom(null, (_get, set) => {
	set(zoomAtom, 1);
	set(scrollOffsetAtom, 0);
	set(undoStackAtom, []);
	set(errorMessageAtom, null);
});
