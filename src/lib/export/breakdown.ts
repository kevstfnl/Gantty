import { type Project } from "@/lib/store";
import { formatters, sanitizeFilename, downloadMarkdown } from "./common";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

export function generateBreakdownMarkdown(project: Project): string {
	const modules = project.modules ?? [];
	let markdown = `# ${project.name} - Découpage Fonctionnel\n\n`;

	if (project.start || project.end) {
		markdown += `**Période**: ${formatters.date(project.start)} → ${formatters.date(project.end)}\n\n`;
	}

	for (const mod of modules) {
		const features = project.features.filter((f) => f.moduleId === mod.id);
		const done = features.filter((f) => f.status === "done").length;
		const total = features.length;
		const pct = total ? Math.round((done / total) * 100) : 0;
		const totalDays = features.reduce((s, f) => s + (f.days || 0), 0);

		markdown += `## ${mod.name}\n`;
		if (mod.description) {
			markdown += `${mod.description}\n\n`;
		}
		markdown += `**Progression**: ${done}/${total} (${pct}%) | **Estimé**: ${totalDays}j\n\n`;

		if (features.length === 0) {
			markdown += "Aucune fonctionnalité.\n\n";
		} else {
			markdown += "| Fonctionnalité | Statut | Priorité | Jours |\n";
			markdown += "|---|---|---|---|\n";
			for (const f of features) {
				markdown += `| ${f.name} | ${formatters.status(f.status)} | ${formatters.priority(f.priority)} | ${f.days} |\n`;
			}
			markdown += "\n";
		}
	}

	// Orphans
	const orphans = project.features.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphans.length > 0) {
		markdown += `## Sans Module\n`;
		markdown += "| Fonctionnalité | Statut | Priorité | Jours |\n";
		markdown += "|---|---|---|---|\n";
		for (const f of orphans) {
			markdown += `| ${f.name} | ${formatters.status(f.status)} | ${formatters.priority(f.priority)} | ${f.days} |\n`;
		}
	}

	return markdown;
}

