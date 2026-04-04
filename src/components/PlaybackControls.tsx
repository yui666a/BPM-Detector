"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { createPlayback } from "@/engine/audio";
import { beatsAtom } from "@/store/analysisAtoms";
import {
	audioBufferAtom,
	currentTimeAtom,
	durationAtom,
	playbackStateAtom,
} from "@/store/audioAtoms";
import { undoStackAtom } from "@/store/uiAtoms";

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaybackControls() {
	const audioBuffer = useAtomValue(audioBufferAtom);
	const duration = useAtomValue(durationAtom);
	const [playbackState, setPlaybackState] = useAtom(playbackStateAtom);
	const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
	const [_beats, setBeats] = useAtom(beatsAtom);
	const [undoStack, setUndoStack] = useAtom(undoStackAtom);
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
		playbackRef.current.play(currentTime);
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
				playbackRef.current?.play(time);
			}
		},
		[playbackState, setCurrentTime],
	);

	const handleUndo = useCallback(() => {
		if (undoStack.length === 0) return;
		const prev = undoStack[undoStack.length - 1];
		setBeats(prev.beats);
		setUndoStack((stack) => stack.slice(0, -1));
	}, [undoStack, setBeats, setUndoStack]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "z") {
				e.preventDefault();
				handleUndo();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleUndo]);

	if (!audioBuffer) return null;

	return (
		<div className="flex items-center gap-4">
			<div className="flex gap-2">
				{playbackState === "playing" ? (
					<button
						type="button"
						onClick={handleStop}
						className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600"
					>
						&#9632; Stop
					</button>
				) : (
					<button
						type="button"
						onClick={handlePlay}
						className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
					>
						&#9654; Play
					</button>
				)}
				<button
					type="button"
					onClick={handleUndo}
					disabled={undoStack.length === 0}
					className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-600 disabled:opacity-30"
				>
					Undo
				</button>
			</div>

			<input
				type="range"
				min={0}
				max={duration}
				step={0.01}
				value={currentTime}
				onChange={handleSeek}
				className="flex-1"
			/>

			<span className="min-w-[5rem] text-right text-sm tabular-nums text-gray-400">
				{formatTime(currentTime)} / {formatTime(duration)}
			</span>
		</div>
	);
}
