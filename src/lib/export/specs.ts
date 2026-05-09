import { type Project } from "@/lib/store";
import {
	formatters,
	sanitizeFilename,
	downloadMarkdown,
	downloadJSON,
} from "./common";
import {
	addPdfFooters,
	buildSummaryStats,
	drawReportHeader,
	drawSectionHeader,
	drawSummaryStats,
	ensurePdfSpace,
	getPdfTableStyles,
	PDF_THEME,
} from "./pdfTheme";
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
	const pageWidth = doc.internal.pageSize.getWidth();
	let yPosition = drawReportHeader(
		doc,
		project.name,
		"Spécifications fonctionnelles",
		project.start || project.end
			? `${formatters.date(project.start)} - ${formatters.date(project.end)}`
			: undefined,
	);

	yPosition = drawSummaryStats(
		doc,
		yPosition,
		buildSummaryStats([
			{ label: "Spécifiées", value: String(featuresWithSpecs.length) },
			{ label: "Features", value: String(project.features.length) },
			{ label: "Modules", value: String(modules.length) },
			{ label: "Format", value: "PDF" },
		]),
	);

	if (featuresWithSpecs.length === 0) {
		doc.setFontSize(11);
		doc.setTextColor(...PDF_THEME.colors.muted);
		doc.text("Aucune spécification définie.", 15, yPosition);
		addPdfFooters(doc, "Spécifications fonctionnelles");
		const filename = `${sanitizeFilename(project.name)}_specs_${new Date().toISOString().split("T")[0]}.pdf`;
		doc.save(filename);
		return;
	}

	for (const mod of modules) {
		const specs = featuresWithSpecs.filter((f) => f.moduleId === mod.id);
		if (specs.length === 0) continue;

		yPosition = ensurePdfSpace(doc, yPosition, 45);
		yPosition = drawSectionHeader(doc, yPosition, mod.name, `${specs.length} spécification(s)`);

		if (mod.description) {
			doc.setFontSize(6);
			doc.setTextColor(...PDF_THEME.colors.muted);
			const descLines = doc.splitTextToSize(mod.description, pageWidth - PDF_THEME.margin * 2);
			doc.text(descLines, 18, yPosition);
			yPosition += descLines.length * 3.5 + 4;
		}

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

		autoTable(doc, {
			...getPdfTableStyles(),
			startY: yPosition,
			head: [["Fonctionnalité", "Spécification", "Statut", "Priorité", "J"]],
			body: tableData,
			margin: { left: PDF_THEME.margin, right: PDF_THEME.margin, bottom: PDF_THEME.footerHeight },
			columnStyles: {
				0: { cellWidth: 35, fontStyle: "bold" },
				1: { cellWidth: 100, overflow: "linebreak" },
				2: { cellWidth: 20, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
				4: { cellWidth: 10, halign: "center" },
			},
			styles: {
				...getPdfTableStyles().styles,
				fontSize: 6.5,
				cellPadding: 1.5,
				valign: "top",
			},
			didDrawPage: (data) => {
				if (data.cursor) yPosition = data.cursor.y + 6;
			},
		});

		yPosition += 4;
	}

	const orphanSpecs = featuresWithSpecs.filter(
		(f) => !modules.some((m) => m.id === f.moduleId),
	);
	if (orphanSpecs.length > 0) {
		yPosition = ensurePdfSpace(doc, yPosition, 45);
		yPosition = drawSectionHeader(
			doc,
			yPosition,
			"Non assigné",
			`${orphanSpecs.length} spécification(s)`,
		);

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

		autoTable(doc, {
			...getPdfTableStyles(),
			startY: yPosition,
			head: [["Fonctionnalité", "Spécification", "Statut", "Priorité", "J"]],
			body: orphanTableData,
			margin: { left: PDF_THEME.margin, right: PDF_THEME.margin, bottom: PDF_THEME.footerHeight },
			columnStyles: {
				0: { cellWidth: 35, fontStyle: "bold" },
				1: { cellWidth: 100, overflow: "linebreak" },
				2: { cellWidth: 20, halign: "center" },
				3: { cellWidth: 15, halign: "center" },
				4: { cellWidth: 10, halign: "center" },
			},
			styles: {
				...getPdfTableStyles().styles,
				fontSize: 6.5,
				cellPadding: 1.5,
				valign: "top",
			},
			didDrawPage: (data) => {
				if (data.cursor) yPosition = data.cursor.y + 6;
			},
		});
	}

	addPdfFooters(doc, "Spécifications fonctionnelles");
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
