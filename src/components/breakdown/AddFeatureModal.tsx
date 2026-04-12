"use client";
import { useState } from "react";
import { Btn, Field, Input, Modal, Select } from "@/components/ui";
import { type Feature, useStore } from "@/lib/store";

interface Props {
	projectId: string;
	defaultModuleId?: string;
	open: boolean;
	onClose: () => void;
}

const EMPTY = {
	name: "",
	status: "todo",
	priority: "p1",
	days: "",
	start: "",
	moduleId: "",
};

export function AddFeatureModal({
	projectId,
	defaultModuleId = "",
	open,
	onClose,
}: Props) {
	const { addFeature, currentProject } = useStore();
	const project = currentProject();
	const [form, setForm] = useState({ ...EMPTY, moduleId: defaultModuleId });
	const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	function handleSave() {
		if (!form.name.trim()) return;
		addFeature(projectId, {
			name: form.name,
			status: form.status as Feature["status"],
			priority: form.priority as Feature["priority"],
			days: parseFloat(form.days) || 3,
			start: form.start,
			spec: "",
			dependsOn: [],
			sortOrder: 0,
			sprintId: "",
			moduleId: form.moduleId,
		});
		setForm({ ...EMPTY, moduleId: defaultModuleId });
		onClose();
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Nouvelle fonctionnalité"
			footer={
				<>
					<Btn variant="secondary" onClick={onClose}>
						Annuler
					</Btn>
					<Btn variant="primary" onClick={handleSave}>
						Ajouter
					</Btn>
				</>
			}
		>
			<Field label="Nom">
				<Input
					value={form.name}
					onChange={(e) => set("name", e.target.value)}
					placeholder="ex: Création de compte"
					autoFocus
				/>
			</Field>
			{(project?.modules ?? []).length > 0 && !defaultModuleId && (
				<Field label="Module">
					<Select
						value={form.moduleId}
						onChange={(e) => set("moduleId", e.target.value)}
					>
						<option value="">— Sans module</option>
						{(project?.modules ?? []).map((m) => (
							<option key={m.id} value={m.id}>
								{m.name}
							</option>
						))}
					</Select>
				</Field>
			)}
			{defaultModuleId &&
				(project?.modules ?? []).find((m) => m.id === defaultModuleId) && (
					<div className="mb-5 flex items-center gap-2">
						<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)]">
							Module
						</div>
						<div className="flex items-center gap-2 ml-2">
							<div
								className="w-2 h-2 rounded-full"
								style={{
									background: (project?.modules ?? []).find(
										(m) => m.id === defaultModuleId,
									)?.color,
								}}
							/>
							<span className="text-[13px] font-semibold text-[var(--muted)]">
								{
									(project?.modules ?? []).find((m) => m.id === defaultModuleId)
										?.name
								}
							</span>
						</div>
					</div>
				)}
			<Field label="Statut">
				<Select
					value={form.status}
					onChange={(e) => set("status", e.target.value)}
				>
					<option value="todo">À faire</option>
					<option value="progress">En cours</option>
					<option value="done">Terminé</option>
				</Select>
			</Field>
			<Field label="Priorité">
				<Select
					value={form.priority}
					onChange={(e) => set("priority", e.target.value)}
				>
					<option value="p1">P1 — Critique</option>
					<option value="p2">P2 — Important</option>
					<option value="p3">P3 — Faible</option>
				</Select>
			</Field>
			<Field label="Estimation (jours)">
				<Input
					type="number"
					value={form.days}
					onChange={(e) => set("days", e.target.value)}
					placeholder="3"
					min={0.5}
					step={0.5}
				/>
			</Field>
			<Field label="Date de début">
				<Input
					type="date"
					value={form.start}
					onChange={(e) => set("start", e.target.value)}
					style={{ colorScheme: "dark" }}
				/>
			</Field>
		</Modal>
	);
}
