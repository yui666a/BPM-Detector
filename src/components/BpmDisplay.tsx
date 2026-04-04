"use client";

import { useAtomValue } from "jotai";
import { bpmAtom, confidenceAtom, isAnalyzingAtom } from "@/store/analysisAtoms";

export function BpmDisplay() {
	const bpm = useAtomValue(bpmAtom);
	const confidence = useAtomValue(confidenceAtom);
	const isAnalyzing = useAtomValue(isAnalyzingAtom);

	if (isAnalyzing) {
		return (
			<div className="flex items-center gap-3 py-4">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
				<span className="text-lg text-gray-400">Analyzing...</span>
			</div>
		);
	}

	if (bpm === 0) return null;

	return (
		<div className="flex items-center gap-4 py-4">
			<div className="flex items-baseline gap-2">
				<span className="text-5xl font-bold tabular-nums">{bpm.toFixed(1)}</span>
				<span className="text-xl text-gray-400">BPM</span>
			</div>
			<span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
				Confidence: {Math.round(confidence * 100)}%
			</span>
		</div>
	);
}
