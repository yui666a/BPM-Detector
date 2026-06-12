import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import React from "react";
import { describe, expect, it } from "vitest";
import { TapTempo } from "@/components/TapTempo";
import { currentTimeAtom, playbackStateAtom } from "@/store/audioAtoms";
import { localeAtom } from "@/store/i18nAtom";
import { maxTapsAtom, tapMarkersAtom } from "@/store/uiAtoms";

function createEnglishStore() {
	const store = createStore();
	store.set(localeAtom, "en");
	return store;
}

describe("TapTempo", () => {
	it("measures bpm from repeated button clicks", () => {
		const tapTimes = [0, 500, 1000];
		let tapIndex = 0;
		const store = createEnglishStore();

		render(
			React.createElement(
				Provider,
				{ store },
				React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }),
			),
		);

		const button = screen.getByRole("button", { name: "Tap" });
		fireEvent.click(button);
		fireEvent.click(button);
		fireEvent.click(button);

		expect(screen.getByText("120.0")).toBeTruthy();
	});

	it("measures bpm from Space key presses", () => {
		const tapTimes = [0, 600, 1200];
		let tapIndex = 0;
		const store = createEnglishStore();

		render(
			React.createElement(
				Provider,
				{ store },
				React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }),
			),
		);

		fireEvent.keyDown(window, { key: " " });
		fireEvent.keyDown(window, { key: " " });
		fireEvent.keyDown(window, { key: " " });

		expect(screen.getByText("100.0")).toBeTruthy();
	});

	it("stores tap markers at the current playback time while playing", () => {
		const store = createEnglishStore();
		store.set(playbackStateAtom, "playing");
		store.set(currentTimeAtom, 12.34);

		render(
			React.createElement(Provider, { store }, React.createElement(TapTempo, { now: () => 0 })),
		);

		fireEvent.click(screen.getByRole("button", { name: "Tap" }));

		expect(store.get(tapMarkersAtom)).toEqual([12.34]);
	});

	it("clears both tap history and stored markers", () => {
		const tapTimes = [0, 500];
		let tapIndex = 0;
		const store = createEnglishStore();
		store.set(playbackStateAtom, "playing");
		store.set(currentTimeAtom, 8.5);

		render(
			React.createElement(
				Provider,
				{ store },
				React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }),
			),
		);

		fireEvent.click(screen.getByRole("button", { name: "Tap" }));
		fireEvent.click(screen.getByRole("button", { name: "Tap" }));
		fireEvent.click(screen.getByRole("button", { name: "Clear" }));

		expect(screen.getByText("--")).toBeTruthy();
		expect(store.get(tapMarkersAtom)).toEqual([]);
	});

	it("renders the tap window label from maxTapsAtom", () => {
		const store = createEnglishStore();
		store.set(maxTapsAtom, 5);

		render(
			React.createElement(Provider, { store }, React.createElement(TapTempo, { now: () => 0 })),
		);

		expect(screen.getByText("Measure from last 5 taps")).toBeTruthy();
	});

	it("updates maxTapsAtom and resets tap history when the slider changes", () => {
		const tapTimes = [0, 500];
		let tapIndex = 0;
		const store = createEnglishStore();

		render(
			React.createElement(
				Provider,
				{ store },
				React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }),
			),
		);

		fireEvent.click(screen.getByRole("button", { name: "Tap" }));
		fireEvent.click(screen.getByRole("button", { name: "Tap" }));
		expect(screen.getByText("120.0")).toBeTruthy();

		fireEvent.change(screen.getByRole("slider"), { target: { value: "4" } });

		expect(store.get(maxTapsAtom)).toBe(4);
		expect(screen.getByText("--")).toBeTruthy();
	});
});
