import { getDay, parseISO } from "date-fns";
import type { DayHeader, MonthHeader } from "./ganttUtils";

export const MONTH_ROW_H = 26;
export const DAY_ROW_H = 36; // taller to fit letter + number
export const HEAD_H = MONTH_ROW_H + DAY_ROW_H; // 62px

const DOW_LETTER = ["D", "L", "M", "M", "J", "V", "S"];

interface Props {
	months: MonthHeader[];
	days: DayHeader[];
	dayW: number;
}

export function GanttHeader({ months, days, dayW }: Props) {
	return (
		<div
			className="flex flex-col sticky top-0 z-10 bg-[var(--bg)] border-b border-[rgba(71,71,71,0.2)]"
			style={{ height: HEAD_H }}
		>
			{/* Month row */}
			<div
				className="flex border-b border-[rgba(71,71,71,0.15)]"
				style={{ height: MONTH_ROW_H }}
			>
				{months.map((m, i) => (
					<div
						key={i}
						className="flex-shrink-0 flex items-center pl-3 text-[10px] font-black tracking-widest uppercase text-[var(--dim)] border-r border-[rgba(71,71,71,0.12)]"
						style={{ width: m.days * dayW }}
					>
						{m.label}
					</div>
				))}
			</div>

			{/* Day row — letter + number stacked */}
			<div className="flex" style={{ height: DAY_ROW_H }}>
				{days.map((d, i) => {
					const dow = getDay(parseISO(d.dateStr));
					const letter = dayW >= 18 ? DOW_LETTER[dow] : null;
					const num = dayW >= 18 ? d.dayNum : null;

					const textColor = d.isToday
						? "var(--blue)"
						: d.isOff
							? "rgba(255,255,255,0.15)"
							: "var(--dim)";

					return (
						<div
							key={i}
							className="flex-shrink-0 flex flex-col items-center justify-center border-r border-[rgba(71,71,71,0.06)] relative gap-0.5"
							style={{
								width: dayW,
								background: d.isToday
									? "rgba(0,76,237,0.15)"
									: d.isOff
										? "rgba(255,255,255,0.018)"
										: undefined,
							}}
						>
							{letter && (
								<span
									className="text-[8px] font-black tracking-widest uppercase leading-none select-none"
									style={{ color: textColor, opacity: 0.7 }}
								>
									{letter}
								</span>
							)}
							{num && (
								<span
									className="text-[10px] font-bold leading-none select-none"
									style={{ color: textColor }}
								>
									{num}
								</span>
							)}
							{d.isToday && (
								<div
									className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[var(--blue)]"
									style={{ height: 3 }}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
