"use client";

import { useAtom } from "jotai";
import { analysisModeAtom } from "@/store/analysisAtoms";
import type { AnalysisMode } from "@/types";

const modes: { value: AnalysisMode; label: string }[] = [
	{ value: "music", label: "Music" },
	{ value: "se", label: "SE / SFX" },
];

export function ModeSelector() {
	const [mode, setMode] = useAtom(analysisModeAtom);

	return (
		<div className="flex gap-1 rounded-lg bg-gray-800 p-1">
			{modes.map((m) => (
				<button
					key={m.value}
					type="button"
					onClick={() => setMode(m.value)}
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
	);
}
