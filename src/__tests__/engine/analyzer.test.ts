import { describe, expect, it } from "vitest";
import { AnalysisManager } from "@/engine/analyzer";

describe("AnalysisManager", () => {
	it("can be instantiated", () => {
		const manager = new AnalysisManager();
		expect(manager).toBeDefined();
		expect(manager.terminate).toBeTypeOf("function");
		expect(manager.analyze).toBeTypeOf("function");
		expect(manager.init).toBeTypeOf("function");
	});
});
