"use client";

import { useAtomValue } from "jotai";
import { getConfidenceLabel } from "@/lib/analysis";
import { formatTime } from "@/lib/format";
import {
	analysisMetadataValueAtom,
	bpmAtom,
	confidenceAtom,
	isAnalyzingAtom,
} from "@/store/analysisAtoms";
export function BpmDisplay() {
	const bpm = useAtomValue(bpmAtom);
	const confidence = useAtomValue(confidenceAtom);
	const isAnalyzing = useAtomValue(isAnalyzingAtom);
	const analysisMetadata = useAtomValue(analysisMetadataValueAtom);

	const confidenceLabel = getConfidenceLabel(confidence);
	const autoBpmLabel = confidenceLabel === "low" ? "Estimated BPM" : "Auto BPM";
	const scopeLabel =
		analysisMetadata.scope === "window"
			? `${formatTime(analysisMetadata.startTime)} - ${formatTime(analysisMetadata.endTime)}`
			: "Full Track";

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
		<div className="py-4">
			<div className="rounded-xl border border-gray-800 bg-gray-950/60 p-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
							{autoBpmLabel}
						</p>
						<div className="mt-2 flex items-baseline gap-2">
							<span className="text-5xl font-bold tabular-nums">
								{bpm === 0 ? "--" : bpm.toFixed(1)}
							</span>
							<span className="text-xl text-gray-400">BPM</span>
						</div>
					</div>
					<span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
						Confidence: {Math.round(confidence * 100)}%
					</span>
				</div>
				<div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-400">
					<span className="rounded-full bg-gray-900 px-3 py-1">{scopeLabel}</span>
					<span className="rounded-full bg-gray-900 px-3 py-1 capitalize">
						{confidenceLabel} confidence
					</span>
				</div>
			</div>
		</div>
	);
}
