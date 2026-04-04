import type { AnalysisMode, AnalysisResult } from "@/types";

export class AnalysisManager {
	private worker: Worker | null = null;
	private ready = false;
	private readyPromise: Promise<void> | null = null;

	init(): Promise<void> {
		if (this.readyPromise) return this.readyPromise;

		this.readyPromise = new Promise<void>((resolve, reject) => {
			this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
				type: "module",
			});
			this.worker.onmessage = (event: MessageEvent) => {
				if (event.data.type === "READY") {
					this.ready = true;
					resolve();
				}
			};
			this.worker.onerror = (event: ErrorEvent) => {
				reject(new Error(`Worker initialization failed: ${event.message}`));
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

		return new Promise<AnalysisResult>((resolve, reject) => {
			const handler = (event: MessageEvent) => {
				if (event.data.type === "RESULT") {
					this.worker?.removeEventListener("message", handler);
					resolve(event.data.data as AnalysisResult);
				} else if (event.data.type === "ERROR") {
					this.worker?.removeEventListener("message", handler);
					reject(new Error(event.data.message ?? "Analysis failed"));
				}
			};
			const errorHandler = (event: ErrorEvent) => {
				this.worker?.removeEventListener("message", handler);
				reject(new Error(`Worker error: ${event.message}`));
			};
			this.worker?.addEventListener("message", handler);
			this.worker?.addEventListener("error", errorHandler, { once: true });
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
