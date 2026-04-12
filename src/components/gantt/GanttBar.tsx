"use client";
import { addDays, format, parseISO } from "date-fns";
import { GripHorizontal } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Schedule } from "@/lib/store";
import { type Feature, useStore } from "@/lib/store";
import { computeBarGeometry, type DayHeader, isOffDay } from "./ganttUtils";

export const BAR_COLORS: Record<string, string> = {
	done: "rgba(93,218,138,0.45)",
	progress: "#004ced",
	todo: "rgba(0,76,237,0.35)",
};

const DEP_DOT_OFFSET = 10;
const DEP_DOT_SIZE = 14;

interface Props {
	feature: Feature;
	projectStart: string;
	projectId: string;
	dayW: number;
	totalDays: number;
	schedule: Schedule;
	days: DayHeader[];
	rowH: number;
	draggingDepFrom: string | null;
	onDepDragStart: (featureId: string, dotCx: number, dotCy: number) => void;
	onDepDrop: (featureId: string) => void;
	chartRef: React.RefObject<HTMLDivElement | null>;
}

interface MoveState {
	type: "move" | "resize";
	startX: number;
	origLeft: number;
	origWidth: number;
}
interface TooltipState {
	x: number;
	y: number;
	text: string;
}

function Tooltip({ x, y, text }: TooltipState) {
	return (
		<div
			className="fixed z-50 bg-[var(--s4)] text-[var(--txt)] text-[11px] font-semibold px-3 py-1.5 pointer-events-none whitespace-nowrap border border-[rgba(71,71,71,0.3)]"
			style={{ left: x + 14, top: y - 36 }}
		>
			{text}
		</div>
	);
}

