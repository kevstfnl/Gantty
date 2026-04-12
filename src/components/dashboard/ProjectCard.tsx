"use client";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProgressBar } from "@/components/ui";
import { type Project, useStore } from "@/lib/store";
import { getProgress } from "@/lib/utils";

interface Props {
	project: Project;
	onOpen: (id: string) => void;
}

export function ProjectCard({ project: p, onOpen }: Props) {
	const { deleteProject } = useStore();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const pct = getProgress(p.features);
	const done = p.features.filter((f) => f.status === "done").length;

	return (
		<>
			<div
				onClick={() => onOpen(p.id)}
				className="bg-[var(--s1)] p-7 cursor-pointer group hover:bg-[var(--s2)] transition-all duration-200 border border-[rgba(71,71,71,0.1)] relative"
			>
				<ArrowUpRight
					size={17}
					className="absolute top-5 right-5 text-[var(--outline)] group-hover:text-white transition-colors"
				/>

				{/* Delete button */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						setConfirmOpen(true);
					}}
					className="absolute bottom-5 right-5 w-8 h-8 flex items-center justify-center text-[var(--dim)] hover:text-[var(--err)] bg-transparent border-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
				>
					<Trash2 size={14} />
				</button>

				<div className="text-[10px] font-black tracking-[0.12em] uppercase text-[var(--blue)] bg-[var(--blue-bg)] px-2.5 py-1 inline-block mb-5">
					{p.tag}
				</div>
				<div className="text-[24px] font-black tracking-[-0.02em] text-white mb-2">
					{p.name}
				</div>
				<div className="text-[12px] text-[var(--muted)] leading-relaxed mb-6">
					{p.desc || "—"}
				</div>
				<ProgressBar value={pct} />
				<div className="flex gap-5 mt-5">
					<span className="text-[11px] text-[var(--dim)]">
						<strong className="text-[var(--muted)]">
							{done}/{p.features.length}
						</strong>{" "}
						fonctions
					</span>
					{p.start && (
						<span className="text-[11px] text-[var(--dim)]">
							<strong className="text-[var(--muted)]">
								{p.start.slice(0, 7)}
							</strong>
						</span>
					)}
					{p.end && (
						<span className="text-[11px] text-[var(--dim)]">
							→{" "}
							<strong className="text-[var(--muted)]">
								{p.end.slice(0, 7)}
							</strong>
						</span>
					)}
				</div>
			</div>

			<ConfirmDialog
				open={confirmOpen}
				title="Supprimer le projet"
				message={`Supprimer « ${p.name} » ? Cette action est irréversible et supprimera toutes les fonctionnalités et tâches associées.`}
				onConfirm={() => deleteProject(p.id)}
				onClose={() => setConfirmOpen(false)}
			/>
		</>
	);
}
