import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import React from "react";
import { describe, expect, it } from "vitest";
import { TapTempo } from "@/components/TapTempo";
import { currentTimeAtom, playbackStateAtom } from "@/store/audioAtoms";
import { tapMarkersAtom } from "@/store/uiAtoms";

describe("TapTempo", () => {
	it("measures bpm from repeated button clicks", () => {
		const tapTimes = [0, 500, 1000];
		let tapIndex = 0;

		render(React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }));

		const button = screen.getByRole("button", { name: "Tap Tempo" });
		fireEvent.click(button);
		fireEvent.click(button);
		fireEvent.click(button);

		expect(screen.getByText("120.0")).toBeTruthy();
	});

	it("measures bpm from Enter key presses", () => {
		const tapTimes = [0, 600, 1200];
		let tapIndex = 0;

		render(React.createElement(TapTempo, { now: () => tapTimes[tapIndex++] ?? 0 }));

		fireEvent.keyDown(window, { key: "Enter" });
		fireEvent.keyDown(window, { key: "Enter" });
		fireEvent.keyDown(window, { key: "Enter" });

		expect(screen.getByText("100.0")).toBeTruthy();
	});

	it("stores tap markers at the current playback time while playing", () => {
		const store = createStore();
		store.set(playbackStateAtom, "playing");
		store.set(currentTimeAtom, 12.34);

		render(
			React.createElement(Provider, { store }, React.createElement(TapTempo, { now: () => 0 })),
		);

		fireEvent.click(screen.getByRole("button", { name: "Tap Tempo" }));

		expect(store.get(tapMarkersAtom)).toEqual([12.34]);
	});
});
