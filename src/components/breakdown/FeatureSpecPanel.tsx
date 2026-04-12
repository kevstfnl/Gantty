"use client";
import { Textarea } from "@/components/ui";
import { type Feature, useStore } from "@/lib/store";

interface Props {
	feature: Feature;
	projectId: string;
}

const selectCls =
	"bg-[var(--s3)] border-0 text-[var(--txt)] text-[13px] px-3 py-2 outline-none cursor-pointer";

export function FeatureSpecPanel({ feature: f, projectId }: Props) {
	const { updateFeature, currentProject } = useStore();
	const project = currentProject();
	const upd = (data: Partial<Feature>) => updateFeature(projectId, f.id, data);

	return (
		<div className="bg-[var(--s2)] px-7 py-5 pl-14 border-t border-[rgba(71,71,71,0.1)]">
			<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
				Spécification fonctionnelle
			</div>
			<Textarea
				value={f.spec}
				onChange={(e) => upd({ spec: e.target.value })}
				placeholder="Comportement attendu, contraintes techniques, cas limites..."
			/>
			<div className="flex gap-6 mt-5 flex-wrap">
				{(project?.modules ?? []).length > 0 && (
					<div>
						<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
							Module
						</div>
						<select
							className={selectCls}
							value={f.moduleId ?? ""}
							onChange={(e) => upd({ moduleId: e.target.value })}
							style={{ colorScheme: "dark" }}
						>
							<option value="">— Sans module</option>
							{(project?.modules ?? []).map((m) => (
								<option key={m.id} value={m.id}>
									{m.name}
								</option>
							))}
						</select>
					</div>
				)}
				<div>
					<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
						Statut
					</div>
					<select
						className={selectCls}
						value={f.status}
						onChange={(e) =>
							upd({ status: e.target.value as Feature["status"] })
						}
						style={{ colorScheme: "dark" }}
					>
						<option value="todo">À faire</option>
						<option value="progress">En cours</option>
						<option value="done">Terminé</option>
					</select>
				</div>
				<div>
					<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
						Priorité
					</div>
					<select
						className={selectCls}
						value={f.priority}
						onChange={(e) =>
							upd({ priority: e.target.value as Feature["priority"] })
						}
						style={{ colorScheme: "dark" }}
					>
						<option value="p1">P1 — Critique</option>
						<option value="p2">P2 — Important</option>
						<option value="p3">P3 — Faible</option>
					</select>
				</div>
				<div>
					<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
						Jours estimés
					</div>
					<input
						type="number"
						value={f.days}
						min={0.5}
						step={0.5}
						onChange={(e) => upd({ days: parseFloat(e.target.value) || 0 })}
						className="w-20 bg-[var(--s3)] border-0 text-[var(--txt)] text-[13px] px-3 py-2 outline-none"
					/>
				</div>
				<div>
					<div className="text-[10px] font-black tracking-widest uppercase text-[var(--dim)] mb-2">
						Date début
					</div>
					<input
						type="date"
						value={f.start}
						onChange={(e) => upd({ start: e.target.value })}
						style={{ colorScheme: "dark" }}
						className="bg-[var(--s3)] border-0 text-[var(--txt)] text-[13px] px-3 py-2 outline-none"
					/>
				</div>
			</div>
		</div>
	);
}
