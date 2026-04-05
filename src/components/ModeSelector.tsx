"use client";

import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { useT } from "@/hooks/useT";
import { analysisModeAtom } from "@/store/analysisAtoms";
import type { AnalysisMode } from "@/types";

interface ModeEntry {
	value: AnalysisMode;
	label: string;
	description: string;
	disabled?: boolean;
}

export function ModeSelector() {
	const t = useT();
	const [mode, setMode] = useAtom(analysisModeAtom);
	const [hoveredMode, setHoveredMode] = useState<AnalysisMode | null>(null);

	const modes: ModeEntry[] = useMemo(
		() => [
			{ value: "music", label: t.modeMusic, description: t.modeMusicDesc },
			{ value: "se", label: t.modeSE, description: t.modeSEDesc, disabled: true },
		],
		[t],
	);

	const fallbackMode = modes[0];
	const activeMode = modes.find((m) => m.value === mode) ?? fallbackMode;
	const hoveredDescription = hoveredMode
		? (modes.find((m) => m.value === hoveredMode)?.description ?? fallbackMode.description)
		: null;
	const displayDescription = hoveredMode ? hoveredDescription : activeMode.description;

	return (
		<div className="flex flex-col items-end gap-1">
			<div className="flex gap-1 rounded-lg bg-gray-800 p-1">
				{modes.map((m) => (
					<button
						key={m.value}
						type="button"
						onClick={() => {
							if (!m.disabled) {
								setMode(m.value);
							}
						}}
						onMouseEnter={() => setHoveredMode(m.value)}
						onMouseLeave={() => setHoveredMode(null)}
						disabled={m.disabled}
						aria-disabled={m.disabled}
						className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
							m.disabled
								? "cursor-not-allowed text-gray-600 opacity-50"
								: mode === m.value
									? "bg-indigo-600 text-white"
									: "text-gray-400 hover:text-gray-200"
						}`}
					>
						{m.label}
					</button>
				))}
			</div>
			<p className="hidden text-xs text-gray-500 sm:block">
				{hoveredMode ? displayDescription : "\u00A0"}
			</p>
			<p className="text-xs text-gray-500 sm:hidden">{activeMode.description}</p>
		</div>
	);
}
