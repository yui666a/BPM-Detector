"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { extractMonoData } from "@/engine/audio";
import { drawBeatMarkers, drawPlayhead, drawWaveform, xToTime } from "@/lib/waveform";
import { beatsAtom } from "@/store/analysisAtoms";
import { audioBufferAtom, currentTimeAtom, durationAtom } from "@/store/audioAtoms";
import { scrollOffsetAtom, undoStackAtom, zoomAtom } from "@/store/uiAtoms";
import type { Beat } from "@/types";

const CANVAS_HEIGHT = 200;
const MARKER_HIT_RADIUS = 8;

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
	const draggingRef = useRef<{ index: number; startX: number } | null>(null);

	useEffect(() => {
		if (audioBuffer) {
			monoDataRef.current = extractMonoData(audioBuffer);
		}
	}, [audioBuffer]);

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

	const pushUndo = useCallback(() => {
		setUndoStack((stack) => [...stack, { beats: [...beats] }]);
	}, [beats, setUndoStack]);

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
		[beats, duration, zoom, scrollOffset],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const rect = canvasRef.current?.getBoundingClientRect();
			if (!rect) return;
			const x = e.clientX - rect.left;
			const index = findBeatAtX(x);
			if (index >= 0) {
				draggingRef.current = { index, startX: x };
			}
		},
		[findBeatAtX],
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
		[duration, zoom, scrollOffset, setBeats],
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
		[duration, zoom, scrollOffset, pushUndo, setBeats],
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
		[findBeatAtX, pushUndo, setBeats],
	);

	// Use native event listener with { passive: false } so preventDefault() works
	// React's onWheel is passive by default and cannot prevent browser zoom
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (e.ctrlKey || e.metaKey) {
				setZoom((z) => Math.max(1, Math.min(z * (e.deltaY > 0 ? 0.9 : 1.1), 100)));
			} else {
				setScrollOffset((s) => Math.max(0, Math.min(s + e.deltaX * 0.001, 1 - 1 / zoom)));
			}
		};

		canvas.addEventListener("wheel", handleWheel, { passive: false });
		return () => canvas.removeEventListener("wheel", handleWheel);
	}, [zoom, setZoom, setScrollOffset]);

	if (!audioBuffer) return null;

	return (
		<div ref={containerRef} className="w-full">
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
