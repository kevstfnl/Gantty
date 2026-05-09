"use client";
import { Download, Minus, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DepDragLine } from "@/components/gantt/DepDragLine";
import { GanttChart } from "@/components/gantt/GanttChart";
import { HEAD_H } from "@/components/gantt/GanttHeader";
import { GanttLabels } from "@/components/gantt/GanttLabels";
import { GanttLegend } from "@/components/gantt/GanttLegend";
import { Btn, IconBtn, PageHeader, ExportModal } from "@/components/ui";
import { useStore } from "@/lib/store";
import { dayOffset, daysBetween } from "@/lib/utils";
import { exportGanttAsJSON, exportGanttAsSVG, exportGantt } from "@/lib/export/gantt";

const DEFAULT_DAY_W = 36;
const DEFAULT_ROW_H = 52;

export default function Gantt() {
	const { currentProject, reorderFeatures, toggleDependency } = useStore();
	const project = currentProject();

	const [dayW, setDayW] = useState(DEFAULT_DAY_W);
	const [rowH, setRowH] = useState(DEFAULT_ROW_H);
	const [sprintFilter, setSprintFilter] = useState("all");
	const [moduleFilter, setModuleFilter] = useState("all");
	const [exportModal, setExportModal] = useState(false);

	// Dep drag state
	const [draggingDepFrom, setDraggingDepFrom] = useState<string | null>(null);
	const [depDragOrigin, setDepDragOrigin] = useState({ x: 0, y: 0 });

	const chartRef = useRef<HTMLDivElement>(null);
	const labelsRef = useRef<HTMLDivElement>(null);
	const didScroll = useRef(false);

	// Auto-scroll to current/next task on mount
	useEffect(() => {
		if (didScroll.current || !chartRef.current || !project?.start) return;
		const features = [...(project.features ?? [])].sort(
			(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
		);
		const target =
			features.find((f) => f.status === "progress") ??
			features.find((f) => f.status === "todo" && f.start);
		if (!target?.start) return;
		const off = dayOffset(project.start, target.start);
		const scrollX = Math.max(0, off * DEFAULT_DAY_W - 120);
		requestAnimationFrame(() => {
			chartRef.current?.scrollTo({ left: scrollX, behavior: "smooth" });
			didScroll.current = true;
		});
	}, [project]);

	// Cancel dep drag on mouseup anywhere
	useEffect(() => {
		if (!draggingDepFrom) return;
		const onUp = () => {
			setDraggingDepFrom(null);
		};
		window.addEventListener("mouseup", onUp);
		return () => window.removeEventListener("mouseup", onUp);
	}, [draggingDepFrom]);

	if (!project)
		return (
			<div className="p-10 text-[var(--dim)]">Sélectionnez un projet.</div>
		);
	if (!project.start || !project.end)
		return (
			<div className="p-8">
				<PageHeader title="Planning" sub={project.name} />
				<p className="text-[var(--dim)] text-[13px] mt-8 text-center">
					Définissez les dates de début et de fin du projet pour afficher le
					Gantt.
				</p>
			</div>
		);

	const sprints = project.sprints ?? [];
	const modules = project.modules ?? [];
	const totalDays = daysBetween(project.start, project.end);

	let visible =
		moduleFilter === "all"
			? project.features
			: moduleFilter === "none"
				? project.features.filter((f) => !f.moduleId)
				: project.features.filter((f) => f.moduleId === moduleFilter);

	if (sprintFilter !== "all") {
		visible =
			sprintFilter === "none"
				? visible.filter((f) => !sprints.some((s) => s.taskIds.includes(f.id)))
				: visible.filter((f) =>
						sprints.find((s) => s.id === sprintFilter)?.taskIds.includes(f.id),
					);
	}

	const visibleFeatures = [...visible].sort(
		(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
	);

	function syncScroll() {
		if (labelsRef.current && chartRef.current)
			labelsRef.current.scrollTop = chartRef.current.scrollTop;
	}

	function handleDepDragStart(featureId: string, x: number, y: number) {
		setDraggingDepFrom(featureId);
		setDepDragOrigin({ x, y });
	}

	function handleDepDrop(targetId: string) {
		if (draggingDepFrom && targetId && targetId !== draggingDepFrom) {
			toggleDependency(project!.id, targetId, draggingDepFrom);
		}
		setDraggingDepFrom(null);
	}

	const selectCls =
		"bg-[var(--s2)] border border-[rgba(71,71,71,0.3)] text-[var(--txt)] text-[12px] px-3 py-1.5 outline-none cursor-pointer";
	const filterLbl =
		"text-[10px] font-black tracking-widest uppercase text-[var(--dim)]";

	return (
		<div className="p-6 h-full flex flex-col overflow-hidden">
			<PageHeader
				title="Planning"
				sub={project.name}
				action={
					<div className="flex gap-2 items-center flex-wrap">
						{/* Row height */}
						<div
							className="flex items-center border border-[rgba(71,71,71,0.3)]"
							title="Hauteur des lignes"
						>
							<IconBtn
								onClick={() => setRowH((h) => Math.max(32, h - 8))}
								className="w-10 h-10"
							>
								<Minus size={13} />
							</IconBtn>
							<span className="text-[10px] font-bold text-[var(--dim)] px-1 min-w-[28px] text-center">
								{rowH}
							</span>
							<IconBtn
								onClick={() => setRowH((h) => Math.min(96, h + 8))}
								className="w-10 h-10"
							>
								<Plus size={13} />
							</IconBtn>
						</div>
						{/* Zoom */}
						<div className="flex items-center border border-[rgba(71,71,71,0.3)]">
							<IconBtn
								onClick={() => setDayW((w) => Math.max(16, w - 6))}
								className="w-10 h-10"
							>
								<ZoomOut size={15} />
							</IconBtn>
							<span className="text-[10px] font-bold text-[var(--dim)] px-1 min-w-[28px] text-center">
								{dayW}
							</span>
							<IconBtn
								onClick={() => setDayW((w) => Math.min(80, w + 6))}
								className="w-10 h-10"
							>
								<ZoomIn size={15} />
							</IconBtn>
						</div>
						{/* Export button */}
						<Btn
							variant="secondary"
							icon={<Download size={15} />}
							onClick={() => setExportModal(true)}
						>
							Exporter
						</Btn>
					</div>
				}
			/>

			{/* Filters */}
			<div className="flex items-center gap-5 mb-4 flex-wrap">
				<GanttLegend />
				<div className="ml-auto flex items-center gap-5 flex-wrap">
					{modules.length > 0 && (
						<div className="flex items-center gap-2">
							<span className={filterLbl}>Module</span>
							<select
								value={moduleFilter}
								onChange={(e) => setModuleFilter(e.target.value)}
								style={{ colorScheme: "dark" }}
								className={selectCls}
							>
								<option value="all">Tous</option>
								<option value="none">Sans module</option>
								{modules.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name}
									</option>
								))}
							</select>
						</div>
					)}
					{sprints.length > 0 && (
						<div className="flex items-center gap-2">
							<span className={filterLbl}>Sprint</span>
							<select
								value={sprintFilter}
								onChange={(e) => setSprintFilter(e.target.value)}
								style={{ colorScheme: "dark" }}
								className={selectCls}
							>
								<option value="all">Tous</option>
								<option value="none">Non assigné</option>
								{sprints.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden border border-[rgba(71,71,71,0.12)]">
				<GanttLabels
					projectName={project.name}
					features={visibleFeatures}
					modules={modules}
					sprints={sprints}
					headH={HEAD_H}
					rowH={rowH}
					scrollRef={labelsRef}
					onReorder={(ids) => reorderFeatures(project!.id, ids)}
					addingDepFrom={draggingDepFrom}
				/>
				<GanttChart
					projectId={project.id}
					projectName={project.name}
					projectStart={project.start}
					projectEnd={project.end}
					features={visibleFeatures}
					modules={modules}
					schedule={project.schedule}
					sprints={sprints}
					dayW={dayW}
					rowH={rowH}
					totalDays={totalDays}
					chartRef={chartRef}
					onScroll={syncScroll}
					draggingDepFrom={draggingDepFrom}
					onDepDragStart={handleDepDragStart}
					onDepDrop={handleDepDrop}
					onDepRemove={(fromId, toId) =>
						toggleDependency(project!.id, fromId, toId)
					}
				/>
			</div>

			{/* Live SVG preview line while dragging */}
			<DepDragLine
				startX={depDragOrigin.x}
				startY={depDragOrigin.y}
				active={!!draggingDepFrom}
			/>

			{/* Export modal */}
			<ExportModal
				open={exportModal}
				onClose={() => setExportModal(false)}
				title="Exporter le Gantt"
				options={[
					{
						value: "svg",
						label: "SVG (Image vectorielle)",
						description: "Diagramme Gantt vectoriel de haute qualité",
					},
					{
						value: "json",
						label: "JSON",
						description: "Données structurées (sprints, features, modules, dépendances)",
					},
				]}
				onExport={(format) => {
					if (format === "svg") {
						exportGanttAsSVG(project);
					} else if (format === "json") {
						exportGantt(project, "json");
					}
				}}
			/>
		</div>
	);
}
