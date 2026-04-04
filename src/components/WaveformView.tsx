"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { extractMonoData } from "@/engine/audio";
import { useBeatEditor } from "@/hooks/useBeatEditor";
import { useCanvasGesture } from "@/hooks/useCanvasGesture";
import { drawBeatMarkers, drawPlayhead, drawWaveform } from "@/lib/waveform";
import { beatsAtom } from "@/store/analysisAtoms";
import { audioBufferAtom, currentTimeAtom, durationAtom } from "@/store/audioAtoms";
import { scrollOffsetAtom, undoStackAtom, zoomAtom } from "@/store/uiAtoms";

const CANVAS_HEIGHT = 200;

export function WaveformView() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const audioBuffer = useAtomValue(audioBufferAtom);
	const duration = useAtomValue(durationAtom);
	const currentTime = useAtomValue(currentTimeAtom);
	const [beats, setBeats] = useAtom(beatsAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);
	const [scrollOffset, setScrollOffset] = useAtom(scrollOffsetAtom);
	const setUndoStack = useSetAtom(undoStackAtom);
	const monoDataRef = useRef<Float32Array | null>(null);

	useEffect(() => {
		if (audioBuffer) {
			monoDataRef.current = extractMonoData(audioBuffer);
		} else {
			monoDataRef.current = null;
		}
	}, [audioBuffer]);

	const pushUndo = useCallback(
		(snapshot: typeof beats) => {
			setUndoStack((stack) => [...stack, { beats: snapshot }]);
		},
		[setUndoStack],
	);

	// --- Drawing ---
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !monoDataRef.current) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);
		drawWaveform(ctx, monoDataRef.current, width, height, zoom, scrollOffset);
		drawBeatMarkers(ctx, beats, duration, width, height, zoom, scrollOffset);
		drawPlayhead(ctx, currentTime, duration, width, height, zoom, scrollOffset);
	}, [beats, currentTime, duration, zoom, scrollOffset]);

	useEffect(() => {
		const rafId = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(rafId);
	}, [draw]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			const canvas = canvasRef.current;
			if (!canvas || !entries[0]) return;
			canvas.width = entries[0].contentRect.width;
			canvas.height = CANVAS_HEIGHT;
			draw();
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [draw]);

	// --- Gestures (wheel zoom, pinch zoom, pan) ---
	useCanvasGesture(canvasRef, zoom, setZoom, setScrollOffset);

	// --- Beat editing (drag, add, delete) ---
	const { handleMouseDown, handleMouseMove, handleMouseUp, handleDoubleClick, handleContextMenu } =
		useBeatEditor({ canvasRef, beats, setBeats, pushUndo, duration, zoom, scrollOffset });

	return (
		<div ref={containerRef} className={`w-full ${audioBuffer ? "" : "hidden"}`}>
			<canvas
				ref={canvasRef}
				height={CANVAS_HEIGHT}
				className="w-full cursor-crosshair rounded-lg bg-gray-900"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onDoubleClick={handleDoubleClick}
				onContextMenu={handleContextMenu}
			/>
		</div>
	);
}
