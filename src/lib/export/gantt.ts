import { type Project } from "@/lib/store";
import { sanitizeFilename, downloadJSON, downloadFile } from "./common";
import { dayOffset, daysBetween } from "@/lib/utils";

export function generateGanttJSON(project: Project): string {
	const sprints = project.sprints ?? [];
	const data = {
		project: {
			id: project.id,
			name: project.name,
			start: project.start,
			end: project.end,
		},
		sprints: sprints.map((s) => ({
			id: s.id,
			name: s.name,
			start: s.start,
			end: s.end,
			goal: s.goal,
			taskCount: s.taskIds.length,
		})),
		features: project.features.map((f) => ({
			id: f.id,
			name: f.name,
			status: f.status,
			priority: f.priority,
			days: f.days,
			start: f.start,
			spec: f.spec || null,
			moduleId: f.moduleId,
			sprintId: f.sprintId,
			dependsOn: f.dependsOn,
		})),
		modules: (project.modules ?? []).map((m) => ({
			id: m.id,
			name: m.name,
			color: m.color,
			description: m.description,
		})),
	};

	return JSON.stringify(data, null, 2);
}


export function exportGanttAsJSON(project: Project): void {
	const json = generateGanttJSON(project);
	const filename = `${sanitizeFilename(project.name)}_gantt_${new Date().toISOString().split("T")[0]}.json`;
	downloadJSON(JSON.parse(json), filename);
}

export function exportGantt(
	project: Project,
	format: "json",
): void {
	if (format === "json") {
		exportGanttAsJSON(project);
	}
}

export function generateGanttSVG(project: Project): string {
	if (!project.start || !project.end) return "";

	const sprints = project.sprints ?? [];
	const modules = project.modules ?? [];
	const totalDays = daysBetween(project.start, project.end);

	// SVG dimensions
	const rowHeight = 40;
	const colWidth = 20;
	const labelWidth = 250;
	const headerHeight = 80;
	const dayLabelHeight = 40;
	const contentHeight = (project.features.length + 2) * rowHeight;
	const svgWidth = labelWidth + totalDays * colWidth + 50;
	const svgHeight = headerHeight + dayLabelHeight + contentHeight + 50;

	// Module colors
	const moduleColors: Record<string, string> = {};
	modules.forEach((m) => {
		moduleColors[m.id] = m.color || "#004ced";
	});

	// Generate dates
	const dates: string[] = [];
	for (let i = 0; i < totalDays; i++) {
		const date = new Date(project.start);
		date.setDate(date.getDate() + i);
		dates.push(date.toISOString().split("T")[0]);
	}

	// Generate rows
	const rows = [...project.features].sort(
		(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
	);

	// Status colors
	const statusColors: Record<string, string> = {
		todo: "#535353",
		progress: "#0052c3",
		done: "#28a050",
	};

	let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<style>
				text { font-family: Inter, sans-serif; }
				.header-text { font-weight: bold; font-size: 12px; }
				.day-text { font-size: 10px; }
				.feature-text { font-size: 11px; }
				.grid-line { stroke: #353535; stroke-width: 1; }
			</style>
		</defs>

		<!-- Background -->
		<rect width="${svgWidth}" height="${svgHeight}" fill="#131313"/>

		<!-- Title -->
		<text x="20" y="30" class="header-text" fill="#e2e2e2" font-size="16">${project.name}</text>
		<text x="20" y="50" fill="#919191" font-size="12">${project.start} → ${project.end}</text>

		<!-- Column headers - Days -->
		<line x1="${labelWidth}" y1="${headerHeight}" x2="${svgWidth - 20}" y2="${headerHeight}" class="grid-line"/>
		${dates
			.map(
				(date, i) => `
			<line x1="${labelWidth + i * colWidth}" y1="${headerHeight}" x2="${labelWidth + i * colWidth}" y2="${svgHeight - 20}" class="grid-line" opacity="0.3"/>
			${i % 5 === 0 ? `<text x="${labelWidth + i * colWidth + 2}" y="${headerHeight + 35}" class="day-text" fill="#919191">${date}</text>` : ""}
		`,
			)
			.join("")}

		<!-- Features -->
		${rows
			.map((feature, idx) => {
				const y = headerHeight + dayLabelHeight + idx * rowHeight + rowHeight / 2;
				const start = dayOffset(project.start, feature.start);
				const barWidth = Math.max(feature.days * colWidth, 30);
				const barColor = statusColors[feature.status] || "#535353";
				const moduleName = modules.find((m) => m.id === feature.moduleId)?.name || "—";

				return `
					<!-- Row divider -->
					<line x1="0" y1="${y + rowHeight / 2}" x2="${svgWidth}" y2="${y + rowHeight / 2}" class="grid-line" opacity="0.2"/>

					<!-- Feature label -->
					<text x="10" y="${y + 5}" class="feature-text" fill="#e2e2e2" dominant-baseline="middle">${feature.name}</text>
					<text x="10" y="${y + 18}" font-size="9" fill="#919191" dominant-baseline="middle">${moduleName}</text>

					<!-- Bar -->
					<rect x="${labelWidth + start * colWidth}" y="${y - 10}" width="${barWidth}" height="20" fill="${barColor}" opacity="0.8" rx="2"/>
					<text x="${labelWidth + start * colWidth + 5}" y="${y}" class="feature-text" fill="white" dominant-baseline="middle" font-size="9">${feature.days}j</text>
				`;
			})
			.join("")}

		<!-- Legend -->
		<g>
			<text x="20" y="${svgHeight - 25}" fill="#919191" font-size="10" font-weight="bold">Statut:</text>
			<rect x="80" y="${svgHeight - 35}" width="12" height="12" fill="#535353"/>
			<text x="95" y="${svgHeight - 25}" fill="#919191" font-size="9">À faire</text>

			<rect x="160" y="${svgHeight - 35}" width="12" height="12" fill="#0052c3"/>
			<text x="175" y="${svgHeight - 25}" fill="#919191" font-size="9">En cours</text>

			<rect x="260" y="${svgHeight - 35}" width="12" height="12" fill="#28a050"/>
			<text x="275" y="${svgHeight - 25}" fill="#919191" font-size="9">Terminé</text>
		</g>
	</svg>`;

	return svg;
}

export function exportGanttAsSVG(project: Project): void {
	const svg = generateGanttSVG(project);
	const filename = `${sanitizeFilename(project.name)}_gantt_${new Date().toISOString().split("T")[0]}.svg`;
	downloadFile(svg, filename, "image/svg+xml");
}
