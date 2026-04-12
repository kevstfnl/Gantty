"use client";
import { useDraggable } from "@dnd-kit/core";
import type { Feature } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FeatureRow } from "./FeatureRow";

interface Props {
	feature: Feature;
	projectId: string;
	isOpen: boolean;
	onToggle: () => void;
	moduleColor?: string;
	indent?: boolean;
}

export function DraggableFeatureRow({ feature, ...rest }: Props) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: feature.id,
	});

	return (
		<div
			ref={setNodeRef}
			className={cn("transition-opacity", isDragging && "opacity-30")}
		>
			{/* Drag handle — small grip area on the left */}
			<div className="relative">
				<div
					{...listeners}
					{...attributes}
					className="absolute left-0 top-0 bottom-0 w-5 z-10 cursor-grab flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
					title="Déplacer"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex flex-col gap-[3px]">
						<div className="w-2.5 h-[2px] bg-[var(--dim)] rounded" />
						<div className="w-2.5 h-[2px] bg-[var(--dim)] rounded" />
						<div className="w-2.5 h-[2px] bg-[var(--dim)] rounded" />
					</div>
				</div>
				<FeatureRow feature={feature} {...rest} />
			</div>
		</div>
	);
}
