import { createClient } from "@libsql/client";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("database initialization", () => {
	let tmpDir: string;
	let previousDbPath: string | undefined;

	beforeEach(async () => {
		vi.resetModules();
		previousDbPath = process.env.DB_PATH;
		tmpDir = await mkdtemp(path.join(os.tmpdir(), "gantty-db-"));
		process.env.DB_PATH = path.join(tmpDir, "gantty.db");
	});

	afterEach(async () => {
		if (previousDbPath === undefined) {
			delete process.env.DB_PATH;
		} else {
			process.env.DB_PATH = previousDbPath;
		}
		await rm(tmpDir, { force: true, recursive: true });
	});

	it("migrates existing tables that are missing sort_order columns", async () => {
		const setupDb = createClient({ url: `file:${process.env.DB_PATH}` });

		await setupDb.batch([
			`CREATE TABLE projects (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				desc TEXT DEFAULT '',
				tag TEXT DEFAULT '',
				start TEXT DEFAULT '',
				end_date TEXT DEFAULT '',
				created_at TEXT DEFAULT (datetime('now'))
			)`,
			`CREATE TABLE modules (
				id TEXT PRIMARY KEY,
				project_id TEXT NOT NULL,
				name TEXT NOT NULL,
				color TEXT DEFAULT '#004ced',
				description TEXT DEFAULT ''
			)`,
			`CREATE TABLE features (
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
				sprint_id TEXT DEFAULT ''
			)`,
			`CREATE TABLE tasks (
				id TEXT PRIMARY KEY,
				project_id TEXT NOT NULL,
				name TEXT NOT NULL,
				status TEXT DEFAULT 'todo',
				priority TEXT DEFAULT 'p2',
				days REAL DEFAULT 2
			)`,
			`CREATE TABLE schedules (
				project_id TEXT PRIMARY KEY,
				work_days TEXT DEFAULT '[1,2,3,4,5]',
				time_start TEXT DEFAULT '09:00',
				time_end TEXT DEFAULT '18:00',
				exceptions TEXT DEFAULT '[]'
			)`,
			`CREATE TABLE sprints (
				id TEXT PRIMARY KEY,
				project_id TEXT NOT NULL,
				name TEXT NOT NULL,
				start TEXT DEFAULT '',
				end_date TEXT DEFAULT '',
				goal TEXT DEFAULT '',
				task_ids TEXT DEFAULT '[]'
			)`,
			{
				sql: "INSERT INTO projects (id, name) VALUES (?, ?)",
				args: ["p1", "Production project"],
			},
		]);
		setupDb.close();

		const { db } = await import("@/lib/db/client");
		const { getProjects } = await import("@/lib/db/queries");

		await expect(getProjects()).resolves.toHaveLength(1);
		db.close();
	});
});
