"use client";
import { useDraggable } from "@dnd-kit/core";
import { X } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/ui";
import { type Feature, type Status, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
	feature: Feature;
	projectId: string;
	overlay?: boolean;
}

export function TaskCard({ feature: f, projectId, overlay = false }: Props) {
	const { deleteFeature, updateFeature } = useStore();
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: f.id,
	});

	return (
		<div
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			className={cn(
				"bg-[var(--s2)] p-4 mb-2 border border-[rgba(71,71,71,0.1)] select-none transition-all",
				isDragging && !overlay ? "opacity-30 cursor-grabbing" : "cursor-grab",
				overlay && "shadow-2xl cursor-grabbing",
			)}
		>
			<div className="flex items-start justify-between gap-2 mb-3">
				<div className="text-[14px] font-semibold text-white leading-snug">
					{f.name}
				</div>
				{!overlay && (
					<button
						onPointerDown={(e) => e.stopPropagation()}
						onClick={(e) => {
							e.stopPropagation();
							deleteFeature(projectId, f.id);
						}}
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-[var(--err)] bg-transparent border-0 cursor-pointer flex-shrink-0"
					>
						<X size={13} />
					</button>
				)}
			</div>
			<div className="flex items-center gap-2 flex-wrap">
				<StatusBadge status={f.status} />
				<PriorityBadge priority={f.priority} />
				<span className="text-[10px] font-bold bg-[var(--s4)] text-[var(--dim)] px-2 py-1">
					{f.days}j
				</span>
			</div>
		</div>
	);
}
