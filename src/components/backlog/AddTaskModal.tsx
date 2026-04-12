"use client";
import { useState } from "react";
import { Btn, Field, Input, Modal, Select } from "@/components/ui";
import { type Feature, useStore } from "@/lib/store";

interface Props {
	projectId: string;
	open: boolean;
	onClose: () => void;
}

const EMPTY = { name: "", status: "todo", days: "", priority: "p2" };

export function AddTaskModal({ projectId, open, onClose }: Props) {
	const { addFeature } = useStore();
	const [form, setForm] = useState(EMPTY);
	const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	function handleSave() {
		if (!form.name.trim()) return;
		addFeature(projectId, {
			name: form.name,
			status: form.status as Feature["status"],
			priority: form.priority as Feature["priority"],
			days: parseFloat(form.days) || 2,
			start: "",
			spec: "",
			moduleId: "",
			dependsOn: [],
			sortOrder: 0,
			sprintId: "",
		});
		setForm(EMPTY);
		onClose();
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Nouvelle tâche"
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
					placeholder="Nom de la tâche"
					autoFocus
				/>
			</Field>
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
					placeholder="2"
					min={0.5}
					step={0.5}
				/>
			</Field>
		</Modal>
	);
}
