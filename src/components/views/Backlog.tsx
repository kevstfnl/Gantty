"use client";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Kanban, LayoutList, Plus } from "lucide-react";
import { useState } from "react";
import { AddTaskModal } from "@/components/backlog/AddTaskModal";
import { SprintGroup } from "@/components/backlog/SprintGroup";
import { SprintModal } from "@/components/backlog/SprintModal";
import { SprintTableRow } from "@/components/backlog/SprintTableRow";
import { TaskCard } from "@/components/backlog/TaskCard";
import { Btn, IconBtn, PageHeader } from "@/components/ui";
import { type Feature, type Sprint, type Status, useStore } from "@/lib/store";

type ViewMode = "kanban" | "table";

// Orphan backlog drop zone
function BacklogZone({
	features,
	projectId,
	sprints,
	mode,
}: {
	features: Feature[];
	projectId: string;
	sprints: Sprint[];
	mode: ViewMode;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: "backlog__none" });
	return (
		<div
			className={`border border-[rgba(71,71,71,0.12)] transition-colors ${isOver ? "border-[var(--blue)]" : ""}`}
		>
			<div className="px-5 py-3 bg-[var(--s1)] border-b border-[rgba(71,71,71,0.1)]">
				<span className="text-[11px] font-black uppercase tracking-widest text-[var(--dim)]">
					Backlog non assigné
				</span>
				<span className="ml-3 text-[10px] font-bold bg-[var(--s3)] text-[var(--dim)] px-2 py-0.5">
					{features.length}
				</span>
			</div>
			{mode === "table" ? (
				<div>
					<div className="grid grid-cols-[1fr_130px_90px_56px_160px_40px] px-5 py-2 text-[9px] font-black tracking-widest uppercase text-[var(--dim)] border-b border-[rgba(71,71,71,0.1)] bg-[var(--s2)]">
						<div>Tâche</div>
						<div className="text-center">Statut</div>
						<div className="text-center">Priorité</div>
						<div className="text-center">Jours</div>
						<div className="text-center">Sprint</div>
						<div />
					</div>
					{features.map((f) => (
						<SprintTableRow
							key={f.id}
							feature={f}
							projectId={projectId}
							sprints={sprints}
						/>
					))}
					{features.length === 0 && (
						<div className="py-6 text-center text-[12px] text-[var(--dim)]">
							Toutes les tâches sont assignées à un sprint.
						</div>
					)}
				</div>
			) : (
				<div ref={setNodeRef} className="p-3 flex flex-wrap gap-2 min-h-[80px]">
					{features.map((f) => (
						<div key={f.id} className="w-64">
							<TaskCard feature={f} projectId={projectId} />
						</div>
					))}
					{features.length === 0 && (
						<div className="py-4 w-full text-center text-[12px] text-[var(--dim)]">
							Toutes les tâches sont assignées.
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default function Backlog() {
	const { currentProject, updateFeature, assignTaskToSprint } = useStore();
	const project = currentProject();
	const [activeId, setActiveId] = useState<string | null>(null);
	const [taskModal, setTaskModal] = useState(false);
	const [sprintModal, setSprintModal] = useState(false);
	const [editSprint, setEditSprint] = useState<Sprint | undefined>();
	const [mode, setMode] = useState<ViewMode>("kanban");
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	if (!project)
		return (
			<div className="p-10 text-[var(--dim)]">Sélectionnez un projet.</div>
		);

	const sprints = project.sprints ?? [];
	const activeFeature = project.features.find((f) => f.id === activeId);
	// Orphans = features not assigned to any sprint
	const orphans = project.features.filter(
		(f) => !f.sprintId && !sprints.some((s) => s.taskIds.includes(f.id)),
	);

	function handleDragEnd({ active, over }: DragEndEvent) {
		setActiveId(null);
		if (!over) return;
		const overId = String(over.id);
		const featureId = String(active.id);

		if (overId.includes("__")) {
			const [sid, status] = overId.split("__");
			// Update status AND assign to sprint
			updateFeature(project!.id, featureId, { status: status as Status });
			if (sid !== "backlog") assignTaskToSprint(project!.id, featureId, sid);
			else assignTaskToSprint(project!.id, featureId, null);
		} else if (["todo", "progress", "done"].includes(overId)) {
			updateFeature(project!.id, featureId, { status: overId as Status });
		} else if (overId === "backlog__none") {
			assignTaskToSprint(project!.id, featureId, null);
		}
	}

	return (
		<div className="p-8 overflow-auto h-full">
			<PageHeader
				title="Backlog"
				sub={project.name}
				action={
					<div className="flex gap-2 items-center">
						<div className="flex border border-[rgba(71,71,71,0.3)]">
							<IconBtn
								className={mode === "table" ? "bg-[var(--s3)] text-white" : ""}
								onClick={() => setMode("table")}
							>
								<LayoutList size={15} />
							</IconBtn>
							<IconBtn
								className={mode === "kanban" ? "bg-[var(--s3)] text-white" : ""}
								onClick={() => setMode("kanban")}
							>
								<Kanban size={15} />
							</IconBtn>
						</div>
						<Btn
							variant="secondary"
							icon={<Plus size={15} />}
							onClick={() => {
								setEditSprint(undefined);
								setSprintModal(true);
							}}
						>
							Sprint
						</Btn>
						<Btn
							variant="primary"
							icon={<Plus size={15} />}
							onClick={() => setTaskModal(true)}
						>
							Tâche
						</Btn>
					</div>
				}
			/>

			<DndContext
				sensors={sensors}
				onDragStart={({ active }: DragStartEvent) =>
					setActiveId(String(active.id))
				}
				onDragEnd={handleDragEnd}
			>
				{/* Sprint groups */}
				{sprints.map((sprint) => (
					<SprintGroup
						key={sprint.id}
						sprint={sprint}
						features={project.features.filter(
							(f) => f.sprintId === sprint.id || sprint.taskIds.includes(f.id),
						)}
						allSprints={sprints}
						projectId={project.id}
						mode={mode}
						onEdit={(s) => {
							setEditSprint(s);
							setSprintModal(true);
						}}
					/>
				))}

				{/* Orphan backlog */}
				<div className="mt-4">
					<BacklogZone
						features={orphans}
						projectId={project.id}
						sprints={sprints}
						mode={mode}
					/>
				</div>

				<DragOverlay>
					{activeFeature && (
						<TaskCard feature={activeFeature} projectId={project.id} overlay />
					)}
				</DragOverlay>
			</DndContext>

			<AddTaskModal
				projectId={project.id}
				open={taskModal}
				onClose={() => setTaskModal(false)}
			/>
			<SprintModal
				projectId={project.id}
				sprint={editSprint}
				open={sprintModal}
				onClose={() => setSprintModal(false)}
			/>
		</div>
	);
}
