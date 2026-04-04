"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { analysisModeAtom } from "@/store/analysisAtoms";
import type { AnalysisMode } from "@/types";

const modes: { value: AnalysisMode; label: string; description: string }[] = [
	{
		value: "music",
		label: "Music",
		description: "ドラム/ベースなどビートがある音楽向け（RhythmExtractor2013）",
	},
	{
		value: "se",
		label: "SE / SFX",
		description: "パルス的な音のタイミングからパターンの周期性を推定（エネルギーベース）",
	},
];

export function ModeSelector() {
	const [mode, setMode] = useAtom(analysisModeAtom);
	const [hoveredMode, setHoveredMode] = useState<AnalysisMode | null>(null);
	const activeMode = modes.find((m) => m.value === mode)!;
	const displayDescription = hoveredMode
		? modes.find((m) => m.value === hoveredMode)!.description
		: activeMode.description;

	return (
		<div className="flex flex-col items-end gap-1">
			<div className="flex gap-1 rounded-lg bg-gray-800 p-1">
				{modes.map((m) => (
					<button
						key={m.value}
						type="button"
						onClick={() => setMode(m.value)}
						onMouseEnter={() => setHoveredMode(m.value)}
						onMouseLeave={() => setHoveredMode(null)}
						className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
							mode === m.value
								? "bg-indigo-600 text-white"
								: "text-gray-400 hover:text-gray-200"
						}`}
					>
						{m.label}
					</button>
				))}
			</div>
			<p className="hidden text-xs text-gray-500 sm:block">{hoveredMode ? displayDescription : "\u00A0"}</p>
			<p className="text-xs text-gray-500 sm:hidden">{activeMode.description}</p>
		</div>
	);
}
