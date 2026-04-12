import { describe, expect, it } from "vitest";
import {
	addWorkingDays,
	buildHeaders,
	computeBarGeometry,
	countWorkingDays,
	isOffDay,
} from "@/components/gantt/ganttUtils";
import type { Schedule } from "@/lib/store";

const weekdaySchedule: Schedule = {
	days: [1, 2, 3, 4, 5], // Mon–Fri
	start: "09:00",
	end: "18:00",
	exceptions: [],
};

const withHoliday: Schedule = {
	...weekdaySchedule,
	exceptions: [{ date: "2025-01-06", label: "Épiphanie" }],
};

// ── isOffDay ───────────────────────────────────────────────────────────────
describe("isOffDay", () => {
	it("marks Saturday as off", () => {
		expect(isOffDay("2025-01-04", weekdaySchedule)).toBe(true); // Saturday
	});
	it("marks Sunday as off", () => {
		expect(isOffDay("2025-01-05", weekdaySchedule)).toBe(true); // Sunday
	});
	it("marks Monday as working", () => {
		expect(isOffDay("2025-01-06", weekdaySchedule)).toBe(false); // Monday
	});
	it("marks exception day as off", () => {
		expect(isOffDay("2025-01-06", withHoliday)).toBe(true);
	});
	it("marks non-exception Monday as working", () => {
		expect(isOffDay("2025-01-13", withHoliday)).toBe(false);
	});
	it("handles all days enabled", () => {
		const all: Schedule = { ...weekdaySchedule, days: [0, 1, 2, 3, 4, 5, 6] };
		expect(isOffDay("2025-01-04", all)).toBe(false); // Saturday now working
	});
});

// ── addWorkingDays ─────────────────────────────────────────────────────────
describe("addWorkingDays", () => {
	it("adds 1 working day (Mon→Tue)", () => {
		expect(addWorkingDays("2025-01-06", 1, weekdaySchedule)).toBe("2025-01-07");
	});
	it("skips weekend (Fri+1 working day = Mon)", () => {
		expect(addWorkingDays("2025-01-03", 1, weekdaySchedule)).toBe("2025-01-06");
	});
	it("adds 5 working days spanning a weekend", () => {
		// Mon Jan 6 + 5 days = Mon Jan 13 (skips Sat/Sun)
		expect(addWorkingDays("2025-01-06", 5, weekdaySchedule)).toBe("2025-01-13");
	});
	it("skips holiday when adding days", () => {
		// If Jan 6 is holiday, Mon Jan 6 + 1 working day = Tue Jan 7 still
		// but from Fri Jan 3 + 1 = Tue Jan 7 (skips weekend AND holiday Jan 6)
		expect(addWorkingDays("2025-01-03", 1, withHoliday)).toBe("2025-01-07");
	});
});

// ── countWorkingDays ───────────────────────────────────────────────────────
describe("countWorkingDays", () => {
	it("counts 5 days in a standard work week", () => {
		expect(countWorkingDays("2025-01-06", "2025-01-10", weekdaySchedule)).toBe(
			5,
		);
	});
	it("excludes weekends in two-week span", () => {
		expect(countWorkingDays("2025-01-06", "2025-01-17", weekdaySchedule)).toBe(
			10,
		);
	});
	it("excludes holiday from count", () => {
		expect(countWorkingDays("2025-01-06", "2025-01-10", withHoliday)).toBe(4);
	});
	it("returns 0 for Saturday–Sunday", () => {
		expect(countWorkingDays("2025-01-04", "2025-01-05", weekdaySchedule)).toBe(
			0,
		);
	});
	it("returns 1 for a single working day", () => {
		expect(countWorkingDays("2025-01-06", "2025-01-06", weekdaySchedule)).toBe(
			1,
		);
	});
});

// ── computeBarGeometry ─────────────────────────────────────────────────────
describe("computeBarGeometry", () => {
	const DAY_W = 30;
	const projectStart = "2025-01-06";

	it("1 working day at project start = width of 1 day", () => {
		const { left, width, calendarDays } = computeBarGeometry(
			projectStart,
			"2025-01-06",
			1,
			weekdaySchedule,
			DAY_W,
		);
		expect(left).toBe(0);
		expect(calendarDays).toBe(1);
		expect(width).toBe(DAY_W);
	});

	it("5 working days starting Monday fills 5 calendar days (no weekend)", () => {
		const { calendarDays } = computeBarGeometry(
			projectStart,
			"2025-01-06",
			5,
			weekdaySchedule,
			DAY_W,
		);
		expect(calendarDays).toBe(5); // Mon–Fri, no weekend inside
	});

	it("bar spanning weekend is wider than 5 days", () => {
		// 6 working days from Mon Jan 6 = Mon Jan 6 to Tue Jan 14 (8 calendar days)
		const { calendarDays } = computeBarGeometry(
			projectStart,
			"2025-01-06",
			6,
			weekdaySchedule,
			DAY_W,
		);
		expect(calendarDays).toBeGreaterThan(6); // stretched over weekend
	});

	it("bar starting on day 2 of project has correct left offset", () => {
		const { left } = computeBarGeometry(
			projectStart,
			"2025-01-07",
			1,
			weekdaySchedule,
			DAY_W,
		);
		expect(left).toBe(DAY_W); // 1 day from project start
	});

	it("minimum width is dayW even for 0 days", () => {
		const { width } = computeBarGeometry(
			projectStart,
			"2025-01-06",
			0,
			weekdaySchedule,
			DAY_W,
		);
		expect(width).toBeGreaterThanOrEqual(DAY_W);
	});
});

// ── buildHeaders ───────────────────────────────────────────────────────────
describe("buildHeaders", () => {
	it("generates correct number of days", () => {
		const { days } = buildHeaders("2025-01-06", "2025-01-10", weekdaySchedule);
		expect(days).toHaveLength(5);
	});

	it("marks weekends as off", () => {
		const { days } = buildHeaders("2025-01-04", "2025-01-05", weekdaySchedule);
		expect(days.every((d) => d.isOff)).toBe(true);
	});

	it("builds correct month headers", () => {
		const { months } = buildHeaders(
			"2025-01-28",
			"2025-02-03",
			weekdaySchedule,
		);
		expect(months).toHaveLength(2);
		expect(months[0].label).toContain("Jan");
		expect(months[1].label).toContain("Fév");
	});

	it("marks today correctly", () => {
		const today = new Date().toISOString().slice(0, 10);
		const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
		const { days } = buildHeaders(today, tomorrow, weekdaySchedule);
		expect(days[0].isToday).toBe(true);
		expect(days[1].isToday).toBe(false);
	});
});
