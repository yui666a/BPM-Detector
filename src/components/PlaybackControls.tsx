"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPlayback } from "@/engine/audio";
import { useT } from "@/hooks/useT";
import { DEFAULT_ANALYSIS_WINDOW_SECONDS } from "@/lib/analysis";
import { formatTime } from "@/lib/format";
import {
	audioBufferAtom,
	currentTimeAtom,
	durationAtom,
	playbackStateAtom,
} from "@/store/audioAtoms";

interface PlaybackControlsProps {
	onAnalyzeFromPlayhead?: (windowSeconds: number) => void;
	isAnalyzing?: boolean;
}

export function PlaybackControls({
	onAnalyzeFromPlayhead,
	isAnalyzing = false,
}: PlaybackControlsProps) {
	const audioBuffer = useAtomValue(audioBufferAtom);
	const duration = useAtomValue(durationAtom);
	const [playbackState, setPlaybackState] = useAtom(playbackStateAtom);
	const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
	const playbackRef = useRef<ReturnType<typeof createPlayback> | null>(null);

	useEffect(() => {
		if (!audioBuffer) return;
		playbackRef.current = createPlayback(
			audioBuffer,
			(time) => setCurrentTime(time),
			() => setPlaybackState("idle"),
		);
		return () => {
			playbackRef.current?.stop();
		};
	}, [audioBuffer, setCurrentTime, setPlaybackState]);

	const handlePlay = useCallback(() => {
		if (!playbackRef.current) return;
		void playbackRef.current.play(currentTime);
		setPlaybackState("playing");
	}, [currentTime, setPlaybackState]);

	const handleStop = useCallback(() => {
		if (!playbackRef.current) return;
		playbackRef.current.stop();
		setPlaybackState("paused");
	}, [setPlaybackState]);

	const handleSeek = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const time = Number.parseFloat(e.target.value);
			setCurrentTime(time);
			playbackRef.current?.seek(time);
			if (playbackState === "playing") {
				void playbackRef.current?.play(time);
			}
		},
		[playbackState, setCurrentTime],
	);

	const t = useT();
	const [windowSeconds, setWindowSeconds] = useState(DEFAULT_ANALYSIS_WINDOW_SECONDS);

	if (!audioBuffer) return null;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-4">
				{playbackState === "playing" ? (
					<button
						type="button"
						onClick={handleStop}
						className="shrink-0 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
					>
						&#9632; {t.stop}
					</button>
				) : (
					<button
						type="button"
						onClick={handlePlay}
						className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
					>
						&#9654; {t.play}
					</button>
				)}

				<input
					type="range"
					min={0}
					max={duration}
					step={0.01}
					value={currentTime}
					onChange={handleSeek}
					className="flex-1"
				/>

				<span className="min-w-[5rem] shrink-0 text-right text-sm tabular-nums text-gray-400">
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>
			</div>

			<div className="flex items-center gap-2 text-sm text-gray-400">
				<span>{t.analyzePrefix}</span>
				<input
					type="number"
					min={5}
					max={120}
					step={5}
					value={windowSeconds}
					onChange={(e) => setWindowSeconds(Math.max(5, Number(e.target.value)))}
					className="w-16 rounded-lg border border-gray-700 bg-gray-900 px-2 py-2 text-center text-sm tabular-nums text-gray-200"
				/>
				<span>{t.analyzeSuffix}</span>
				<button
					type="button"
					onClick={() => onAnalyzeFromPlayhead?.(windowSeconds)}
					disabled={isAnalyzing}
					className="shrink-0 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-emerald-600 disabled:opacity-50"
				>
					{t.analyzeButton}
				</button>
			</div>
		</div>
	);
}
