"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { BpmDisplay } from "@/components/BpmDisplay";
import { BpmGraphContainer } from "@/components/BpmGraph";
import { FileDropZone } from "@/components/FileDropZone";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ModeSelector } from "@/components/ModeSelector";
import { PlaybackControls } from "@/components/PlaybackControls";
import { TapTempo } from "@/components/TapTempo";
import { WaveformView } from "@/components/WaveformView";
import { AnalysisManager } from "@/engine/analyzer";
import { decodeAudioFile, extractMonoData } from "@/engine/audio";
import { useT } from "@/hooks/useT";
import { detectLocale } from "@/i18n";
import {
	createWindowedAnalysisMetadata,
	offsetAnalysisResult,
	slicePcmWindow,
} from "@/lib/analysis";
import { buildWaveformPyramid } from "@/lib/waveform";
import {
	analysisModeAtom,
	isAnalyzingAtom,
	resetAnalysisResultAtom,
	setAnalysisMetadataAtom,
	setAnalysisResultAtom,
} from "@/store/analysisAtoms";
import {
	audioBufferAtom,
	currentTimeAtom,
	resetAudioStateAtom,
	setLoadedAudioAtom,
} from "@/store/audioAtoms";
import { localeAtom } from "@/store/i18nAtom";
import { errorMessageAtom, resetUiStateAtom } from "@/store/uiAtoms";
import type { AnalysisMetadata, AnalysisResult } from "@/types";

export default function Home() {
	const t = useT();
	const locale = useAtomValue(localeAtom);
	const setLocale = useSetAtom(localeAtom);
	const resetAudioState = useSetAtom(resetAudioStateAtom);
	const setLoadedAudio = useSetAtom(setLoadedAudioAtom);
	const setIsAnalyzing = useSetAtom(isAnalyzingAtom);
	const setAnalysisResult = useSetAtom(setAnalysisResultAtom);
	const setAnalysisMetadata = useSetAtom(setAnalysisMetadataAtom);
	const resetAnalysisResult = useSetAtom(resetAnalysisResultAtom);
	const resetUiState = useSetAtom(resetUiStateAtom);
	const setErrorMessage = useSetAtom(errorMessageAtom);
	const analysisMode = useAtomValue(analysisModeAtom);
	const isAnalyzing = useAtomValue(isAnalyzingAtom);
	const audioBuffer = useAtomValue(audioBufferAtom);
	const currentTime = useAtomValue(currentTimeAtom);
	const errorMessage = useAtomValue(errorMessageAtom);
	const managerRef = useRef<AnalysisManager | null>(null);
	const unsupportedFormatMessage = t.unsupportedFormat;
	const unexpectedErrorMessage = t.unexpectedError;

	useEffect(() => {
		setLocale(detectLocale());
		return () => {
			managerRef.current?.terminate();
		};
	}, [setLocale]);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const performAnalysis = useCallback(
		async (buffer: AudioBuffer, metadata: AnalysisMetadata): Promise<AnalysisResult> => {
			if (!managerRef.current) {
				managerRef.current = new AnalysisManager();
			}

			const monoData = extractMonoData(buffer);
			const pcmData =
				metadata.scope === "window"
					? slicePcmWindow(monoData, buffer.sampleRate, metadata.startTime, metadata.endTime)
					: monoData;
			const result = await managerRef.current.analyze(pcmData, buffer.sampleRate, analysisMode);
			return offsetAnalysisResult(result, metadata.startTime);
		},
		[analysisMode],
	);

	const handleFileSelect = useCallback(
		async (file: File) => {
			try {
				resetUiState();
				setIsAnalyzing(true);
				resetAudioState();
				resetAnalysisResult();

				const buffer = await decodeAudioFile(file);
				const waveformPyramid = buildWaveformPyramid(buffer);
				setLoadedAudio({ buffer, fileName: file.name, waveformPyramid });
				const metadata: AnalysisMetadata = {
					scope: "full",
					startTime: 0,
					endTime: buffer.duration,
				};
				const result = await performAnalysis(buffer, metadata);
				setErrorMessage(null);
				setAnalysisMetadata(metadata);
				setAnalysisResult(result);
			} catch (error) {
				resetAudioState();
				resetAnalysisResult();
				const message =
					error instanceof DOMException
						? unsupportedFormatMessage
						: error instanceof Error
							? error.message
							: unexpectedErrorMessage;
				setErrorMessage(message);
			} finally {
				setIsAnalyzing(false);
			}
		},
		[
			resetAnalysisResult,
			resetAudioState,
			resetUiState,
			setLoadedAudio,
			setAnalysisMetadata,
			setIsAnalyzing,
			setAnalysisResult,
			setErrorMessage,
			performAnalysis,
			unexpectedErrorMessage,
			unsupportedFormatMessage,
		],
	);

	const handleAnalyzeFromPlayhead = useCallback(
		async (windowSeconds: number) => {
			if (!audioBuffer || isAnalyzing) return;

			const metadata = createWindowedAnalysisMetadata(
				audioBuffer.duration,
				currentTime,
				windowSeconds,
			);

			try {
				setIsAnalyzing(true);
				const result = await performAnalysis(audioBuffer, metadata);
				setErrorMessage(null);
				setAnalysisMetadata(metadata);
				setAnalysisResult(result);
			} catch (error) {
				const message = error instanceof Error ? error.message : unexpectedErrorMessage;
				setErrorMessage(message);
			} finally {
				setIsAnalyzing(false);
			}
		},
		[
			audioBuffer,
			currentTime,
			isAnalyzing,
			performAnalysis,
			setAnalysisMetadata,
			setAnalysisResult,
			setErrorMessage,
			setIsAnalyzing,
			unexpectedErrorMessage,
		],
	);

	return (
		<main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
			<header className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-bold">{t.title}</h1>
					<LocaleSwitcher />
				</div>
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

			<PlaybackControls
				onAnalyzeFromPlayhead={handleAnalyzeFromPlayhead}
				isAnalyzing={isAnalyzing}
			/>

			<BpmGraphContainer />

			<TapTempo />
		</main>
	);
}
