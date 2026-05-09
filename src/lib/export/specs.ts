import { type Project } from "@/lib/store";
import {
	formatters,
	sanitizeFilename,
	downloadMarkdown,
	downloadJSON,
} from "./common";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

export function generateSpecsMarkdown(project: Project): string {
	const modules = project.modules ?? [];
	const featuresWithSpecs = project.features.filter((f) => f.spec);

	let markdown = `# ${project.name} - Spécifications Fonctionnelles\n\n`;

	if (project.start || project.end) {
		markdown += `**Période**: ${formatters.date(project.start)} → ${formatters.date(project.end)}\n\n`;
	}

	if (featuresWithSpecs.length === 0) {
		markdown += "Aucune spécification définie.\n";
		return markdown;
	}

	// Group by module
	for (const mod of modules) {
		const specs = featuresWithSpecs.filter((f) => f.moduleId === mod.id);
		if (specs.length === 0) continue;

		markdown += `## ${mod.name}\n`;
		if (mod.description) markdown += `${mod.description}\n\n`;

		for (const f of specs) {
			markdown += `### ${f.name}\n`;
			markdown += `**Statut**: ${formatters.status(f.status)} | **Priorité**: ${formatters.priority(f.priority)} | **Jours**: ${f.days}\n\n`;
			markdown += `${f.spec}\n\n`;
		}
	}

	// Orphans
	const orphanSpecs = featuresWithSpecs.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphanSpecs.length > 0) {
		markdown += `## Sans Module\n\n`;
		for (const f of orphanSpecs) {
			markdown += `### ${f.name}\n`;
			markdown += `**Statut**: ${formatters.status(f.status)} | **Priorité**: ${formatters.priority(f.priority)} | **Jours**: ${f.days}\n\n`;
			markdown += `${f.spec}\n\n`;
		}
	}

	return markdown;
}

