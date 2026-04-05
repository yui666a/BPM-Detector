"use client";

import { useAtom, useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import {
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useCanvasGesture } from "@/hooks/useCanvasGesture";
import { formatTime } from "@/lib/format";
import { bpmAtom, bpmCurveAtom } from "@/store/analysisAtoms";
import { currentTimeAtom, durationAtom } from "@/store/audioAtoms";
import { scrollOffsetAtom, zoomAtom } from "@/store/uiAtoms";

export function BpmGraph() {
	const bpmCurve = useAtomValue(bpmCurveAtom);
	const bpm = useAtomValue(bpmAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);
	const [scrollOffset, setScrollOffset] = useAtom(scrollOffsetAtom);
	const duration = useAtomValue(durationAtom);
	const currentTime = useAtomValue(currentTimeAtom);
	const containerRef = useRef<HTMLDivElement>(null);

	useCanvasGesture(containerRef, zoom, setZoom, setScrollOffset);

	const { visibleCurve, xDomain } = useMemo(() => {
		if (bpmCurve.length === 0 || duration === 0) {
			return { visibleCurve: [], xDomain: [0, 0] as [number, number] };
		}
		const visibleDuration = duration / zoom;
		const startTime = scrollOffset * duration;
		const endTime = startTime + visibleDuration;

		const filtered = bpmCurve.filter((p) => p.time >= startTime && p.time <= endTime);
		return { visibleCurve: filtered, xDomain: [startTime, endTime] as [number, number] };
	}, [bpmCurve, zoom, scrollOffset, duration]);

	const showPlayhead = currentTime > 0 && currentTime >= xDomain[0] && currentTime <= xDomain[1];

	if (bpmCurve.length === 0) return null;

	return (
		<div ref={containerRef} className="h-40 w-full rounded-lg bg-gray-900 py-2">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={visibleCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
					<XAxis
						dataKey="time"
						type="number"
						domain={xDomain}
						tickFormatter={formatTime}
						stroke="#6b7280"
						fontSize={12}
						hide
					/>
					<YAxis domain={["auto", "auto"]} hide />
					<Tooltip
						formatter={(value: number) => [`${value.toFixed(1)} BPM`, "BPM"]}
						labelFormatter={(label: number) => formatTime(label)}
						contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8 }}
					/>
					<ReferenceLine y={bpm} stroke="#6366f1" strokeDasharray="3 3" />
					{showPlayhead && <ReferenceLine x={currentTime} stroke="#ffffff" strokeWidth={2} />}
					<Line
						type="monotone"
						dataKey="bpm"
						stroke="#818cf8"
						dot={false}
						strokeWidth={2}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
