import type { Schedule } from "@/lib/store";
import type { DayHeader } from "./ganttUtils";

interface Props {
	days: DayHeader[];
	dayW: number;
	// Legacy compat — ignored if days provided
	totalDays?: number;
	projectStart?: string;
	schedule?: Schedule;
}

export function DayColumns({ days, dayW }: Props) {
	return (
		<>
			{days.map((d, i) => (
				<div
					key={i}
					className="absolute top-0 bottom-0 border-r border-[rgba(71,71,71,0.05)]"
					style={{
						left: i * dayW,
						width: dayW,
						background: d.isOff ? "rgba(255,255,255,0.022)" : undefined,
					}}
				/>
			))}
		</>
	);
}
