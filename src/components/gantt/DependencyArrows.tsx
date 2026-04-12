import type React from "react";
import type { Feature, Module, Schedule } from "@/lib/store";
import { HEAD_H } from "./GanttHeader";
import { MODULE_H, PROJ_H, SPRINT_H } from "./GanttLabels";
import { computeBarGeometry } from "./ganttUtils";

interface Props {
	features: Feature[];
	modules: Module[];
	projectStart: string;
	schedule: Schedule;
	dayW: number;
	rowH: number;
	sprintCount: number;
	onRemove?: (fromId: string, toId: string) => void;
}

const COLOR = "rgba(0,76,237,0.85)";
const GAP = 14;

function rowCenterY(
	idx: number,
	features: Feature[],
	modules: Module[],
	rowH: number,
	sprintCount: number,
): number {
	let y = HEAD_H + PROJ_H + sprintCount * SPRINT_H;
	let lastMid = "__NONE__";
	for (let i = 0; i <= idx; i++) {
		const mid = features[i].moduleId || "";
		if (mid !== lastMid) {
			lastMid = mid;
			if (modules.length > 0) y += MODULE_H;
		}
		if (i < idx) y += rowH;
		else y += rowH / 2;
	}
	return y;
}

function rowTopY(
	idx: number,
	features: Feature[],
	modules: Module[],
	rowH: number,
	sprintCount: number,
): number {
	return rowCenterY(idx, features, modules, rowH, sprintCount) - rowH / 2;
}

export function DependencyArrows({
	features,
	modules,
	projectStart,
	schedule,
	dayW,
	rowH,
	sprintCount,
	onRemove,
}: Props) {
	const arrows: React.ReactElement[] = [];

	features.forEach((f, toIdx) => {
		(f.dependsOn ?? []).forEach((fromId) => {
			const fromIdx = features.findIndex((x) => x.id === fromId);
			const from = features[fromIdx];
			if (!from || !from.start || !f.start) return;

			const { left: fromLeft, width: fromWidth } = computeBarGeometry(
				projectStart,
				from.start,
				from.days,
				schedule,
				dayW,
			);
			const { left: toLeft, width: toWidth } = computeBarGeometry(
				projectStart,
				f.start,
				f.days,
				schedule,
				dayW,
			);

			const cy1 = rowCenterY(fromIdx, features, modules, rowH, sprintCount);
			const cy2 = rowCenterY(toIdx, features, modules, rowH, sprintCount);
			const ty2 = rowTopY(toIdx, features, modules, rowH, sprintCount);

			// Source: right-center of from-bar
			const x1 = fromLeft + fromWidth;
			const y1 = cy1;

			const targetClearRight = toLeft > x1 + GAP * 2;
			const targetBelow = cy2 > cy1 + 4;
			const targetAbove = cy2 < cy1 - 4;

			let path: string;
			let marker = "url(#dep-right)";

			if (targetClearRight && targetBelow) {
				// Simple L: → ↓ → left-center of target
				path = `M ${x1} ${y1} H ${x1 + GAP} V ${cy2} H ${toLeft}`;
				marker = "url(#dep-right)";
			} else if (targetAbove || (!targetClearRight && targetBelow)) {
				// Target above or overlapping → point to top of target bar
				const toCenterX = toLeft + toWidth / 2;
				// Go right of source, then up above both rows, then down to target top
				const stubX = Math.max(x1 + GAP, toCenterX);
				path = `M ${x1} ${y1} H ${stubX} V ${ty2} H ${toCenterX}`;
				marker = "url(#dep-down)";
			} else {
				// Same row or ambiguous — arc above
				const arcY = Math.min(cy1, cy2) - rowH * 0.5;
				path = `M ${x1} ${y1} H ${x1 + GAP} V ${arcY} H ${toLeft - GAP} V ${cy2} H ${toLeft}`;
				marker = "url(#dep-right)";
			}

			arrows.push(
				<g key={`${f.id}-${fromId}`}>
					<path
						d={path}
						fill="none"
						stroke={COLOR}
						strokeWidth={1.5}
						markerEnd={marker}
					/>
					<path
						d={path}
						fill="none"
						stroke="transparent"
						strokeWidth={14}
						className="cursor-pointer"
						onClick={() => onRemove?.(f.id, fromId)}
					>
						<title>Supprimer la dépendance</title>
					</path>
				</g>,
			);
		});
	});

	if (arrows.length === 0) return null;

	const totalH =
		HEAD_H +
		PROJ_H +
		sprintCount * SPRINT_H +
		(modules.length > 0 ? modules.length * MODULE_H : 0) +
		features.length * rowH +
		80;

	return (
		<svg
			className="absolute top-0 left-0 pointer-events-none w-full"
			style={{ height: totalH, zIndex: 5 }}
		>
			<defs>
				<marker
					id="dep-right"
					markerWidth="7"
					markerHeight="7"
					refX="6"
					refY="3.5"
					orient="auto"
				>
					<path d="M0,0.5 L0,6.5 L6,3.5 z" fill={COLOR} />
				</marker>
				<marker
					id="dep-down"
					markerWidth="7"
					markerHeight="7"
					refX="3.5"
					refY="6"
					orient="auto"
				>
					<path d="M0.5,0 L6.5,0 L3.5,6 z" fill={COLOR} />
				</marker>
			</defs>
			<g className="pointer-events-auto">{arrows}</g>
		</svg>
	);
}
