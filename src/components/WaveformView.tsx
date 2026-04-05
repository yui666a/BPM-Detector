"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useCanvasGesture } from "@/hooks/useCanvasGesture";
import { drawBeatMarkers, drawPlayhead, drawTapMarkers, drawWaveform } from "@/lib/waveform";
import { beatsAtom } from "@/store/analysisAtoms";
import { currentTimeAtom, durationAtom, waveformPyramidAtom } from "@/store/audioAtoms";
import { scrollOffsetAtom, tapMarkersAtom, zoomAtom } from "@/store/uiAtoms";

const CANVAS_HEIGHT = 200;

export function WaveformView() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const waveformPyramid = useAtomValue(waveformPyramidAtom);
	const duration = useAtomValue(durationAtom);
	const currentTime = useAtomValue(currentTimeAtom);
	const beats = useAtomValue(beatsAtom);
	const tapMarkers = useAtomValue(tapMarkersAtom);
	const [zoom, setZoom] = useAtom(zoomAtom);
	const [scrollOffset, setScrollOffset] = useAtom(scrollOffsetAtom);

	// --- Drawing ---
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !waveformPyramid) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;

		ctx.clearRect(0, 0, width, height);
		drawWaveform(ctx, waveformPyramid, width, height, zoom, scrollOffset);
		drawBeatMarkers(ctx, beats, duration, width, height, zoom, scrollOffset);
		drawTapMarkers(ctx, tapMarkers, duration, width, height, zoom, scrollOffset);
		drawPlayhead(ctx, currentTime, duration, width, height, zoom, scrollOffset);
	}, [beats, currentTime, duration, scrollOffset, tapMarkers, waveformPyramid, zoom]);

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

	return (
		<div ref={containerRef} className={`w-full ${waveformPyramid ? "" : "hidden"}`}>
			<canvas ref={canvasRef} height={CANVAS_HEIGHT} className="w-full rounded-lg bg-gray-900" />
		</div>
	);
}
