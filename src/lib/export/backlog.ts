import { type Project } from "@/lib/store";
import {
	formatters,
	sanitizeFilename,
	downloadCSV,
	downloadMarkdown,
} from "./common";
import {
	addPdfFooters,
	buildSummaryStats,
	drawProgressBar,
	drawReportHeader,
	drawSectionHeader,
	drawSummaryStats,
	ensurePdfSpace,
	getPdfTableStyles,
	PDF_THEME,
} from "./pdfTheme";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

export function generateBacklogCSV(project: Project): (string | number)[][] {
	const sprints = project.sprints ?? [];
	const rows: (string | number)[][] = [];

	// Header
	rows.push(["Tâche", "Statut", "Priorité", "Jours", "Sprint", "Dépend de"]);

	// For each sprint
	for (const sprint of sprints) {
		const sprintFeatures = project.features.filter(
			(f) => f.sprintId === sprint.id || sprint.taskIds.includes(f.id),
		);
		for (const f of sprintFeatures) {
			const depNames = f.dependsOn
				.map((id) => project.features.find((feat) => feat.id === id)?.name)
				.filter(Boolean)
				.join(", ");
			rows.push([
				f.name,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days,
				sprint.name,
				depNames || "-",
			]);
		}
	}

	// Orphans (unassigned)
	const orphans = project.features.filter(
		(f) => !f.sprintId && !sprints.some((s) => s.taskIds.includes(f.id)),
	);
	for (const f of orphans) {
		const depNames = f.dependsOn
			.map((id) => project.features.find((feat) => feat.id === id)?.name)
			.filter(Boolean)
			.join(", ");
		rows.push([
			f.name,
			formatters.status(f.status),
			formatters.priority(f.priority),
			f.days,
			"Non assigné",
			depNames || "-",
		]);
	}

	return rows;
}

export function generateBacklogMarkdown(project: Project): string {
	const sprints = project.sprints ?? [];
	let markdown = `# ${project.name} - Backlog\n\n`;

	for (const sprint of sprints) {
		const sprintFeatures = project.features.filter(
			(f) => f.sprintId === sprint.id || sprint.taskIds.includes(f.id),
		);
		const done = sprintFeatures.filter((f) => f.status === "done").length;

		markdown += `## ${sprint.name}\n`;
		if (sprint.start || sprint.end) {
			markdown += `**Dates**: ${formatters.date(sprint.start)} → ${formatters.date(sprint.end)}\n`;
		}
		if (sprint.goal) {
			markdown += `**Objectif**: ${sprint.goal}\n`;
		}
		markdown += `**Progression**: ${done}/${sprintFeatures.length}\n\n`;

		if (sprintFeatures.length === 0) {
			markdown += "Aucune tâche.\n\n";
		} else {
			markdown += "| Tâche | Statut | Priorité | Jours |\n";
			markdown += "|---|---|---|---|\n";
			for (const f of sprintFeatures) {
				markdown += `| ${f.name} | ${formatters.status(f.status)} | ${formatters.priority(f.priority)} | ${f.days} |\n`;
			}
			markdown += "\n";
		}
	}

	// Orphans
	const orphans = project.features.filter(
		(f) => !f.sprintId && !sprints.some((s) => s.taskIds.includes(f.id)),
	);
	if (orphans.length > 0) {
		markdown += `## Backlog Non Assigné\n\n`;
		markdown += "| Tâche | Statut | Priorité | Jours |\n";
		markdown += "|---|---|---|---|\n";
		for (const f of orphans) {
			markdown += `| ${f.name} | ${formatters.status(f.status)} | ${formatters.priority(f.priority)} | ${f.days} |\n`;
		}
	}

	return markdown;
}