export function GanttBar({
	feature: f,
	projectStart,
	projectId,
	dayW,
	totalDays,
	schedule,
	days,
	rowH,
	draggingDepFrom,
	onDepDragStart,
	onDepDrop,
	chartRef,
}: Props) {
	const { updateFeature } = useStore();
	const moveRef = useRef<MoveState | null>(null);
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);
	const [rowHover, setRowHover] = useState(false);

	const { left, width } = computeBarGeometry(
		projectStart,
		f.start,
		f.days,
		schedule,
		dayW,
	);
	const barTop = Math.round(rowH * 0.18);
	const barHeight = rowH - barTop * 2;

	function pxToDate(px: number) {
		const off = Math.max(0, Math.min(totalDays - 1, Math.round(px / dayW)));
		return format(addDays(parseISO(projectStart), off), "yyyy-MM-dd");
	}

	function calDaysToWork(startPx: number, widthPx: number) {
		const cal = Math.max(1, Math.round(widthPx / dayW));
		const d0 = pxToDate(startPx);
		let n = 0;
		for (let i = 0; i < cal; i++) {
			if (!isOffDay(format(addDays(parseISO(d0), i), "yyyy-MM-dd"), schedule))
				n++;
		}
		return Math.max(1, n);
	}

	const startMove = useCallback(
		(e: React.MouseEvent, type: "move" | "resize") => {
			e.preventDefault();
			e.stopPropagation();
			moveRef.current = {
				type,
				startX: e.clientX,
				origLeft: left,
				origWidth: width,
			};
			const onMove = (ev: MouseEvent) => {
				const m = moveRef.current;
				if (!m) return;
				const snap = Math.round((ev.clientX - m.startX) / dayW) * dayW;
				if (m.type === "move") {
					const nl = Math.max(0, m.origLeft + snap);
					setTooltip({ x: ev.clientX, y: ev.clientY, text: pxToDate(nl) });
					updateFeature(projectId, f.id, { start: pxToDate(nl) });
				} else {
					const nw = Math.max(dayW, m.origWidth + snap);
					const nd = calDaysToWork(m.origLeft, nw);
					setTooltip({
						x: ev.clientX,
						y: ev.clientY,
						text: `${nd}j travaillé${nd > 1 ? "s" : ""}`,
					});
					updateFeature(projectId, f.id, { days: nd });
				}
			};
			const onUp = () => {
				moveRef.current = null;
				setTooltip(null);
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
			};
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[
			left,
			width,
			dayW,
			totalDays,
			projectStart,
			projectId,
			f.id,
			schedule,
			updateFeature,
		],
	);

	const isDepSource = draggingDepFrom === f.id;
	const isDepTarget = !!(draggingDepFrom && draggingDepFrom !== f.id);
	const showDot = (rowHover || isDepSource) && !draggingDepFrom;

	// Dot CSS position relative to row (absolute inside the row div)
	const dotLeft = left + width + DEP_DOT_OFFSET;
	const dotTop = rowH / 2 - DEP_DOT_SIZE / 2;

	function handleDotMouseDown(e: React.MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		// Compute dot center in window coords from the chart container rect + scroll + CSS offsets
		// This avoids relying on the dot element itself (which may be mid-unmount)
		const container = chartRef.current;
		if (!container) {
			onDepDragStart(f.id, e.clientX, e.clientY);
			return;
		}
		const containerRect = container.getBoundingClientRect();
		// dotLeft/dotTop are relative to the row div which is inside the scrollable chart
		// Window X = container left edge - scroll left + dotLeft + half dot
		const winX =
			containerRect.left - container.scrollLeft + dotLeft + DEP_DOT_SIZE / 2;
		// Window Y = container top edge - scroll top + (cumulative row Y) + dotTop + half dot
		// We get cumulative row Y from the row element itself
		const rowEl = (e.currentTarget as HTMLElement).closest(
			"[data-gantt-row]",
		) as HTMLElement | null;
		const rowRect = rowEl?.getBoundingClientRect();
		const winY = rowRect
			? rowRect.top + rowH / 2 // vertical center of the row in window coords
			: e.clientY;
		onDepDragStart(f.id, winX, winY);
	}

	return (
		<div
			style={{ position: "absolute", inset: 0 }}
			onMouseEnter={() => setRowHover(true)}
			onMouseLeave={() => setRowHover(false)}
			onMouseUp={() => {
				if (isDepTarget) onDepDrop(f.id);
			}}
		>
			{/* Main bar */}
			<div
				onMouseDown={(e) => {
					if (!draggingDepFrom) startMove(e, "move");
				}}
				className="absolute group flex items-center"
				style={{
					left,
					width,
					top: barTop,
					height: barHeight,
					background: BAR_COLORS[f.status] ?? BAR_COLORS.todo,
					cursor: draggingDepFrom ? "crosshair" : "grab",
					userSelect: "none",
					outline:
						isDepTarget && rowHover ? "2px solid var(--blue)" : undefined,
				}}
				title={`${f.name} — ${f.days}j`}
			>
				{width > 56 && (
					<span className="px-2 text-[11px] font-bold text-white/85 truncate flex-1 pointer-events-none">
						{f.name}
					</span>
				)}
				{width > 40 && (
					<span className="pr-6 text-[10px] text-white/50 pointer-events-none flex-shrink-0">
						{f.days}j
					</span>
				)}
				{!draggingDepFrom && (
					<div
						onMouseDown={(e) => startMove(e, "resize")}
						className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
					>
						<GripHorizontal size={10} className="text-white/70" />
					</div>
				)}
			</div>

			{/* Dep dot — always outside the bar, visible on row hover */}
			{showDot && (
				<div
					onMouseDown={handleDotMouseDown}
					className="absolute z-20 flex items-center justify-center cursor-crosshair"
					style={{
						left: dotLeft,
						top: dotTop,
						width: DEP_DOT_SIZE,
						height: DEP_DOT_SIZE,
					}}
					title="Glisser pour créer une dépendance"
				>
					<div
						className="rounded-full border-2 transition-all duration-100 hover:scale-125"
						style={{
							width: 10,
							height: 10,
							background: "var(--bg)",
							borderColor: "var(--blue)",
							boxShadow: "0 0 0 3px rgba(0,76,237,0.25)",
						}}
					/>
				</div>
			)}

			{/* Filled dot while this is the drag source */}
			{isDepSource && (
				<div
					className="absolute z-20 flex items-center justify-center pointer-events-none"
					style={{
						left: dotLeft,
						top: dotTop,
						width: DEP_DOT_SIZE,
						height: DEP_DOT_SIZE,
					}}
				>
					<div
						className="rounded-full"
						style={{
							width: 10,
							height: 10,
							background: "var(--blue)",
							boxShadow: "0 0 0 3px rgba(0,76,237,0.4)",
						}}
					/>
				</div>
			)}

			{tooltip && <Tooltip {...tooltip} />}
		</div>
	);
}
