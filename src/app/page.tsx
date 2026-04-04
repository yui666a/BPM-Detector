"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { BpmDisplay } from "@/components/BpmDisplay";
import { BpmGraph } from "@/components/BpmGraph";
import { FileDropZone } from "@/components/FileDropZone";
import { ModeSelector } from "@/components/ModeSelector";
import { PlaybackControls } from "@/components/PlaybackControls";
import { WaveformView } from "@/components/WaveformView";
import { AnalysisManager } from "@/engine/analyzer";
import { decodeAudioFile, extractMonoData } from "@/engine/audio";
import { analysisModeAtom, isAnalyzingAtom, setAnalysisResultAtom } from "@/store/analysisAtoms";
import {
	audioBufferAtom,
	currentTimeAtom,
	durationAtom,
	fileNameAtom,
	playbackStateAtom,
} from "@/store/audioAtoms";
import { scrollOffsetAtom, undoStackAtom, zoomAtom } from "@/store/uiAtoms";

export default function Home() {
	const setAudioBuffer = useSetAtom(audioBufferAtom);
	const setFileName = useSetAtom(fileNameAtom);
	const setDuration = useSetAtom(durationAtom);
	const setCurrentTime = useSetAtom(currentTimeAtom);
	const setPlaybackState = useSetAtom(playbackStateAtom);
	const setIsAnalyzing = useSetAtom(isAnalyzingAtom);
	const setAnalysisResult = useSetAtom(setAnalysisResultAtom);
	const setZoom = useSetAtom(zoomAtom);
	const setScrollOffset = useSetAtom(scrollOffsetAtom);
	const setUndoStack = useSetAtom(undoStackAtom);
	const analysisMode = useAtomValue(analysisModeAtom);
	const isAnalyzing = useAtomValue(isAnalyzingAtom);
	const managerRef = useRef<AnalysisManager | null>(null);

	const handleFileSelect = useCallback(
		async (file: File) => {
			try {
				setIsAnalyzing(true);
				setZoom(1);
				setScrollOffset(0);
				setCurrentTime(0);
				setPlaybackState("idle");
				setUndoStack([]);

				const buffer = await decodeAudioFile(file);
				setAudioBuffer(buffer);
				setFileName(file.name);
				setDuration(buffer.duration);

				if (!managerRef.current) {
					managerRef.current = new AnalysisManager();
				}

				const monoData = extractMonoData(buffer);
				const result = await managerRef.current.analyze(monoData, buffer.sampleRate, analysisMode);
				setAnalysisResult(result);
			} catch (error) {
				console.error("Analysis failed:", error);
			} finally {
				setIsAnalyzing(false);
			}
		},
		[
			analysisMode,
			setAudioBuffer,
			setFileName,
			setDuration,
			setCurrentTime,
			setPlaybackState,
			setIsAnalyzing,
			setAnalysisResult,
			setZoom,
			setScrollOffset,
			setUndoStack,
		],
	);

	return (
		<main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">BPM Detector</h1>
				<ModeSelector />
			</header>

			<FileDropZone onFileSelect={handleFileSelect} disabled={isAnalyzing} />

			<BpmDisplay />

			<WaveformView />

			<PlaybackControls />

			<BpmGraph />
		</main>
	);
}
