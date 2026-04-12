"use client";
import { ChevronRight, Trash2 } from "lucide-react";
import { AnimatedCollapse } from "@/components/shared/AnimatedCollapse";
import { PriorityBadge, StatusBadge } from "@/components/ui";
import { type Feature, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FeatureSpecPanel } from "./FeatureSpecPanel";

interface Props {
	feature: Feature;
	projectId: string;
	isOpen: boolean;
	onToggle: () => void;
	moduleColor?: string;
	indent?: boolean;
}

export function FeatureRow({
	feature: f,
	projectId,
	isOpen,
	onToggle,
	moduleColor,
	indent = true,
}: Props) {
	const { deleteFeature } = useStore();

	return (
		<div className="border-b border-[rgba(71,71,71,0.06)] last:border-0">
			<div
				className={cn(
					"grid grid-cols-[40px_1fr_130px_100px_72px_44px] items-center py-4 cursor-pointer hover:bg-[var(--s2)] transition-colors duration-150",
					indent ? "px-5 pl-10" : "px-5",
				)}
				onClick={onToggle}
			>
				<div className="flex justify-center">
					<ChevronRight
						size={15}
						className={cn(
							"transition-transform duration-200",
							isOpen && "rotate-90",
						)}
						style={{
							color: isOpen ? (moduleColor ?? "var(--blue)") : "var(--dim)",
						}}
					/>
				</div>
				<div className="text-[14px] font-medium text-white">{f.name}</div>
				<div className="flex justify-center">
					<StatusBadge status={f.status} />
				</div>
				<div className="flex justify-center">
					<PriorityBadge priority={f.priority} />
				</div>
				<div className="text-center text-[13px] font-bold text-[var(--muted)]">
					{f.days || "—"}j
				</div>
				<div
					className="flex justify-center"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						onClick={() => deleteFeature(projectId, f.id)}
						className="w-10 h-10 flex items-center justify-center text-[var(--dim)] hover:text-[var(--err)] transition-colors bg-transparent border-0 cursor-pointer"
					>
						<Trash2 size={13} />
					</button>
				</div>
			</div>
			<AnimatedCollapse open={isOpen}>
				<FeatureSpecPanel feature={f} projectId={projectId} />
			</AnimatedCollapse>
		</div>
	);
}
