"use client";
import { useDroppable } from "@dnd-kit/core";
import type { Feature, Status } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";

interface Props {
	id: Status;
	label: string;
	color: string;
	features: Feature[];
	projectId: string;
}

export function KanbanColumn({ id, label, color, features, projectId }: Props) {
	const { setNodeRef, isOver } = useDroppable({ id });
	return (
		<div
			className={cn(
				"bg-[var(--s1)] flex flex-col border border-[rgba(71,71,71,0.1)] transition-colors",
				isOver && "border-[var(--blue)]",
			)}
		>
			<div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(71,71,71,0.1)]">
				<span
					className={cn(
						"text-[11px] font-black tracking-widest uppercase",
						color,
					)}
				>
					{label}
				</span>
				<span className="text-[10px] font-bold bg-[var(--s3)] text-[var(--dim)] px-2 py-1">
					{features.length}
				</span>
			</div>
			<div
				ref={setNodeRef}
				className="flex-1 overflow-y-auto p-3 min-h-[240px]"
			>
				{features.map((f) => (
					<TaskCard key={f.id} feature={f} projectId={projectId} />
				))}
			</div>
		</div>
	);
}
