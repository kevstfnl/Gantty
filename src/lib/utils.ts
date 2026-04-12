import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority, Status } from "./store";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const STATUS_LABEL: Record<Status, string> = {
	todo: "À faire",
	progress: "En cours",
	done: "Terminé",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
	p1: "P1",
	p2: "P2",
	p3: "P3",
};

export const STATUS_COLOR: Record<Status, string> = {
	todo: "bg-[var(--s4)] text-[var(--muted)]",
	progress: "bg-[rgba(0,76,237,0.15)] text-[#7da8ff]",
	done: "bg-[rgba(40,160,80,0.15)] text-[#5dda8a]",
};

export const PRIORITY_COLOR: Record<Priority, string> = {
	p1: "bg-[rgba(255,180,171,0.1)] text-[var(--err)]",
	p2: "bg-[rgba(255,204,128,0.1)] text-[#ffcc80]",
	p3: "bg-[rgba(71,71,71,0.3)] text-[var(--dim)]",
};

export const MONTHS = [
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
export const DAYS_SHORT = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function daysBetween(a: string, b: string) {
	return (
		Math.ceil(
			(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
		) + 1
	);
}

export function dayOffset(fromDate: string, targetDate: string) {
	return Math.max(
		0,
		Math.ceil(
			(new Date(targetDate).getTime() - new Date(fromDate).getTime()) /
				(1000 * 60 * 60 * 24),
		),
	);
}

export function getProgress(features: { status: Status }[]) {
	if (!features.length) return 0;
	return Math.round(
		(features.filter((f) => f.status === "done").length / features.length) *
			100,
	);
}