export function generateSpecsJSON(project: Project): string {
	const featuresWithSpecs = project.features.filter((f) => f.spec);
	const data = {
		project: {
			id: project.id,
			name: project.name,
			start: project.start,
			end: project.end,
		},
		specifications: featuresWithSpecs.map((f) => ({
			id: f.id,
			name: f.name,
			status: f.status,
			priority: f.priority,
			days: f.days,
			moduleId: f.moduleId,
			sprintId: f.sprintId,
			spec: f.spec,
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

export async function generateSpecsPDF(project: Project): Promise<void> {
	const doc = new jsPDF();
	const modules = project.modules ?? [];
	const featuresWithSpecs = project.features.filter((f) => f.spec);
	let yPosition = 10;
	const pageWidth = doc.internal.pageSize.getWidth();

	// Header - Same theme as Backlog (blue)
	doc.setFillColor(0, 82, 195);
	doc.rect(0, 0, pageWidth, 35, "F");

	doc.setFontSize(24);
	doc.setTextColor(255, 255, 255);
	doc.text(project.name, 15, 20);

	doc.setFontSize(11);
	doc.setTextColor(200, 220, 255);
	doc.text("Spécifications Fonctionnelles", 15, 30);

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
	doc.setFontSize(10);
	doc.setTextColor(50, 50, 50);
	doc.text(`${featuresWithSpecs.length} fonctionnalités spécifiées`, 15, yPosition);
	yPosition += 8;

	if (featuresWithSpecs.length === 0) {
		doc.setFontSize(11);
		doc.setTextColor(100, 100, 100);
		doc.text("Aucune spécification définie.", 15, yPosition);
		const filename = `${sanitizeFilename(project.name)}_specs_${new Date().toISOString().split("T")[0]}.pdf`;
		doc.save(filename);
		return;
	}

	// Group by module
	for (const mod of modules) {
		const specs = featuresWithSpecs.filter((f) => f.moduleId === mod.id);
		if (specs.length === 0) continue;

		// Check page break
		if (yPosition > 250) {
			doc.addPage();
			yPosition = 15;
		}

		// Module header + description (will merge with table)
		doc.setFillColor(0, 82, 195);
		const boxStartY = yPosition;
		let headerHeight = 12;

		doc.rect(15, yPosition - 2, pageWidth - 30, headerHeight, "F");

		doc.setFontSize(10);
		doc.setTextColor(255, 255, 255);
		doc.setFont("Helvetica", "bold");
		doc.text(mod.name, 18, yPosition + 3);
		doc.setFont("Helvetica", "normal");

		doc.setFontSize(7);
		doc.setTextColor(200, 220, 255);
		doc.text(`${specs.length} spec(s)`, pageWidth - 65, yPosition + 3);

		yPosition += headerHeight;

		// Module description - inside the module box
		if (mod.description) {
			doc.setFillColor(245, 248, 255);
			doc.setFontSize(6);
			doc.setTextColor(80, 80, 80);
			const descLines = doc.splitTextToSize(mod.description, pageWidth - 36);
			const descHeight = descLines.length * 2.8 + 3;
			doc.rect(15, yPosition, pageWidth - 30, descHeight, "F");
			doc.text(descLines, 18, yPosition + 2);
			yPosition += descHeight;
		}

		// Specifications table - Fused with module block
		const tableData: (string | number)[][] = [];
		for (const f of specs) {
			tableData.push([
				f.name,
				f.spec,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days.toString(),
			]);
		}

		// Draw table with same width as module box - overlap slightly to fuse with header
		autoTable(doc, {
			startY: yPosition - 2,
			head: [["Fonctionnalité", "Spécification", "Statut", "Priorité", "J"]],
			body: tableData,
			margin: { left: 15, right: 15, top: 0 },
			columnStyles: {
				0: { cellWidth: 35, fontStyle: "bold" },
				1: { cellWidth: 100, overflow: "linebreak" },
				2: { cellWidth: 20, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
				4: { cellWidth: 10, halign: "center" },
			},
			headStyles: {
				fillColor: [0, 82, 195],
				textColor: 255,
				fontStyle: "bold",
				fontSize: 7,
				cellPadding: 1.5,
			},
			bodyStyles: {
				fontSize: 6,
				cellPadding: 1.5,
				valign: "top",
			},
			alternateRowStyles: {
				fillColor: [245, 248, 255] as [number, number, number],
			},
			didDrawPage: (data) => {
				if (data.cursor) yPosition = data.cursor.y + 2;
			},
		});

		// Draw border around entire module block
		doc.setDrawColor(0, 82, 195);
		doc.setLineWidth(0.2);
		doc.rect(15, boxStartY - 2, pageWidth - 30, yPosition - boxStartY + 2);

		yPosition += 4;
	}

	// Orphans
	const orphanSpecs = featuresWithSpecs.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphanSpecs.length > 0) {
		if (yPosition > 250) {
			doc.addPage();
			yPosition = 15;
		}

		// Section header - Compact
		doc.setFillColor(0, 82, 195);
		const boxStartY = yPosition;
		let headerHeight = 12;

		doc.rect(15, yPosition - 2, pageWidth - 30, headerHeight, "F");

		doc.setFontSize(10);
		doc.setTextColor(255, 255, 255);
		doc.setFont("Helvetica", "bold");
		doc.text("Non Assigné", 18, yPosition + 3);
		doc.setFont("Helvetica", "normal");

		doc.setFontSize(7);
		doc.setTextColor(200, 220, 255);
		doc.text(`${orphanSpecs.length} spec(s)`, pageWidth - 65, yPosition + 3);

		yPosition += headerHeight;

		// Orphans specifications table
		const orphanTableData: (string | number)[][] = [];
		for (const f of orphanSpecs) {
			orphanTableData.push([
				f.name,
				f.spec,
				formatters.status(f.status),
				formatters.priority(f.priority),
				f.days.toString(),
			]);
		}

		// Overlap slightly to fuse with header
		autoTable(doc, {
			startY: yPosition - 2,
			head: [["Fonctionnalité", "Spécification", "Statut", "Priorité", "J"]],
			body: orphanTableData,
			margin: { left: 15, right: 15, top: 0 },
			columnStyles: {
				0: { cellWidth: 35, fontStyle: "bold" },
				1: { cellWidth: 100, overflow: "linebreak" },
				2: { cellWidth: 20, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
				4: { cellWidth: 10, halign: "center" },
			},
			headStyles: {
				fillColor: [0, 82, 195],
				textColor: 255,
				fontStyle: "bold",
				fontSize: 7,
				cellPadding: 1.5,
			},
			bodyStyles: {
				fontSize: 6,
				cellPadding: 1.5,
				valign: "top",
			},
			alternateRowStyles: {
				fillColor: [245, 248, 255] as [number, number, number],
			},
			didDrawPage: (data) => {
				if (data.cursor) yPosition = data.cursor.y + 2;
			},
		});

		// Draw border around entire section block
		doc.setDrawColor(0, 82, 195);
		doc.setLineWidth(0.2);
		doc.rect(15, boxStartY - 2, pageWidth - 30, yPosition - boxStartY + 2);
	}

	const filename = `${sanitizeFilename(project.name)}_specs_${new Date().toISOString().split("T")[0]}.pdf`;
	doc.save(filename);
}

export function exportSpecs(
	project: Project,
	format: "md" | "pdf" | "json",
): void {
	const filename = `${sanitizeFilename(project.name)}_specs_${new Date().toISOString().split("T")[0]}`;

	if (format === "md") {
		const markdown = generateSpecsMarkdown(project);
		downloadMarkdown(markdown, filename + ".md");
	} else if (format === "pdf") {
		generateSpecsPDF(project);
	} else if (format === "json") {
		const json = generateSpecsJSON(project);
		downloadJSON(JSON.parse(json), filename + ".json");
	}
}
