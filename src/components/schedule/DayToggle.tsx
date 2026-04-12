"use client";
import { cn } from "@/lib/utils";

interface Props {
	dow: number;
	label: string;
	num: number;
	active: boolean;
	onToggle: () => void;
}

export function DayToggle({ label, num, active, onToggle }: Props) {
	return (
    <button
      type="button"
			onClick={onToggle}
			className={cn(
				"w-16 h-16 flex flex-col items-center justify-center border cursor-pointer transition-all rounded-none",
				active
					? "border-[var(--blue)] bg-[var(--blue-bg)] text-[var(--blue)]"
					: "border-[rgba(71,71,71,0.2)] bg-transparent text-[var(--dim)] hover:bg-[var(--s2)] hover:border-[var(--outline)]",
			)}
		>
			<span className="text-[20px] font-bold leading-none">{num}</span>
			<span className="text-[10px] font-black tracking-wider mt-1">
				{label}
			</span>
		</button>
	);
}
