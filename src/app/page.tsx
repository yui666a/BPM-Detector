"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { BpmDisplay } from "@/components/BpmDisplay";
import { BpmGraph } from "@/components/BpmGraph";
import { FileDropZone } from "@/components/FileDropZone";
import { ModeSelector } from "@/components/ModeSelector";
import { PlaybackControls } from "@/components/PlaybackControls";
import { WaveformView } from "@/components/WaveformView";
import { AnalysisManager } from "@/engine/analyzer";
import { decodeAudioFile, extractMonoData } from "@/engine/audio";
import {
	analysisModeAtom,
	isAnalyzingAtom,
	resetAnalysisResultAtom,
	setAnalysisResultAtom,
} from "@/store/analysisAtoms";
import { resetAudioStateAtom, setLoadedAudioAtom } from "@/store/audioAtoms";
import { errorMessageAtom, resetUiStateAtom } from "@/store/uiAtoms";

export default function Home() {
	const resetAudioState = useSetAtom(resetAudioStateAtom);
	const setLoadedAudio = useSetAtom(setLoadedAudioAtom);
	const setIsAnalyzing = useSetAtom(isAnalyzingAtom);
	const setAnalysisResult = useSetAtom(setAnalysisResultAtom);
	const resetAnalysisResult = useSetAtom(resetAnalysisResultAtom);
	const resetUiState = useSetAtom(resetUiStateAtom);
	const setErrorMessage = useSetAtom(errorMessageAtom);
	const analysisMode = useAtomValue(analysisModeAtom);
	const isAnalyzing = useAtomValue(isAnalyzingAtom);
	const errorMessage = useAtomValue(errorMessageAtom);
	const managerRef = useRef<AnalysisManager | null>(null);

	useEffect(() => {
		return () => {
			managerRef.current?.terminate();
		};
	}, []);

	const handleFileSelect = useCallback(
		async (file: File) => {
			try {
				resetUiState();
				setIsAnalyzing(true);
				resetAudioState();
				resetAnalysisResult();

				const buffer = await decodeAudioFile(file);
				setLoadedAudio({ buffer, fileName: file.name });

				if (!managerRef.current) {
					managerRef.current = new AnalysisManager();
				}

				const monoData = extractMonoData(buffer);
				const result = await managerRef.current.analyze(monoData, buffer.sampleRate, analysisMode);
				setErrorMessage(null);
				setAnalysisResult(result);
			} catch (error) {
				resetAudioState();
				resetAnalysisResult();
				const message =
					error instanceof DOMException
						? "This file format is not supported"
						: error instanceof Error
							? error.message
							: "An unexpected error occurred";
				setErrorMessage(message);
			} finally {
				setIsAnalyzing(false);
			}
		},
		[
			analysisMode,
			resetAnalysisResult,
			resetAudioState,
			resetUiState,
			setLoadedAudio,
			setIsAnalyzing,
			setAnalysisResult,
			setErrorMessage,
		],
	);

	return (
		<main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">BPM Detector</h1>
				<ModeSelector />
			</header>

			<FileDropZone onFileSelect={handleFileSelect} disabled={isAnalyzing} />

			{errorMessage && (
				<div className="rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-300">
					{errorMessage}
				</div>
			)}

			<BpmDisplay />

			<WaveformView />

			<PlaybackControls />

			<BpmGraph />
		</main>
	);
}