export async function generateBacklogPDF(project: Project): Promise<void> {
	const doc = new jsPDF();
	const sprints = project.sprints ?? [];
	let yPosition = drawReportHeader(doc, project.name, "Backlog fonctionnel");

	const totalFeatures = project.features.length;
	const doneFeatures = project.features.filter((f) => f.status === "done").length;
	const totalDays = project.features.reduce((sum, f) => sum + f.days, 0);
	const progress = totalFeatures > 0 ? (doneFeatures / totalFeatures) * 100 : 0;

	yPosition = drawSummaryStats(
		doc,
		yPosition,
		buildSummaryStats([
			{ label: "Tâches", value: String(totalFeatures) },
			{ label: "Complétées", value: `${doneFeatures}/${totalFeatures}`, percent: progress },
			{ label: "Charge", value: `${totalDays}j` },
			{ label: "Sprints", value: String(sprints.length) },
		]),
	);

	for (const sprint of sprints) {
		const sprintFeatures = project.features.filter(
			(f) => f.sprintId === sprint.id || sprint.taskIds.includes(f.id),
		);
		const done = sprintFeatures.filter((f) => f.status === "done").length;
		const total = sprintFeatures.length;
		const sprintDays = sprintFeatures.reduce((sum, f) => sum + f.days, 0);
		const sprintProgress = total > 0 ? Math.round((done / total) * 100) : 0;

		if (total === 0) continue;

		const sprintInfo = sprint.start
			? `${formatters.date(sprint.start)} - ${formatters.date(sprint.end)}`
			: "";
		yPosition = ensurePdfSpace(doc, yPosition, 40);
		yPosition = drawSectionHeader(
			doc,
			yPosition,
			sprint.name,
			[sprintInfo, `${total} tâches`, `${sprintDays}j`].filter(Boolean).join(" · "),
		);

		if (sprint.goal) {
			doc.setFontSize(9);
			doc.setTextColor(...PDF_THEME.colors.muted);
			const goalLines = doc.splitTextToSize(`Objectif : ${sprint.goal}`, 175);
			doc.text(goalLines, 18, yPosition);
			yPosition += goalLines.length * 4 + 3;
		}

		doc.setFontSize(7);
		doc.setTextColor(...PDF_THEME.colors.muted);
		doc.text(`Progression: ${done}/${total} (${sprintProgress}%)`, 18, yPosition + 2);
		drawProgressBar(doc, 68, yPosition + 2, 38, sprintProgress);
		yPosition += 10;

		if (sprintFeatures.length > 0) {
			const tableData = sprintFeatures.map((f) => [
				f.name,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days.toString(),
			]);

			autoTable(doc, {
				...getPdfTableStyles(),
				startY: yPosition,
				head: [["Tâche", "Statut", "Priorité", "J"]],
				body: tableData,
				margin: { left: PDF_THEME.margin, right: PDF_THEME.margin, bottom: PDF_THEME.footerHeight },
				columnStyles: {
					0: { cellWidth: 100 },
					1: { cellWidth: 35, halign: "center" },
					2: { cellWidth: 25, halign: "center" },
					3: { cellWidth: 15, halign: "center" },
				},
				didDrawPage: (data) => {
					if (data.cursor) yPosition = data.cursor.y + 6;
				},
			});
		}

		yPosition += 4;
	}

	const orphans = project.features.filter(
		(f) => !f.sprintId && !sprints.some((s) => s.taskIds.includes(f.id)),
	);
	if (orphans.length > 0) {
		yPosition = ensurePdfSpace(doc, yPosition, 35);
		yPosition = drawSectionHeader(doc, yPosition, "Non assigné", `${orphans.length} tâches`);

		const tableData = orphans.map((f) => [
			f.name,
			formatters.status(f.status),
			formatters.priority(f.priority),
			f.days.toString(),
		]);

		autoTable(doc, {
			...getPdfTableStyles(),
			startY: yPosition,
			head: [["Tâche", "Statut", "Priorité", "J"]],
			body: tableData,
			margin: { left: PDF_THEME.margin, right: PDF_THEME.margin, bottom: PDF_THEME.footerHeight },
			columnStyles: {
				0: { cellWidth: 100 },
				1: { cellWidth: 35, halign: "center" },
				2: { cellWidth: 25, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
			},
			didDrawPage: (data) => {
				if (data.cursor) yPosition = data.cursor.y + 6;
			},
		});
	}

	addPdfFooters(doc, "Backlog fonctionnel");
	const filename = `${sanitizeFilename(project.name)}_backlog_${new Date().toISOString().split("T")[0]}.pdf`;
	doc.save(filename);
}

export function exportBacklog(
	project: Project,
	format: "csv" | "md" | "pdf",
): void {
	const filename = `${sanitizeFilename(project.name)}_backlog_${new Date().toISOString().split("T")[0]}`;

	if (format === "csv") {
		const rows = generateBacklogCSV(project);
		downloadCSV(rows, filename + ".csv");
	} else if (format === "md") {
		const markdown = generateBacklogMarkdown(project);
		downloadMarkdown(markdown, filename + ".md");
	} else if (format === "pdf") {
		generateBacklogPDF(project);
	}
}
