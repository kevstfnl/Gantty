"use client";
import { useStore } from "@/lib/store";
import { ScheduleSection } from "./ScheduleSection";

interface Props {
	projectId: string;
	start: string;
	end: string;
}

const timeCls =
	"bg-[var(--s2)] border-0 border-b border-[rgba(71,71,71,0.3)] text-[var(--txt)] text-[16px] font-bold px-3 py-2 w-28 outline-none text-center focus:border-[var(--blue)] transition-colors";

export function WorkHours({ projectId, start, end }: Props) {
	const { updateSchedule } = useStore();

	return (
		<ScheduleSection title="Plage horaire">
			<div className="flex items-center gap-5">
				<span className="text-[12px] text-[var(--dim)] font-semibold">De</span>
				<input
					type="time"
					value={start}
					style={{ colorScheme: "dark" }}
					className={timeCls}
					onChange={(e) => updateSchedule(projectId, { start: e.target.value })}
				/>
				<span className="text-[12px] text-[var(--dim)] font-semibold">À</span>
				<input
					type="time"
					value={end}
					style={{ colorScheme: "dark" }}
					className={timeCls}
					onChange={(e) => updateSchedule(projectId, { end: e.target.value })}
				/>
			</div>
		</ScheduleSection>
	);
}
