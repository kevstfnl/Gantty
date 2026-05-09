"use client";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { ArrowRight, Download, Layers, Plus } from "lucide-react";
import { useState } from "react";
import { AddFeatureModal } from "@/components/breakdown/AddFeatureModal";
import { DraggableFeatureRow } from "@/components/breakdown/DraggableFeatureRow";
import { FeatureRow } from "@/components/breakdown/FeatureRow";
import { ModuleGroup } from "@/components/breakdown/ModuleGroup";
import { ModuleModal } from "@/components/breakdown/ModuleModal";
import { ProjectDatesBar } from "@/components/breakdown/ProjectDatesBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Btn, PageHeader, ExportModal } from "@/components/ui";
import { type Feature, type Module, useStore } from "@/lib/store";
import { exportBreakdown } from "@/lib/export/breakdown";
import { exportSpecs } from "@/lib/export/specs";

const COL_HEAD =
	"grid grid-cols-[40px_1fr_130px_100px_72px_44px] px-5 py-3 text-[10px] font-black tracking-widest uppercase text-[var(--dim)] border-b border-[rgba(71,71,71,0.15)]";

function OrphanZone({
	features,
	projectId,
	openRow,
	onToggle,
}: {
	features: Feature[];
	projectId: string;
	openRow: string | null;
	onToggle: (id: string) => void;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: "module:none" });
	return (
		<div
			ref={setNodeRef}
			className={`border-t border-[rgba(71,71,71,0.1)] min-h-[48px] transition-colors ${isOver ? "bg-[rgba(255,255,255,0.03)]" : ""}`}
		>
			<div className="px-5 py-2.5 bg-[var(--s2)]">
				<span className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)]">
					Sans module
				</span>
			</div>
			{features.map((f) => (
				<DraggableFeatureRow
					key={f.id}
					feature={f}
					projectId={projectId}
					isOpen={openRow === f.id}
					onToggle={() => onToggle(f.id)}
					indent={false}
				/>
			))}
			{features.length === 0 && isOver && (
				<EmptyState message="Déposez ici pour retirer du module." />
			)}
		</div>
	);
}

