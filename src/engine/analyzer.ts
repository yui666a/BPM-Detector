import type { AnalysisMode, AnalysisResult } from "@/types";

export class AnalysisManager {
	private worker: Worker | null = null;
	private ready = false;
	private readyPromise: Promise<void> | null = null;

	init(): Promise<void> {
		if (this.readyPromise) return this.readyPromise;

		this.readyPromise = new Promise<void>((resolve) => {
			this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
				type: "module",
			});
			this.worker.onmessage = (event: MessageEvent) => {
				if (event.data.type === "READY") {
					this.ready = true;
					resolve();
				}
			};
			this.worker.postMessage({ type: "INIT" });
		});

		return this.readyPromise;
	}

	async analyze(
		pcmData: Float32Array,
		sampleRate: number,
		mode: AnalysisMode,
	): Promise<AnalysisResult> {
		if (!this.worker || !this.ready) {
			await this.init();
		}

		return new Promise<AnalysisResult>((resolve) => {
			const handler = (event: MessageEvent) => {
				if (event.data.type === "RESULT") {
					this.worker?.removeEventListener("message", handler);
					resolve(event.data.data as AnalysisResult);
				}
			};
			this.worker?.addEventListener("message", handler);
			this.worker?.postMessage({ type: "ANALYZE", pcmData, sampleRate, mode }, [pcmData.buffer]);
		});
	}

	terminate() {
		this.worker?.terminate();
		this.worker = null;
		this.ready = false;
		this.readyPromise = null;
	}
}
