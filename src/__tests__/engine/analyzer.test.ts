import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisManager } from "@/engine/analyzer";
import type { AnalysisResult } from "@/types";

class MockWorker {
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	terminated = false;
	messages: Array<{ type: string }> = [];
	private listeners = {
		message: new Set<(event: MessageEvent) => void>(),
		error: new Set<(event: ErrorEvent) => void>(),
	};

	postMessage(message: { type: string }) {
		this.messages.push(message);
		if (message.type === "INIT") {
			this.onmessage?.({ data: { type: "READY" } } as MessageEvent);
		}
	}

	addEventListener(type: "message" | "error", listener: (event: never) => void) {
		this.listeners[type].add(listener as never);
	}

	removeEventListener(type: "message" | "error", listener: (event: never) => void) {
		this.listeners[type].delete(listener as never);
	}

	emitMessage(data: unknown) {
		for (const listener of this.listeners.message) {
			listener({ data } as MessageEvent);
		}
	}

	emitError(message: string) {
		for (const listener of this.listeners.error) {
			listener({ message } as ErrorEvent);
		}
	}

	terminate() {
		this.terminated = true;
	}
}

describe("AnalysisManager", () => {
	const originalWorker = globalThis.Worker;
	let worker: MockWorker;

	beforeEach(() => {
		worker = new MockWorker();
		globalThis.Worker = vi.fn(() => worker) as unknown as typeof Worker;
	});

	afterEach(() => {
		globalThis.Worker = originalWorker;
	});

	it("resolves analysis results and removes transient listeners", async () => {
		const manager = new AnalysisManager();
		const resultPromise = manager.analyze(new Float32Array([0, 1]), 44100, "music");
		const expected: AnalysisResult = {
			bpm: 120,
			confidence: 0.9,
			beats: [{ time: 0.5, confidence: 0.9, manual: false }],
			bpmCurve: [{ time: 0.5, bpm: 120 }],
		};

		await Promise.resolve();
		worker.emitMessage({ type: "RESULT", data: expected });

		await expect(resultPromise).resolves.toEqual(expected);
		expect(worker.messages.map((message) => message.type)).toEqual(["INIT", "ANALYZE"]);
	});

	it("terminates the worker", async () => {
		const manager = new AnalysisManager();

		await manager.init();
		manager.terminate();

		expect(worker.terminated).toBe(true);
	});
});
