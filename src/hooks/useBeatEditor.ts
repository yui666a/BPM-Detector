import type { RefObject } from "react";
import { useCallback, useRef } from "react";
import { xToTime } from "@/lib/waveform";
import type { Beat } from "@/types";

const MARKER_HIT_RADIUS = 8;

interface UseBeatEditorOptions {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	beats: Beat[];
	setBeats: (fn: (prev: Beat[]) => Beat[]) => void;
	pushUndo: () => void;
	duration: number;
	zoom: number;
	scrollOffset: number;
}

export function useBeatEditor({
	canvasRef,
	beats,
	setBeats,
	pushUndo,
	duration,
	zoom,
	scrollOffset,
}: UseBeatEditorOptions) {
	const draggingRef = useRef<{ index: number } | null>(null);

	const findBeatAtX = useCallback(
		(x: number): number => {
			const canvas = canvasRef.current;
			if (!canvas) return -1;
			const time = xToTime(x, duration, canvas.width, zoom, scrollOffset);
			const pixelPerSec = canvas.width / (duration / zoom);

			for (let i = 0; i < beats.length; i++) {
				const dist = Math.abs(beats[i].time - time) * pixelPerSec;
				if (dist < MARKER_HIT_RADIUS) return i;
			}
			return -1;
		},
		[canvasRef, beats, duration, zoom, scrollOffset],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			const x = e.clientX - rect.left;
			const index = findBeatAtX(x);
			if (index >= 0) {
				draggingRef.current = { index };
			}
		},
		[canvasRef, findBeatAtX],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!draggingRef.current || !canvasRef.current) return;
			const rect = canvasRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const newTime = xToTime(x, duration, canvasRef.current.width, zoom, scrollOffset);
			const { index } = draggingRef.current;

			setBeats((prev) => {
				const next = [...prev];
				next[index] = { ...next[index], time: Math.max(0, Math.min(newTime, duration)) };
				return next;
			});
		},
		[canvasRef, duration, zoom, scrollOffset, setBeats],
	);

	const handleMouseUp = useCallback(() => {
		if (draggingRef.current) {
			pushUndo();
			draggingRef.current = null;
		}
	}, [pushUndo]);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const time = xToTime(x, duration, canvas.width, zoom, scrollOffset);

			pushUndo();
			const newBeat: Beat = { time, confidence: 1, manual: true };
			setBeats((prev) => [...prev, newBeat].sort((a, b) => a.time - b.time));
		},
		[canvasRef, duration, zoom, scrollOffset, pushUndo, setBeats],
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			const x = e.clientX - rect.left;
			const index = findBeatAtX(x);
			if (index >= 0) {
				pushUndo();
				setBeats((prev) => prev.filter((_, i) => i !== index));
			}
		},
		[canvasRef, findBeatAtX, pushUndo, setBeats],
	);

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleDoubleClick,
		handleContextMenu,
	};
}
