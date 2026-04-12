import type {
	Feature,
	Module,
	Project,
	Schedule,
	Sprint,
	Task,
} from "@/lib/store";
import { db, initDb } from "./client";

let initialized = false;
async function ensureInit() {
	if (!initialized) {
		await initDb();
		initialized = true;
	}
}

// ── Projects ──────────────────────────────────────────────────────────────
export async function getProjects(): Promise<Project[]> {
	await ensureInit();
	const rows = await db.execute(
		"SELECT * FROM projects ORDER BY created_at ASC",
	);
	return Promise.all(rows.rows.map(rowToProject));
}

export async function upsertProject(p: Project): Promise<void> {
	await ensureInit();
	await db.execute({
		sql: `INSERT OR REPLACE INTO projects (id, name, desc, tag, start, end_date) VALUES (?,?,?,?,?,?)`,
		args: [p.id, p.name, p.desc, p.tag, p.start, p.end],
	});
	await upsertSchedule(p.id, p.schedule);
}

export async function deleteProject(id: string): Promise<void> {
	await db.execute({ sql: "DELETE FROM projects WHERE id = ?", args: [id] });
}

// ── Features ──────────────────────────────────────────────────────────────
export async function upsertFeature(
	projectId: string,
	f: Feature,
): Promise<void> {
	await db.execute({
		sql: `INSERT OR REPLACE INTO features (id, project_id, name, status, priority, days, start, spec, module_id, depends_on, sort_order, sprint_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
		args: [
			f.id,
			projectId,
			f.name,
			f.status,
			f.priority,
			f.days,
			f.start,
			f.spec,
			f.moduleId ?? "",
			JSON.stringify(f.dependsOn ?? []),
			f.sortOrder ?? 0,
			f.sprintId ?? "",
		],
	});
}

export async function deleteFeature(id: string): Promise<void> {
	await db.execute({ sql: "DELETE FROM features WHERE id = ?", args: [id] });
}

// ── Tasks ──────────────────────────────────────────────────────────────────
export async function upsertTask(projectId: string, t: Task): Promise<void> {
	await db.execute({
		sql: `INSERT OR REPLACE INTO tasks (id, project_id, name, status, priority, days) VALUES (?,?,?,?,?,?)`,
		args: [t.id, projectId, t.name, t.status, t.priority, t.days],
	});
}

export async function deleteTask(id: string): Promise<void> {
	await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
}

// ── Schedule ───────────────────────────────────────────────────────────────

export async function upsertModule(
	projectId: string,
	m: Module,
): Promise<void> {
	await db.execute({
		sql: `INSERT OR REPLACE INTO modules (id, project_id, name, color, description) VALUES (?,?,?,?,?)`,
		args: [m.id, projectId, m.name, m.color, m.description],
	});
}

export async function deleteModule(id: string): Promise<void> {
	await db.execute({
		sql: "UPDATE features SET module_id = '' WHERE module_id = ?",
		args: [id],
	});
	await db.execute({ sql: "DELETE FROM modules WHERE id = ?", args: [id] });
}

export async function upsertSprint(
	projectId: string,
	s: Sprint,
): Promise<void> {
	await db.execute({
		sql: `INSERT OR REPLACE INTO sprints (id, project_id, name, start, end_date, goal, task_ids) VALUES (?,?,?,?,?,?,?)`,
		args: [
			s.id,
			projectId,
			s.name,
			s.start,
			s.end,
			s.goal,
			JSON.stringify(s.taskIds),
		],
	});
}

export async function deleteSprint(id: string): Promise<void> {
	await db.execute({ sql: "DELETE FROM sprints WHERE id = ?", args: [id] });
}
export async function upsertSchedule(
	projectId: string,
	s: Schedule,
): Promise<void> {
	await db.execute({
		sql: `INSERT OR REPLACE INTO schedules (project_id, work_days, time_start, time_end, exceptions) VALUES (?,?,?,?,?)`,
		args: [
			projectId,
			JSON.stringify(s.days),
			s.start,
			s.end,
			JSON.stringify(s.exceptions),
		],
	});
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function rowToProject(row: Record<string, unknown>): Promise<Project> {
	const [featureRows, taskRows, schedRow, sprintRows, moduleRows] =
		await Promise.all([
			db.execute({
				sql: "SELECT * FROM features WHERE project_id = ? ORDER BY sort_order",
				args: [row.id as string],
			}),
			db.execute({
				sql: "SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order",
				args: [row.id as string],
			}),
			db.execute({
				sql: "SELECT * FROM schedules WHERE project_id = ?",
				args: [row.id as string],
			}),
			db.execute({
				sql: "SELECT * FROM sprints WHERE project_id = ? ORDER BY sort_order",
				args: [row.id as string],
			}),
			db.execute({
				sql: "SELECT * FROM modules WHERE project_id = ? ORDER BY sort_order",
				args: [row.id as string],
			}),
		]);
	const s = schedRow.rows[0];
	return {
		id: row.id as string,
		name: row.name as string,
		desc: (row.desc as string) ?? "",
		tag: (row.tag as string) ?? "",
		start: (row.start as string) ?? "",
		end: (row.end_date as string) ?? "",
		features: featureRows.rows.map((f) => ({
			id: f.id as string,
			name: f.name as string,
			status: (f.status as Feature["status"]) ?? "todo",
			priority: (f.priority as Feature["priority"]) ?? "p2",
			days: Number(f.days) ?? 3,
			start: (f.start as string) ?? "",
			spec: (f.spec as string) ?? "",
			moduleId: (f.module_id as string) ?? "",
			dependsOn: JSON.parse((f.depends_on as string) ?? "[]"),
			sortOrder: Number(f.sort_order ?? 0),
			sprintId: (f.sprint_id as string) ?? "",
		})),
		tasks: taskRows.rows.map((t) => ({
			id: t.id as string,
			name: t.name as string,
			status: (t.status as Task["status"]) ?? "todo",
			priority: (t.priority as Task["priority"]) ?? "p2",
			days: Number(t.days) ?? 2,
		})),
		modules: (moduleRows?.rows ?? []).map((m) => ({
			id: m.id as string,
			name: m.name as string,
			color: (m.color as string) ?? "#004ced",
			description: (m.description as string) ?? "",
		})),
		sprints: (sprintRows?.rows ?? []).map((sp) => ({
			id: sp.id as string,
			name: sp.name as string,
			start: (sp.start as string) ?? "",
			end: (sp.end_date as string) ?? "",
			goal: (sp.goal as string) ?? "",
			taskIds: JSON.parse((sp.task_ids as string) ?? "[]"),
		})),
		schedule: s
			? {
					days: JSON.parse(s.work_days as string),
					start: (s.time_start as string) ?? "09:00",
					end: (s.time_end as string) ?? "18:00",
					exceptions: JSON.parse(s.exceptions as string),
				}
			: { days: [1, 2, 3, 4, 5], start: "09:00", end: "18:00", exceptions: [] },
	};
}
