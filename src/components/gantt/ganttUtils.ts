import { addDays, format, getDaysInMonth, parseISO } from "date-fns";
import type { Schedule } from "@/lib/store";

// ── Working day helpers ───────────────────────────────────────────────────

export function isOffDay(dateStr: string, schedule: Schedule): boolean {
	const d = parseISO(dateStr);
	const dow = d.getDay();
	if (!schedule.days.includes(dow)) return true;
	return schedule.exceptions?.some((e) => e.date === dateStr) ?? false;
}

export function addWorkingDays(
	startStr: string,
	workDays: number,
	schedule: Schedule,
): string {
	let cur = parseISO(startStr);
	let remaining = workDays;
	while (remaining > 0) {
		cur = addDays(cur, 1);
		if (!isOffDay(format(cur, "yyyy-MM-dd"), schedule)) remaining--;
	}
	return format(cur, "yyyy-MM-dd");
}

export function countWorkingDays(
	startStr: string,
	endStr: string,
	schedule: Schedule,
): number {
	let cur = parseISO(startStr);
	const end = parseISO(endStr);
	let count = 0;
	while (cur <= end) {
		if (!isOffDay(format(cur, "yyyy-MM-dd"), schedule)) count++;
		cur = addDays(cur, 1);
	}
	return count;
}

// ── Bar geometry ──────────────────────────────────────────────────────────

/**
 * Compute the left pixel and calendar width for a feature bar.
 *
 * The bar starts at `feature.start` and spans `feature.days` *working* days.
 * When a non-working day falls inside that span the bar stretches to cover it
 * visually so that the bar end always lands on the correct working-day end.
 */
export function computeBarGeometry(
	projectStart: string,
	featureStart: string,
	workDays: number,
	schedule: Schedule,
	dayW: number,
): { left: number; width: number; calendarDays: number } {
	// Calendar offset of the feature start from project start
	const startOffset = Math.max(
		0,
		Math.ceil(
			(parseISO(featureStart).getTime() - parseISO(projectStart).getTime()) /
				86400000,
		),
	);

	// Walk forward counting working days to find the end date
	let cur = parseISO(featureStart);
	let remaining = Math.max(1, workDays);
	// The first day counts as 1 working day (if it's a working day)
	if (!isOffDay(featureStart, schedule)) remaining--;

	while (remaining > 0) {
		cur = addDays(cur, 1);
		if (!isOffDay(format(cur, "yyyy-MM-dd"), schedule)) remaining--;
	}

	const endStr = format(cur, "yyyy-MM-dd");
	const endOffset = Math.ceil(
		(parseISO(endStr).getTime() - parseISO(projectStart).getTime()) / 86400000,
	);
	const calendarDays = endOffset - startOffset + 1;

	return {
		left: startOffset * dayW,
		width: Math.max(dayW, calendarDays * dayW),
		calendarDays,
	};
}

// ── Header data ───────────────────────────────────────────────────────────

export interface MonthHeader {
	label: string;
	days: number; // calendar days visible in this month segment
	year: number;
	month: number; // 0-based
}

export interface DayHeader {
	dateStr: string;
	dayNum: number; // day of month
	isOff: boolean;
	isToday: boolean;
}

const MONTHS_FR = [
	"Jan",
	"Fév",
	"Mar",
	"Avr",
	"Mai",
	"Jun",
	"Jul",
	"Aoû",
	"Sep",
	"Oct",
	"Nov",
	"Déc",
];

export function buildHeaders(
	projectStart: string,
	projectEnd: string,
	schedule: Schedule,
): { months: MonthHeader[]; days: DayHeader[] } {
	const start = parseISO(projectStart);
	const end = parseISO(projectEnd);
	const today = format(new Date(), "yyyy-MM-dd");

	// Days
	const days: DayHeader[] = [];
	let cur = new Date(start);
	while (cur <= end) {
		const dateStr = format(cur, "yyyy-MM-dd");
		days.push({
			dateStr,
			dayNum: cur.getDate(),
			isOff: isOffDay(dateStr, schedule),
			isToday: dateStr === today,
		});
		cur = addDays(cur, 1);
	}

	// Months — group consecutive days by year+month
	const months: MonthHeader[] = [];
	for (let i = 0; i < days.length; ) {
		const d = parseISO(days[i].dateStr);
		const y = d.getFullYear();
		const m = d.getMonth();
		let cnt = 0;
		while (i + cnt < days.length) {
			const dd = parseISO(days[i + cnt].dateStr);
			if (dd.getFullYear() !== y || dd.getMonth() !== m) break;
			cnt++;
		}
		months.push({
			label: MONTHS_FR[m] + " " + y,
			days: cnt,
			year: y,
			month: m,
		});
		i += cnt;
	}

	return { months, days };
}

// Legacy — kept for backwards compat
export function buildMonthHeaders(
	startDate: Date,
	endDate: Date,
): { label: string; days: number }[] {
	return buildHeaders(
		format(startDate, "yyyy-MM-dd"),
		format(endDate, "yyyy-MM-dd"),
		{ days: [0, 1, 2, 3, 4, 5, 6], start: "", end: "", exceptions: [] },
	).months;
}
