"use client";
import { useStore } from "@/lib/store";
import { DayToggle } from "./DayToggle";
import { ScheduleSection } from "./ScheduleSection";

const DOW_MAP = [
	{ dow: 1, label: "Lu", num: 1 },
	{ dow: 2, label: "Ma", num: 2 },
	{ dow: 3, label: "Me", num: 3 },
	{ dow: 4, label: "Je", num: 4 },
	{ dow: 5, label: "Ve", num: 5 },
	{ dow: 6, label: "Sa", num: 6 },
	{ dow: 0, label: "Di", num: 7 },
];

interface Props {
	projectId: string;
	activeDays: number[];
}

export function WorkDays({ projectId, activeDays }: Props) {
	const { updateSchedule } = useStore();

	function toggle(dow: number) {
		const days = activeDays.includes(dow)
			? activeDays.filter((d) => d !== dow)
			: [...activeDays, dow];
		updateSchedule(projectId, { days });
	}

	return (
		<ScheduleSection title="Jours de travail">
			<div className="flex gap-3 flex-wrap">
				{DOW_MAP.map((d) => (
					<DayToggle
						key={d.dow}
						{...d}
						active={activeDays.includes(d.dow)}
						onToggle={() => toggle(d.dow)}
					/>
				))}
			</div>
		</ScheduleSection>
	);
}
