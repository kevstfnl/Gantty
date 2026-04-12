"use client";
import { useState } from "react";
import { Btn, Field, Input, Modal } from "@/components/ui";
import { useStore } from "@/lib/store";

interface Props {
	open: boolean;
	onClose: () => void;
}

const EMPTY = { name: "", desc: "", start: "", end: "" };

export function AddProjectModal({ open, onClose }: Props) {
	const { addProject, projects } = useStore();
	const [form, setForm] = useState(EMPTY);
	const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	function handleSave() {
		if (!form.name.trim()) return;
		addProject({
			name: form.name,
			desc: form.desc,
			tag: "PROJECT_" + String(projects.length + 1).padStart(2, "0"),
			start: form.start,
			end: form.end,
		});
		setForm(EMPTY);
		onClose();
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Nouveau projet"
			footer={
				<>
					<Btn variant="secondary" onClick={onClose}>
						Annuler
					</Btn>
					<Btn variant="primary" onClick={handleSave}>
						Créer
					</Btn>
				</>
			}
		>
			<Field label="Nom">
				<Input
					value={form.name}
					onChange={(e) => set("name", e.target.value)}
					placeholder="ex: Gantty"
					autoFocus
				/>
			</Field>
			<Field label="Description">
				<Input
					value={form.desc}
					onChange={(e) => set("desc", e.target.value)}
					placeholder="Courte description"
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
			<Field label="Date de fin estimée">
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
