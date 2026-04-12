"use client";
import { useEffect, useState } from "react";
import { Btn, Field, Input, Modal } from "@/components/ui";
import { type Sprint, useStore } from "@/lib/store";

interface Props {
	projectId: string;
	sprint?: Sprint;
	open: boolean;
	onClose: () => void;
}

export function SprintModal({ projectId, sprint, open, onClose }: Props) {
	const { addSprint, updateSprint, currentProject } = useStore();
	const project = currentProject();
	const [form, setForm] = useState({ name: "", start: "", end: "", goal: "" });
	const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	useEffect(() => {
		if (sprint) {
			setForm({
				name: sprint.name,
				start: sprint.start,
				end: sprint.end,
				goal: sprint.goal,
			});
		} else {
			// Auto-increment sprint name
			const count = (project?.sprints?.length ?? 0) + 1;
			setForm({ name: `Sprint ${count}`, start: "", end: "", goal: "" });
		}
	}, [sprint, open, project?.sprints?.length]);

	function handleSave() {
		const name =
			form.name.trim() || `Sprint ${(project?.sprints?.length ?? 0) + 1}`;
		if (sprint) updateSprint(projectId, sprint.id, { ...form, name });
		else addSprint(projectId, { ...form, name, taskIds: [] });
		onClose();
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={sprint ? "Modifier le sprint" : "Nouveau sprint"}
			footer={
				<>
					<Btn variant="secondary" onClick={onClose}>
						Annuler
					</Btn>
					<Btn variant="primary" onClick={handleSave}>
						Enregistrer
					</Btn>
				</>
			}
		>
			<Field label="Nom">
				<Input
					value={form.name}
					onChange={(e) => set("name", e.target.value)}
					placeholder="Sprint 1"
					autoFocus
				/>
			</Field>
			<Field label="Objectif">
				<Input
					value={form.goal}
					onChange={(e) => set("goal", e.target.value)}
					placeholder="Livrer l'auth et le dashboard"
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
			<Field label="Date de fin">
				<Input
					type="date"
					value={form.end}
					onChange={(e) => set("end", e.target.value)}
					style={{ colorScheme: "dark" }}
				/>
			</Field>
		</Modal>
	);
}
