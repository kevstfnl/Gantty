import { describe, expect, it } from "vitest";
import { validateId, validateIds } from "@/lib/api-validation";

describe("validateId", () => {
	it("accepts alphanumeric ids", () => {
		expect(validateId("abc123")).toBe(true);
		expect(validateId("p1")).toBe(true);
		expect(validateId("f1234567890")).toBe(true);
	});

	it("accepts ids with dash and underscore", () => {
		expect(validateId("proj-1")).toBe(true);
		expect(validateId("feat_123")).toBe(true);
		expect(validateId("t_f1234")).toBe(true);
	});

	it("rejects empty string", () => {
		expect(validateId("")).toBe(false);
	});

	it("rejects ids over 64 chars", () => {
		expect(validateId("a".repeat(65))).toBe(false);
		expect(validateId("a".repeat(64))).toBe(true);
	});

	it("rejects ids with special characters", () => {
		expect(validateId("../etc/passwd")).toBe(false);
		expect(validateId("id with spaces")).toBe(false);
		expect(validateId("id<script>")).toBe(false);
		expect(validateId("id'; DROP TABLE")).toBe(false);
	});
});

describe("validateIds", () => {
	it("returns true when all ids are valid", () => {
		expect(validateIds("abc", "def", "ghi")).toBe(true);
	});

	it("returns false if any id is invalid", () => {
		expect(validateIds("abc", "../hack", "ghi")).toBe(false);
	});

	it("returns true for single valid id", () => {
		expect(validateIds("p1")).toBe(true);
	});
});
