"use client";
import { Trash2 } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/ui";
import { type Feature, type Sprint, useStore } from "@/lib/store";

interface Props {
	feature: Feature;
	projectId: string;
	sprints: Sprint[];
}

export function SprintTableRow({ feature: f, projectId, sprints }: Props) {
	const { updateFeature, deleteFeature, assignTaskToSprint } = useStore();

	return (
		<div className="grid grid-cols-[1fr_130px_90px_56px_160px_40px] items-center px-5 py-3.5 border-b border-[rgba(71,71,71,0.07)] hover:bg-[var(--s2)] transition-colors group">
			<div className="text-[13px] font-medium text-white">{f.name}</div>
			<div className="flex justify-center">
				<select
					value={f.status}
					onChange={(e) =>
						updateFeature(projectId, f.id, {
							status: e.target.value as Feature["status"],
						})
					}
					style={{ colorScheme: "dark" }}
					className="bg-transparent border-0 text-[11px] font-black tracking-widest uppercase outline-none cursor-pointer text-[var(--muted)]"
				>
					<option value="todo">À faire</option>
					<option value="progress">En cours</option>
					<option value="done">Terminé</option>
				</select>
			</div>
			<div className="flex justify-center">
				<PriorityBadge priority={f.priority} />
			</div>
			<div className="text-center text-[12px] font-bold text-[var(--muted)]">
				{f.days}j
			</div>
			<div className="flex justify-center">
				<select
					value={f.sprintId ?? ""}
					onChange={(e) =>
						assignTaskToSprint(projectId, f.id, e.target.value || null)
					}
					style={{ colorScheme: "dark" }}
					className="bg-[var(--s3)] border-0 text-[11px] px-2 py-1 outline-none cursor-pointer text-[var(--muted)] w-full"
				>
					<option value="">— Backlog</option>
					{sprints.map((s) => (
						<option key={s.id} value={s.id}>
							{s.name}
						</option>
					))}
				</select>
			</div>
			<div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
				<button
					onClick={() => deleteFeature(projectId, f.id)}
					className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-[var(--err)] bg-transparent border-0 cursor-pointer"
				>
					<Trash2 size={13} />
				</button>
			</div>
		</div>
	);
}