export default function Breakdown() {
	const {
		currentProject,
		setCurrentView,
		syncTasksFromFeatures,
		updateFeature,
	} = useStore();
	const project = currentProject();

	const [openRow, setOpenRow] = useState<string | null>(null);
	const [featModal, setFeatModal] = useState(false);
	const [moduleModal, setModuleModal] = useState(false);
	const [editModule, setEditModule] = useState<Module | undefined>();
	const [defModuleId, setDefModuleId] = useState("");
	const [dragging, setDragging] = useState<Feature | null>(null);
	const [exportModal, setExportModal] = useState<"breakdown" | "specs" | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	);

	if (!project)
		return (
			<div className="p-10 text-[var(--dim)]">Sélectionnez un projet.</div>
		);

	const modules = project.modules ?? [];
	const orphans = project.features.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);

	function handleDragEnd({ active, over }: DragEndEvent) {
		setDragging(null);
		if (!over) return;
		const featureId = String(active.id);
		const dropTarget = String(over.id); // "module:<id>" or "module:none"
		const newModuleId = dropTarget.startsWith("module:")
			? dropTarget.slice(7) === "none"
				? ""
				: dropTarget.slice(7)
			: null;
		if (newModuleId !== null)
			updateFeature(project!.id, featureId, { moduleId: newModuleId });
	}

	function openAddFeature(moduleId = "") {
		setDefModuleId(moduleId);
		setFeatModal(true);
	}
	function openEditModule(mod: Module) {
		setEditModule(mod);
		setModuleModal(true);
	}

	return (
		<div className="p-8 overflow-auto h-full">
			<PageHeader
				title={project.name}
				sub="Découpage fonctionnel"
				action={
					<>
						<Btn
							variant="secondary"
							icon={<ArrowRight size={15} />}
							onClick={() => {
								syncTasksFromFeatures(project.id);
								setCurrentView("backlog");
							}}
						>
							→ Backlog
						</Btn>
						<Btn
							variant="secondary"
							icon={<Layers size={15} />}
							onClick={() => {
								setEditModule(undefined);
								setModuleModal(true);
							}}
						>
							Module
						</Btn>
						<Btn
							variant="primary"
							icon={<Plus size={15} />}
							onClick={() => openAddFeature()}
						>
							Fonctionnalité
						</Btn>
						<div className="flex gap-2">
							<Btn
								variant="secondary"
								icon={<Download size={15} />}
								onClick={() => setExportModal("breakdown")}
							>
								Découpage
							</Btn>
							<Btn
								variant="secondary"
								icon={<Download size={15} />}
								onClick={() => setExportModal("specs")}
							>
								Specs
							</Btn>
						</div>
					</>
				}
			/>

			<ProjectDatesBar project={project} />

			<DndContext
				sensors={sensors}
				onDragStart={({ active }) =>
					setDragging(project.features.find((f) => f.id === active.id) ?? null)
				}
				onDragEnd={handleDragEnd}
			>
				<div className="bg-[var(--s1)] border border-[rgba(71,71,71,0.1)]">
					<div className={COL_HEAD}>
						<div />
						<div>Fonctionnalité</div>
						<div className="text-center">Statut</div>
						<div className="text-center">Priorité</div>
						<div className="text-center">Jours</div>
						<div />
					</div>

					{modules.length === 0 && project.features.length === 0 ? (
						<EmptyState message="Créez un module puis ajoutez des fonctionnalités." />
					) : null}

					{modules.map((mod) => (
						<ModuleGroup
							key={mod.id}
							module={mod}
							features={project.features.filter((f) => f.moduleId === mod.id)}
							projectId={project.id}
							openRow={openRow}
							onToggleRow={(id) => setOpenRow(openRow === id ? null : id)}
							onEdit={openEditModule}
							onAddFeature={openAddFeature}
						/>
					))}

					{/* Orphan / no-module zone */}
					{(orphans.length > 0 || modules.length > 0) && (
						<OrphanZone
							features={orphans}
							projectId={project.id}
							openRow={openRow}
							onToggle={(id) => setOpenRow(openRow === id ? null : id)}
						/>
					)}
				</div>

				<DragOverlay>
					{dragging && (
						<div className="opacity-90 shadow-2xl">
							<FeatureRow
								feature={dragging}
								projectId={project.id}
								isOpen={false}
								onToggle={() => {}}
								indent={false}
							/>
						</div>
					)}
				</DragOverlay>
			</DndContext>

			<AddFeatureModal
				projectId={project.id}
				defaultModuleId={defModuleId}
				open={featModal}
				onClose={() => setFeatModal(false)}
			/>
			<ModuleModal
				projectId={project.id}
				module={editModule}
				open={moduleModal}
				onClose={() => setModuleModal(false)}
			/>

			{/* Export modals */}
			<ExportModal
				open={exportModal === "breakdown"}
				onClose={() => setExportModal(null)}
				title="Exporter le Découpage Fonctionnel"
				options={[
					{
						value: "md",
						label: "Markdown",
						description: "Document formaté lisible",
					},
					{
						value: "pdf",
						label: "PDF",
						description: "Document imprimable avec spécifications",
					},
				]}
				onExport={(format) => exportBreakdown(project, format as "md" | "pdf")}
			/>
			<ExportModal
				open={exportModal === "specs"}
				onClose={() => setExportModal(null)}
				title="Exporter les Spécifications"
				options={[
					{
						value: "md",
						label: "Markdown",
						description: "Document formaté lisible",
					},
					{
						value: "pdf",
						label: "PDF",
						description: "Document imprimable détaillé",
					},
					{
						value: "json",
						label: "JSON",
						description: "Format de données pour intégration",
					},
				]}
				onExport={(format) => exportSpecs(project, format as "md" | "pdf" | "json")}
			/>
		</div>
	);
}
