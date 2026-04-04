import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useBeatEditor } from "@/hooks/useBeatEditor";
import type { Beat } from "@/types";

function createCanvasRef() {
	const canvas = {
		width: 1000,
		getBoundingClientRect: () =>
			({
				left: 0,
				top: 0,
				width: 1000,
				height: 200,
				right: 1000,
				bottom: 200,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) satisfies DOMRect,
	} as unknown as HTMLCanvasElement;
	const canvasRef = createRef<HTMLCanvasElement>();
	canvasRef.current = canvas;
	return canvasRef;
}

describe("useBeatEditor", () => {
	it("stores a pre-drag snapshot for undo", () => {
		const pushUndo = vi.fn();
		let beats: Beat[] = [
			{ time: 1, confidence: 1, manual: false },
			{ time: 2, confidence: 1, manual: false },
		];
		const setBeats = vi.fn((updater: (prev: Beat[]) => Beat[]) => {
			beats = updater(beats);
		});
		const canvasRef = createCanvasRef();

		const { result, rerender } = renderHook(
			({ currentBeats }) =>
				useBeatEditor({
					canvasRef,
					beats: currentBeats,
					setBeats,
					pushUndo,
					duration: 10,
					zoom: 1,
					scrollOffset: 0,
				}),
			{ initialProps: { currentBeats: beats } },
		);

		act(() => {
			result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
			result.current.handleMouseMove({ clientX: 150 } as React.MouseEvent);
		});
		rerender({ currentBeats: beats });
		act(() => {
			result.current.handleMouseUp();
		});

		expect(setBeats).toHaveBeenCalledTimes(1);
		expect(beats[0]?.time).toBeCloseTo(1.5);
		expect(pushUndo).toHaveBeenCalledWith([
			{ time: 1, confidence: 1, manual: false },
			{ time: 2, confidence: 1, manual: false },
		]);
	});
});
