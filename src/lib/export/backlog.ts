import { type Project } from "@/lib/store";
import {
	formatters,
	sanitizeFilename,
	downloadCSV,
	downloadMarkdown,
} from "./common";
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
	let yPosition = 10;
	const pageWidth = doc.internal.pageSize.getWidth();

	// Helper function for progress bar
	const drawProgressBar = (doc: jsPDF, x: number, y: number, done: number, total: number) => {
		const barWidth = 60;
		const barHeight = 6;
		const percent = total > 0 ? (done / total) * 100 : 0;

		// Background
		doc.setDrawColor(220, 220, 220);
		doc.rect(x, y - 3, barWidth, barHeight);

		// Fill
		doc.setFillColor(0, 82, 195);
		doc.rect(x, y - 3, (barWidth * percent) / 100, barHeight, "F");

		// Text
		doc.setFontSize(8);
		doc.setTextColor(80, 80, 80);
		doc.text(`${percent.toFixed(0)}%`, x + barWidth + 5, y + 1);
	};

	// Header
	doc.setFillColor(0, 82, 195);
	doc.rect(0, 0, pageWidth, 35, "F");

	doc.setFontSize(24);
	doc.setTextColor(255, 255, 255);
	doc.text(project.name, 15, 20);

	doc.setFontSize(11);
	doc.setTextColor(200, 220, 255);
	doc.text("Backlog", 15, 30);

	yPosition = 45;

	// Summary stats
	const totalFeatures = project.features.length;
	const doneFeatures = project.features.filter((f) => f.status === "done").length;
	const totalDays = project.features.reduce((sum, f) => sum + f.days, 0);

	doc.setFontSize(10);
	doc.setTextColor(50, 50, 50);
	doc.text(`Total: ${totalFeatures} tâches | Complétées: ${doneFeatures} | Jours estimés: ${totalDays}j`, 15, yPosition);
	yPosition += 8;

	// Sprints
	for (const sprint of sprints) {
		const sprintFeatures = project.features.filter(
			(f) => f.sprintId === sprint.id || sprint.taskIds.includes(f.id),
		);
		const done = sprintFeatures.filter((f) => f.status === "done").length;
		const total = sprintFeatures.length;
		const sprintDays = sprintFeatures.reduce((sum, f) => sum + f.days, 0);

		if (total === 0) continue;

		// Check if we need a new page
		if (yPosition > 240) {
			doc.addPage();
			yPosition = 15;
		}

		// Sprint header box
		doc.setFillColor(240, 240, 245);
		doc.rect(15, yPosition - 3, pageWidth - 30, 20, "F");
		doc.setDrawColor(0, 82, 195);
		doc.setLineWidth(1);
		doc.rect(15, yPosition - 3, pageWidth - 30, 20);

		doc.setFontSize(12);
		doc.setTextColor(0, 82, 195);
		doc.text(sprint.name, 18, yPosition + 5);

		// Sprint stats
		doc.setFontSize(8);
		doc.setTextColor(100, 100, 100);
		const sprintInfo = sprint.start
			? `${formatters.date(sprint.start)} → ${formatters.date(sprint.end)}`
			: "";
		doc.text(sprintInfo, pageWidth - 100, yPosition + 5);

		yPosition += 22;

		// Sprint info line
		if (sprint.goal) {
			doc.setFontSize(9);
			doc.setTextColor(80, 80, 80);
			doc.text(`Objectif: ${sprint.goal}`, 18, yPosition);
			yPosition += 6;
		}

		// Progress bar
		doc.setFontSize(8);
		doc.setTextColor(80, 80, 80);
		doc.text(`Progression:`, 18, yPosition + 3);
		drawProgressBar(doc, 60, yPosition + 3, done, total);
		yPosition += 10;

		// Tasks table
		if (sprintFeatures.length > 0) {
			const tableData = sprintFeatures.map((f) => [
				f.name,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days.toString(),
			]);

			autoTable(doc, {
				startY: yPosition,
				head: [["Tâche", "Statut", "Priorité", "J"]],
				body: tableData,
				margin: { left: 15, right: 15 },
				columnStyles: {
					0: { cellWidth: 100 },
					1: { cellWidth: 35, halign: "center" },
					2: { cellWidth: 25, halign: "center" },
					3: { cellWidth: 15, halign: "center" },
				},
				headStyles: {
					fillColor: [0, 82, 195],
					textColor: 255,
					fontStyle: "bold",
					fontSize: 9,
				},
				bodyStyles: {
					fontSize: 8,
				},
				alternateRowStyles: {
					fillColor: [245, 245, 250],
				},
				didDrawPage: (data) => {
					if (data.cursor) yPosition = data.cursor.y + 5;
				},
			});
		}

		yPosition += 5;
	}

	// Orphans section
	const orphans = project.features.filter(
		(f) => !f.sprintId && !sprints.some((s) => s.taskIds.includes(f.id)),
	);
	if (orphans.length > 0) {
		if (yPosition > 240) {
			doc.addPage();
			yPosition = 15;
		}

		// Section header
		doc.setFillColor(240, 240, 245);
		doc.rect(15, yPosition - 3, pageWidth - 30, 20, "F");
		doc.setDrawColor(255, 100, 0);
		doc.setLineWidth(1);
		doc.rect(15, yPosition - 3, pageWidth - 30, 20);

		doc.setFontSize(12);
		doc.setTextColor(255, 100, 0);
		doc.text("Non Assigné", 18, yPosition + 5);

		yPosition += 22;

		const tableData = orphans.map((f) => [
			f.name,
			formatters.status(f.status),
			formatters.priority(f.priority),
			f.days.toString(),
		]);

		autoTable(doc, {
			startY: yPosition,
			head: [["Tâche", "Statut", "Priorité", "J"]],
			body: tableData,
			margin: { left: 15, right: 15 },
			columnStyles: {
				0: { cellWidth: 100 },
				1: { cellWidth: 35, halign: "center" },
				2: { cellWidth: 25, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
			},
			headStyles: {
				fillColor: [255, 100, 0],
				textColor: 255,
				fontStyle: "bold",
				fontSize: 9,
			},
			bodyStyles: {
				fontSize: 8,
			},
			alternateRowStyles: {
				fillColor: [245, 245, 250],
			},
		});
	}

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
