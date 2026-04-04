import { atom } from "jotai";
import type { Beat } from "@/types";

export const zoomAtom = atom<number>(1);
export const scrollOffsetAtom = atom<number>(0);

interface UndoEntry {
	beats: Beat[];
}

export const undoStackAtom = atom<UndoEntry[]>([]);
