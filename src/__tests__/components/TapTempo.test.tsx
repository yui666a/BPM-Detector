import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { TapTempo } from "@/components/TapTempo";

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
});
