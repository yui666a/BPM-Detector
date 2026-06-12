"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { useT } from "@/hooks/useT";
import {
	appendTapTime,
	calculateTapBpm,
	MAX_MAX_TAPS,
	MIN_MAX_TAPS,
	TAP_RESET_MS,
} from "@/lib/tapTempo";
import { currentTimeAtom, playbackStateAtom } from "@/store/audioAtoms";
import { maxTapsAtom, tapMarkersAtom, tapTempoBpmAtom, uiResetVersionAtom } from "@/store/uiAtoms";

function isInteractiveTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(
		target.closest('button, input, textarea, select, a, [role="button"], [contenteditable="true"]'),
	);
}

interface TapTempoProps {
	now?: () => number;
}

export function TapTempo({ now = () => performance.now() }: TapTempoProps) {
	const t = useT();
	const [tapTimes, setTapTimes] = React.useState<number[]>([]);
	const currentTime = useAtomValue(currentTimeAtom);
	const playbackState = useAtomValue(playbackStateAtom);
	const uiResetVersion = useAtomValue(uiResetVersionAtom);
	const setTapMarkers = useSetAtom(tapMarkersAtom);
	const setTapTempoBpm = useSetAtom(tapTempoBpmAtom);
	const [maxTaps, setMaxTaps] = useAtom(maxTapsAtom);

	const getNow = React.useCallback(() => now(), [now]);

	const registerTap = React.useCallback(
		(tapTime = getNow()) => {
			setTapTimes((previousTapTimes) =>
				appendTapTime(previousTapTimes, tapTime, TAP_RESET_MS, maxTaps),
			);
			if (playbackState === "playing") {
				setTapMarkers((previousMarkers) => [...previousMarkers, currentTime]);
			}
		},
		[currentTime, getNow, maxTaps, playbackState, setTapMarkers],
	);

	const bpm = React.useMemo(() => calculateTapBpm(tapTimes), [tapTimes]);
	const hasTapData = tapTimes.length > 0;

	const clearTapTempo = React.useCallback(() => {
		setTapTimes([]);
		setTapMarkers([]);
		setTapTempoBpm(null);
	}, [setTapMarkers, setTapTempoBpm]);

	const handleMaxTapsChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setMaxTaps(Number(event.target.value));
			clearTapTempo();
		},
		[clearTapTempo, setMaxTaps],
	);

	React.useEffect(() => {
		setTapTempoBpm(bpm);
	}, [bpm, setTapTempoBpm]);

	React.useEffect(() => {
		void uiResetVersion;
		setTapTimes([]);
	}, [uiResetVersion]);

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== " " || event.repeat || isInteractiveTarget(event.target)) {
				return;
			}

			event.preventDefault();
			registerTap();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [registerTap]);

	return (
		<section className="rounded-xl border border-gray-800 bg-gray-950/60 p-5 text-gray-100">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
						{t.tapTempo}
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-4xl font-bold tabular-nums">
							{bpm === null ? "--" : bpm.toFixed(1)}
						</span>
						<span className="text-lg text-gray-400">{t.bpmUnit}</span>
					</div>
					<p className="text-sm text-gray-400">{t.tapInstruction}</p>
					<p className="text-xs text-gray-500">
						{t.tapResetNotice(Math.round(TAP_RESET_MS / 1000))}
					</p>
					<div className="space-y-1 pt-2">
						<label htmlFor="tap-window" className="block text-xs text-gray-400">
							{t.tapWindowLabel(maxTaps)}
						</label>
						<input
							id="tap-window"
							type="range"
							min={MIN_MAX_TAPS}
							max={MAX_MAX_TAPS}
							step={1}
							value={maxTaps}
							onChange={handleMaxTapsChange}
							className="w-full accent-amber-500"
						/>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={() => registerTap()}
						className="rounded-xl bg-amber-500 px-6 py-4 text-base font-semibold text-gray-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
					>
						{t.tapButton}
					</button>
					<button
						type="button"
						onClick={clearTapTempo}
						disabled={!hasTapData}
						className="rounded-xl border border-gray-700 px-5 py-4 text-base font-medium text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{t.clear}
					</button>
				</div>
			</div>
		</section>
	);
}
