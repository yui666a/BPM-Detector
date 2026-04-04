"use client";

import { useAtomValue } from "jotai";
import {
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { bpmAtom, bpmCurveAtom } from "@/store/analysisAtoms";

function formatTick(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BpmGraph() {
	const bpmCurve = useAtomValue(bpmCurveAtom);
	const bpm = useAtomValue(bpmAtom);

	if (bpmCurve.length === 0) return null;

	return (
		<div className="h-48 w-full rounded-lg bg-gray-900 p-4">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={bpmCurve}>
					<XAxis dataKey="time" tickFormatter={formatTick} stroke="#6b7280" fontSize={12} />
					<YAxis domain={["auto", "auto"]} stroke="#6b7280" fontSize={12} width={40} />
					<Tooltip
						formatter={(value: number) => [`${value.toFixed(1)} BPM`, "BPM"]}
						labelFormatter={(label: number) => formatTick(label)}
						contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8 }}
					/>
					<ReferenceLine y={bpm} stroke="#6366f1" strokeDasharray="3 3" />
					<Line type="monotone" dataKey="bpm" stroke="#818cf8" dot={false} strokeWidth={2} />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
