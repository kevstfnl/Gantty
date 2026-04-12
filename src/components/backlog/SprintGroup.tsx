"use client";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { AnimatedCollapse } from "@/components/shared/AnimatedCollapse";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { type Feature, type Sprint, type Status, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SprintTableRow } from "./SprintTableRow";
import { TaskCard } from "./TaskCard";

const COLS: { id: Status; label: string; color: string }[] = [
	{ id: "todo", label: "À faire", color: "text-[var(--muted)]" },
	{ id: "progress", label: "En cours", color: "text-[#7da8ff]" },
	{ id: "done", label: "Terminé", color: "text-[#5dda8a]" },
];

function KanbanDrop({
	id,
	features,
	projectId,
}: {
	id: string;
	features: Feature[];
	projectId: string;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });
	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex-1 min-h-[120px] p-2 transition-colors",
				isOver && "bg-[var(--blue-bg)]",
			)}
		>
			{features.map((f) => (
				<TaskCard key={f.id} feature={f} projectId={projectId} />
			))}
		</div>
	);
}

interface Props {
	sprint: Sprint;
	features: Feature[];
	allSprints: Sprint[];
	projectId: string;
	mode: "table" | "kanban";
	onEdit: (sprint: Sprint) => void;
}

export function SprintGroup({
	sprint,
	features,
	allSprints,
	projectId,
	mode,
	onEdit,
}: Props) {
	const { deleteSprint } = useStore();
	const [open, setOpen] = useState(true);
	const [confirm, setConfirm] = useState(false);

	const done = features.filter((f) => f.status === "done").length;
	const pct = features.length ? Math.round((done / features.length) * 100) : 0;

	return (
		<div className="mb-4 border border-[rgba(71,71,71,0.12)]">
			{/* Sprint header */}
			<div
				className="flex items-center gap-3 px-5 py-3 bg-[var(--s1)] cursor-pointer select-none"
				onClick={() => setOpen(!open)}
			>
				<ChevronRight
					size={15}
					className={cn(
						"text-[var(--dim)] transition-transform duration-200 flex-shrink-0",
						open && "rotate-90",
					)}
				/>
				<span className="font-black text-[13px] text-white">{sprint.name}</span>
				{sprint.start && sprint.end && (
					<span className="text-[10px] text-[var(--dim)] font-semibold">
						{sprint.start} → {sprint.end}
					</span>
				)}
				{sprint.goal && (
					<span className="text-[11px] text-[var(--muted)] italic truncate flex-1">
						{sprint.goal}
					</span>
				)}
				<div className="flex items-center gap-2 ml-auto">
					<div className="w-24 h-1 bg-[var(--s4)]">
						<div
							className="h-full bg-[var(--blue)]"
							style={{ width: pct + "%" }}
						/>
					</div>
					<span className="text-[10px] font-bold text-[var(--dim)]">
						{done}/{features.length}
					</span>
				</div>
				<div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
					<button
						onClick={() => onEdit(sprint)}
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-white bg-transparent border-0 cursor-pointer"
					>
						<Pencil size={13} />
					</button>
					<button
						onClick={() => setConfirm(true)}
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-[var(--err)] bg-transparent border-0 cursor-pointer"
					>
						<Trash2 size={13} />
					</button>
				</div>
			</div>

			<AnimatedCollapse open={open}>
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
								sprints={allSprints}
							/>
						))}
						{features.length === 0 && (
							<div className="py-6 text-center text-[12px] text-[var(--dim)]">
								Aucune tâche dans ce sprint.
							</div>
						)}
					</div>
				) : (
					<div className="grid grid-cols-3 gap-0 border-t border-[rgba(71,71,71,0.1)]">
						{COLS.map((col) => (
							<div
								key={col.id}
								className="border-r border-[rgba(71,71,71,0.1)] last:border-r-0"
							>
								<div className="px-4 py-2.5 border-b border-[rgba(71,71,71,0.1)] flex items-center justify-between">
									<span
										className={cn(
											"text-[10px] font-black tracking-widest uppercase",
											col.color,
										)}
									>
										{col.label}
									</span>
									<span className="text-[9px] font-bold bg-[var(--s3)] text-[var(--dim)] px-1.5 py-0.5">
										{features.filter((f) => f.status === col.id).length}
									</span>
								</div>
								<KanbanDrop
									id={`${sprint.id}__${col.id}`}
									features={features.filter((f) => f.status === col.id)}
									projectId={projectId}
								/>
							</div>
						))}
					</div>
				)}
			</AnimatedCollapse>

			<ConfirmDialog
				open={confirm}
				title="Supprimer le sprint"
				message={`Supprimer « ${sprint.name} » ? Les tâches resteront dans le backlog.`}
				onConfirm={() => deleteSprint(projectId, sprint.id)}
				onClose={() => setConfirm(false)}
			/>
		</div>
	);
}
