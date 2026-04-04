import type { RefObject } from "react";
import { useEffect } from "react";
import { clamp } from "@/lib/math";

const ZOOM_MIN = 1;
const ZOOM_MAX = 100;
const SCROLL_SPEED = 0.001;

/**
 * Attaches wheel and touch pinch-to-zoom gestures to a canvas element.
 * Uses native event listeners with { passive: false } to prevent browser zoom.
 */
export function useCanvasGesture(
	canvasRef: RefObject<HTMLCanvasElement | null>,
	zoom: number,
	setZoom: (fn: (z: number) => number) => void,
	setScrollOffset: (fn: (s: number) => number) => void,
) {
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (e.ctrlKey || e.metaKey) {
				setZoom((z) => clamp(z * (e.deltaY > 0 ? 0.9 : 1.1), ZOOM_MIN, ZOOM_MAX));
			} else {
				setScrollOffset((s) => clamp(s + e.deltaX * SCROLL_SPEED, 0, 1 - 1 / zoom));
			}
		};

		let lastPinchDist = 0;

		const getTouchDist = (e: TouchEvent): number => {
			const [a, b] = [e.touches[0], e.touches[1]];
			return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
		};

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				lastPinchDist = getTouchDist(e);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				const dist = getTouchDist(e);
				if (lastPinchDist > 0) {
					const scale = dist / lastPinchDist;
					setZoom((z) => clamp(z * scale, ZOOM_MIN, ZOOM_MAX));
				}
				lastPinchDist = dist;
			}
		};

		const handleTouchEnd = () => {
			lastPinchDist = 0;
		};

		canvas.addEventListener("wheel", handleWheel, { passive: false });
		canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
		canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
		canvas.addEventListener("touchend", handleTouchEnd);

		return () => {
			canvas.removeEventListener("wheel", handleWheel);
			canvas.removeEventListener("touchstart", handleTouchStart);
			canvas.removeEventListener("touchmove", handleTouchMove);
			canvas.removeEventListener("touchend", handleTouchEnd);
		};
	}, [canvasRef, zoom, setZoom, setScrollOffset]);
}
