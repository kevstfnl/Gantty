"use client";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AnimatedCollapse } from "@/components/shared/AnimatedCollapse";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { type Feature, type Module, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DraggableFeatureRow } from "./DraggableFeatureRow";

interface Props {
	module: Module;
	features: Feature[]; // display list (may be from DnD)
	projectId: string;
	openRow: string | null;
	onToggleRow: (id: string) => void;
	onEdit: (mod: Module) => void;
	onAddFeature: (moduleId: string) => void;
}

export function ModuleGroup({
	module: mod,
	features,
	projectId,
	openRow,
	onToggleRow,
	onEdit,
	onAddFeature,
}: Props) {
	const { deleteModule, currentProject } = useStore();
	const [open, setOpen] = useState(true);
	const [confirm, setConfirm] = useState(false);
	const { setNodeRef, isOver } = useDroppable({ id: `module:${mod.id}` });

	// Always read fresh features from store for accurate stats
	const project = currentProject();
	const liveFeatures = (project?.features ?? []).filter(
		(f) => f.moduleId === mod.id,
	);

	const done = liveFeatures.filter((f) => f.status === "done").length;
	const total = liveFeatures.length;
	const pct = total ? Math.round((done / total) * 100) : 0;
	const totalDays = liveFeatures.reduce((s, f) => s + (f.days || 0), 0);

	return (
		<div className="border-b border-[rgba(71,71,71,0.1)] last:border-0">
			<div
				className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none hover:bg-[var(--s2)] transition-colors"
				onClick={() => setOpen(!open)}
			>
				<ChevronRight
					size={16}
					className={cn(
						"flex-shrink-0 transition-transform duration-200",
						open && "rotate-90",
					)}
					style={{ color: mod.color }}
				/>
				<div
					className="w-3 h-3 rounded-full flex-shrink-0"
					style={{ background: mod.color }}
				/>
				<span className="font-black text-[14px] text-white">{mod.name}</span>
				{mod.description && (
					<span className="text-[11px] text-[var(--dim)] italic truncate">
						{mod.description}
					</span>
				)}

				{/* Live stats */}
				<div className="flex items-center gap-5 ml-auto text-[10px] text-[var(--dim)]">
					<span className="font-bold">{totalDays}j estimé</span>
					<div className="flex items-center gap-2">
						<div className="w-24 h-1.5 bg-[var(--s4)]">
							<div
								className="h-full transition-all duration-300"
								style={{ width: pct + "%", background: mod.color }}
							/>
						</div>
						<span className="font-bold w-8">
							{done}/{total}
						</span>
					</div>
				</div>

				{/* Action buttons — 40px touch targets */}
				<div className="flex gap-0.5 ml-2" onClick={(e) => e.stopPropagation()}>
					<button
						onClick={() => onAddFeature(mod.id)}
						title="Ajouter une fonctionnalité"
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-white bg-transparent border-0 cursor-pointer transition-colors"
					>
						<Plus size={14} />
					</button>
					<button
						onClick={() => onEdit(mod)}
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-white bg-transparent border-0 cursor-pointer transition-colors"
					>
						<Pencil size={14} />
					</button>
					<button
						onClick={() => setConfirm(true)}
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-[var(--err)] bg-transparent border-0 cursor-pointer transition-colors"
					>
						<Trash2 size={14} />
					</button>
				</div>
			</div>

			<AnimatedCollapse open={open}>
				<div
					ref={setNodeRef}
					className={cn(
						"border-t border-[rgba(71,71,71,0.06)] min-h-[48px] transition-colors duration-150",
						isOver && "bg-[rgba(0,76,237,0.06)]",
					)}
					style={{
						borderLeft: `3px solid ${isOver ? mod.color : mod.color + "22"}`,
					}}
				>
					{features.length === 0 && !isOver ? (
						<EmptyState message="Glissez des fonctionnalités ici ou cliquez + pour en ajouter." />
					) : (
						features.map((f) => (
							<DraggableFeatureRow
								key={f.id}
								feature={f}
								projectId={projectId}
								isOpen={openRow === f.id}
								onToggle={() => onToggleRow(f.id)}
								moduleColor={mod.color}
							/>
						))
					)}
				</div>
			</AnimatedCollapse>

			<ConfirmDialog
				open={confirm}
				onClose={() => setConfirm(false)}
				title="Supprimer le module"
				message={`Supprimer « ${mod.name} » ? Les fonctionnalités seront conservées mais déliées du module.`}
				onConfirm={() => deleteModule(projectId, mod.id)}
			/>
		</div>
	);
}
