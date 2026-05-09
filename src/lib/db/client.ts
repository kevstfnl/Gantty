import { createClient } from "@libsql/client";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "gantty.db");

export const db = createClient({ url: `file:${dbPath}` });

export async function initDb() {
	await db.batch([
		`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT DEFAULT '',
      tag TEXT DEFAULT '',
      start TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
		`CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#004ced',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`,
		`CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'p2',
      days REAL DEFAULT 3,
      start TEXT DEFAULT '',
      spec TEXT DEFAULT '',
      module_id TEXT DEFAULT '',
      depends_on TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      sprint_id TEXT DEFAULT '',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`,
		`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'p2',
      days REAL DEFAULT 2,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`,
		`CREATE TABLE IF NOT EXISTS schedules (
      project_id TEXT PRIMARY KEY,
      work_days TEXT DEFAULT '[1,2,3,4,5]',
      time_start TEXT DEFAULT '09:00',
      time_end TEXT DEFAULT '18:00',
      exceptions TEXT DEFAULT '[]',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`,
		`CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      goal TEXT DEFAULT '',
      task_ids TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`,
	]);

	await ensureColumn("modules", "sort_order", "INTEGER DEFAULT 0");
	await ensureColumn("features", "sort_order", "INTEGER DEFAULT 0");
	await ensureColumn("tasks", "sort_order", "INTEGER DEFAULT 0");
	await ensureColumn("sprints", "sort_order", "INTEGER DEFAULT 0");
}

async function ensureColumn(
	table: string,
	column: string,
	definition: string,
) {
	const columns = await db.execute(`PRAGMA table_info(${table})`);
	const hasColumn = columns.rows.some((row) => row.name === column);

	if (!hasColumn) {
		await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
	}
}
