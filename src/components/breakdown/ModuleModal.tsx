"use client";
import { useEffect, useState } from "react";
import { Btn, Field, Input, Modal } from "@/components/ui";
import { type Module, useStore } from "@/lib/store";
import { MODULE_COLORS } from "./moduleColors";

interface Props {
	projectId: string;
	module?: Module;
	open: boolean;
	onClose: () => void;
}

const EMPTY = { name: "", color: "#004ced", description: "" };

export function ModuleModal({ projectId, module: mod, open, onClose }: Props) {
	const { addModule, updateModule } = useStore();
	const [form, setForm] = useState(EMPTY);
	const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	useEffect(() => {
		setForm(
			mod
				? { name: mod.name, color: mod.color, description: mod.description }
				: EMPTY,
		);
	}, [mod, open]);

	function handleSave() {
		if (!form.name.trim()) return;
		if (mod) updateModule(projectId, mod.id, form);
		else addModule(projectId, form);
		onClose();
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={mod ? "Modifier le module" : "Nouveau module"}
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
					placeholder="ex: Authentification"
					autoFocus
				/>
			</Field>
			<Field label="Description">
				<Input
					value={form.description}
					onChange={(e) => set("description", e.target.value)}
					placeholder="Courte description du module"
				/>
			</Field>
			<Field label="Couleur">
				<div className="flex gap-2 flex-wrap mt-1">
					{MODULE_COLORS.map((c) => (
						<button
							key={c.value}
							onClick={() => set("color", c.value)}
							title={c.label}
							className="w-7 h-7 rounded-none border-2 cursor-pointer transition-transform hover:scale-110"
							style={{
								background: c.value,
								borderColor: form.color === c.value ? "white" : "transparent",
							}}
						/>
					))}
				</div>
			</Field>
		</Modal>
	);
}