export async function generateBreakdownPDF(project: Project): Promise<void> {
	const doc = new jsPDF();
	const modules = project.modules ?? [];
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
		doc.setFillColor(40, 160, 80);
		doc.rect(x, y - 3, (barWidth * percent) / 100, barHeight, "F");

		// Text
		doc.setFontSize(8);
		doc.setTextColor(80, 80, 80);
		doc.text(`${percent.toFixed(0)}%`, x + barWidth + 5, y + 1);
	};

	// Header
	doc.setFillColor(40, 160, 80);
	doc.rect(0, 0, pageWidth, 35, "F");

	doc.setFontSize(24);
	doc.setTextColor(255, 255, 255);
	doc.text(project.name, 15, 20);

	doc.setFontSize(11);
	doc.setTextColor(200, 255, 220);
	doc.text("Découpage Fonctionnel", 15, 30);

	yPosition = 45;

	// Date info
	if (project.start || project.end) {
		doc.setFontSize(9);
		doc.setTextColor(100, 100, 100);
		doc.text(
			`Période: ${formatters.date(project.start)} → ${formatters.date(project.end)}`,
			15,
			yPosition,
		);
		yPosition += 8;
	}

	// Summary
	const totalFeatures = project.features.length;
	const doneFeatures = project.features.filter((f) => f.status === "done").length;
	const totalDays = project.features.reduce((sum, f) => sum + f.days, 0);

	doc.setFontSize(10);
	doc.setTextColor(50, 50, 50);
	doc.text(`Total: ${totalFeatures} fonctionnalités | Complétées: ${doneFeatures} | Estimé: ${totalDays}j`, 15, yPosition);
	yPosition += 8;

	// Modules
	for (const mod of modules) {
		const features = project.features.filter((f) => f.moduleId === mod.id);
		if (features.length === 0) continue;

		const done = features.filter((f) => f.status === "done").length;
		const total = features.length;
		const modDays = features.reduce((s, f) => s + (f.days || 0), 0);

		// Check if we need a new page
		if (yPosition > 240) {
			doc.addPage();
			yPosition = 15;
		}

		// Module header box with color
		const modColorRGB = mod.color ? hexToRGB(mod.color) : [40, 160, 80] as [number, number, number];
		doc.setFillColor(modColorRGB[0], modColorRGB[1], modColorRGB[2]);
		doc.rect(15, yPosition - 3, pageWidth - 30, 20, "F");

		doc.setFontSize(12);
		doc.setTextColor(255, 255, 255);
		doc.text(mod.name, 18, yPosition + 5);

		// Stats on the right
		doc.setFontSize(8);
		doc.setTextColor(255, 255, 255);
		doc.text(`${total} fonctionnalités | ${modDays}j`, pageWidth - 70, yPosition + 5);

		yPosition += 22;

		// Module description
		if (mod.description) {
			doc.setFontSize(8);
			doc.setTextColor(80, 80, 80);
			const descLines = doc.splitTextToSize(mod.description, pageWidth - 30);
			doc.text(descLines, 18, yPosition);
			yPosition += descLines.length * 3.5 + 3;
		}

		// Progress bar
		doc.setFontSize(8);
		doc.setTextColor(80, 80, 80);
		doc.text(`Progression:`, 18, yPosition + 3);
		drawProgressBar(doc, 60, yPosition + 3, done, total);
		yPosition += 10;

		// Features table
		if (features.length > 0) {
			const tableData = features.map((f) => [
				f.name,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days.toString(),
			]);

			autoTable(doc, {
				startY: yPosition,
				head: [["Fonctionnalité", "Statut", "Priorité", "J"]],
				body: tableData,
				margin: { left: 15, right: 15 },
				columnStyles: {
					0: { cellWidth: 100 },
					1: { cellWidth: 35, halign: "center" },
					2: { cellWidth: 25, halign: "center" },
					3: { cellWidth: 15, halign: "center" },
				},
				headStyles: {
					fillColor: [modColorRGB[0], modColorRGB[1], modColorRGB[2]] as [number, number, number],
					textColor: 255,
					fontStyle: "bold",
					fontSize: 9,
				},
				bodyStyles: {
					fontSize: 8,
				},
				alternateRowStyles: {
					fillColor: [245, 245, 250] as [number, number, number],
				},
				didDrawPage: (data) => {
					if (data.cursor) yPosition = data.cursor.y + 5;
				},
			});
		}

		yPosition += 5;
	}

	// Orphans
	const orphans = project.features.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphans.length > 0) {
		if (yPosition > 240) {
			doc.addPage();
			yPosition = 15;
		}

		// Section header
		doc.setFillColor(180, 180, 180);
		doc.rect(15, yPosition - 3, pageWidth - 30, 20, "F");

		doc.setFontSize(12);
		doc.setTextColor(255, 255, 255);
		doc.text("Sans Module", 18, yPosition + 5);

		yPosition += 22;

		const tableData = orphans.map((f) => [
			f.name,
			formatters.status(f.status),
			formatters.priority(f.priority),
			f.days.toString(),
		]);

		autoTable(doc, {
			startY: yPosition,
			head: [["Fonctionnalité", "Statut", "Priorité", "J"]],
			body: tableData,
			margin: { left: 15, right: 15 },
			columnStyles: {
				0: { cellWidth: 100 },
				1: { cellWidth: 35, halign: "center" },
				2: { cellWidth: 25, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
			},
			headStyles: {
				fillColor: [180, 180, 180],
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

	const filename = `${sanitizeFilename(project.name)}_breakdown_${new Date().toISOString().split("T")[0]}.pdf`;
	doc.save(filename);
}

// Helper to convert hex color to RGB
function hexToRGB(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (result) {
		return [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16),
		];
	}
	return [40, 160, 80];
}

export function exportBreakdown(project: Project, format: "md" | "pdf"): void {
	if (format === "md") {
		const markdown = generateBreakdownMarkdown(project);
		const filename = `${sanitizeFilename(project.name)}_breakdown_${new Date().toISOString().split("T")[0]}.md`;
		downloadMarkdown(markdown, filename);
	} else if (format === "pdf") {
		generateBreakdownPDF(project);
	}
}
