import { atom } from "jotai";
import type { AnalysisMode, AnalysisResult, Beat, BpmPoint } from "@/types";

export const analysisModeAtom = atom<AnalysisMode>("music");
export const isAnalyzingAtom = atom<boolean>(false);
export const bpmAtom = atom<number>(0);
export const confidenceAtom = atom<number>(0);
export const beatsAtom = atom<Beat[]>([]);
export const bpmCurveAtom = atom<BpmPoint[]>([]);

export const setAnalysisResultAtom = atom(null, (_get, set, result: AnalysisResult) => {
	set(bpmAtom, result.bpm);
	set(confidenceAtom, result.confidence);
	set(beatsAtom, result.beats);
	set(bpmCurveAtom, result.bpmCurve);
});
