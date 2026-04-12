import { useEffect } from "react";
import type { Feature, Module, Schedule, Sprint } from "@/lib/store";
import { dayOffset } from "@/lib/utils";
import { DayColumns } from "./DayColumns";
import { DependencyArrows } from "./DependencyArrows";
import { GanttBar } from "./GanttBar";
import { GanttHeader, HEAD_H } from "./GanttHeader";
import { MODULE_H, PROJ_H, SPRINT_H } from "./GanttLabels";
import { buildHeaders } from "./ganttUtils";

interface Props {
	projectId: string;
	projectName: string;
	projectStart: string;
	projectEnd: string;
	features: Feature[];
	modules: Module[];
	schedule: Schedule;
	sprints: Sprint[];
	dayW: number;
	rowH: number;
	totalDays: number;
	chartRef: React.RefObject<HTMLDivElement | null>;
	onScroll: () => void;
	draggingDepFrom: string | null;
	onDepDragStart: (featureId: string, startX: number, startY: number) => void;
	onDepDrop: (targetId: string) => void;
	onDepRemove: (fromId: string, toId: string) => void;
}

export function GanttChart({
	projectId,
	projectName,
	projectStart,
	projectEnd,
	features,
	modules,
	schedule,
	sprints,
	dayW,
	rowH,
	totalDays,
	chartRef,
	onScroll,
	draggingDepFrom,
	onDepDragStart,
	onDepDrop,
	onDepRemove,
}: Props) {
	const totalWidth = totalDays * dayW;
	const { months, days } = buildHeaders(projectStart, projectEnd, schedule);
	const visibleSprints = sprints.filter((s) => s.start && s.end);
	const moduleMap = new Map(modules.map((m) => [m.id, m]));

	// Cancel dep drag on Escape
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && draggingDepFrom) onDepDrop("");
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [draggingDepFrom, onDepDrop]);

	let lastMid = "__NONE__";
	const rowItems: (
		| { kind: "module-sep"; color: string }
		| { kind: "feature"; feature: Feature }
	)[] = [];
	features.forEach((f) => {
		const mid = f.moduleId || "";
		if (mid !== lastMid) {
			lastMid = mid;
			rowItems.push({
				kind: "module-sep",
				color: moduleMap.get(mid)?.color ?? "var(--dim)",
			});
		}
		rowItems.push({ kind: "feature", feature: f });
	});

	return (
		<div
			ref={chartRef}
			className="flex-1 overflow-auto relative"
			onScroll={onScroll}
			// Cancel dep drag if mouseup happens outside any bar row
			onMouseUp={() => {
				if (draggingDepFrom) onDepDrop("");
			}}
		>
			<div style={{ minWidth: totalWidth, position: "relative" }}>
				<GanttHeader months={months} days={days} dayW={dayW} />

				{/* Project bar */}
				<div
					className="relative border-b border-[rgba(71,71,71,0.12)]"
					style={{ height: PROJ_H }}
				>
					<DayColumns days={days} dayW={dayW} />
					<div
						className="absolute flex items-center px-3 text-[10px] font-bold text-white/60 border-l-2 border-[var(--blue)]"
						style={{
							left: 0,
							top: 14,
							height: PROJ_H - 28,
							width: totalWidth,
							background: "rgba(0,76,237,0.12)",
						}}
					>
						{projectName}
					</div>
				</div>

				{/* Sprint rows */}
				{visibleSprints.map((sprint) => {
					const sl = dayOffset(projectStart, sprint.start) * dayW;
					const sw = Math.max(
						dayW,
						dayOffset(projectStart, sprint.end) * dayW + dayW - sl,
					);
					return (
						<div
							key={sprint.id}
							className="relative border-b border-[rgba(71,71,71,0.1)]"
							style={{ height: SPRINT_H }}
						>
							<DayColumns days={days} dayW={dayW} />
							<div
								className="absolute top-[7px] flex items-center px-2 text-[10px] font-bold text-white/70 overflow-hidden"
								style={{
									left: sl,
									width: sw,
									height: SPRINT_H - 14,
									background: "rgba(255,255,255,0.055)",
									borderLeft: "2px solid rgba(255,255,255,0.2)",
								}}
							>
								{sw > 80 ? sprint.name : ""}
							</div>
						</div>
					);
				})}

				{/* Feature rows + module separators */}
				{rowItems.map((item, i) =>
					item.kind === "module-sep" ? (
						<div
							key={`msep-${i}`}
							className="relative border-b border-[rgba(71,71,71,0.12)]"
							style={{
								height: MODULE_H,
								background: "rgba(255,255,255,0.018)",
								borderLeft: `3px solid ${item.color}33`,
							}}
						>
							<DayColumns days={days} dayW={dayW} />
						</div>
					) : (
						<div
							key={item.feature.id}
							data-gantt-row="true"
							className="relative border-b border-[rgba(71,71,71,0.07)]"
							style={{ height: rowH }}
						>
							<DayColumns days={days} dayW={dayW} />
							{item.feature.start && item.feature.days > 0 && (
								<GanttBar
									feature={item.feature}
									projectStart={projectStart}
									projectId={projectId}
									dayW={dayW}
									totalDays={totalDays}
									schedule={schedule}
									days={days}
									rowH={rowH}
									draggingDepFrom={draggingDepFrom}
									onDepDragStart={onDepDragStart}
									onDepDrop={onDepDrop}
									chartRef={chartRef}
								/>
							)}
						</div>
					),
				)}

				<DependencyArrows
					features={features}
					modules={modules}
					projectStart={projectStart}
					schedule={schedule}
					dayW={dayW}
					rowH={rowH}
					sprintCount={visibleSprints.length}
					onRemove={onDepRemove}
				/>
			</div>
		</div>
	);
}
