const TAP_RESET_MS = 2000;
const MAX_TAPS = 8;

export function appendTapTime(
	previousTapTimes: number[],
	nextTapTime: number,
	resetMs = TAP_RESET_MS,
	maxTaps = MAX_TAPS,
): number[] {
	const lastTapTime = previousTapTimes[previousTapTimes.length - 1];

	if (lastTapTime !== undefined && nextTapTime - lastTapTime > resetMs) {
		return [nextTapTime];
	}

	return [...previousTapTimes.slice(-(maxTaps - 1)), nextTapTime];
}

export function calculateTapBpm(tapTimes: number[]): number | null {
	if (tapTimes.length < 2) return null;

	const intervals: number[] = [];
	for (let i = 1; i < tapTimes.length; i++) {
		const interval = tapTimes[i] - tapTimes[i - 1];
		if (interval > 0) {
			intervals.push(interval);
		}
	}

	if (intervals.length === 0) return null;

	const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
	return 60000 / averageInterval;
}

export { MAX_TAPS, TAP_RESET_MS };
