import { beforeEach, describe, expect, it } from "vitest";
import type { Feature } from "@/lib/store";
import { useStore } from "@/lib/store";

// Reset store between tests
beforeEach(() => {
	useStore.setState({
		projects: [],
		currentProjectId: null,
		currentView: "dashboard",
		dbSynced: false,
	});
});

const makeFeature = (overrides: Partial<Feature>): Omit<Feature, "id"> => ({
	name: "Test",
	status: "todo",
	priority: "p2",
	days: 3,
	start: "",
	spec: "",
	moduleId: "",
	dependsOn: [],
	sortOrder: 0,
	sprintId: "",
	...overrides,
});

// ── Project creation ────────────────────────────────────────────────────────
describe("addProject", () => {
	it("creates a project with default schedule", () => {
		const { addProject, projects } = useStore.getState();
		addProject({ name: "Test", desc: "", tag: "T01", start: "", end: "" });
		const p = useStore.getState().projects[0];
		expect(p.name).toBe("Test");
		expect(p.schedule.days).toEqual([1, 2, 3, 4, 5]);
		expect(p.features).toEqual([]);
		expect(p.sprints).toEqual([]);
		expect(p.modules).toEqual([]);
	});

	it("sets currentProjectId to new project", () => {
		useStore
			.getState()
			.addProject({ name: "P1", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId, projects } = useStore.getState();
		expect(currentProjectId).toBe(projects[0].id);
	});
});

// ── Auto project bounds from features ──────────────────────────────────────
describe("project bounds auto-expansion", () => {
	it("sets project start from first feature start", () => {
		const { addProject, addFeature } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(
			currentProjectId!,
			makeFeature({ start: "2025-03-01", days: 5 }),
		);
		const p = useStore
			.getState()
			.projects.find((x) => x.id === currentProjectId)!;
		expect(p.start).toBe("2025-03-01");
	});

	it("expands project end when feature end exceeds it", () => {
		const { addProject, addFeature } = useStore.getState();
		addProject({
			name: "P",
			desc: "",
			tag: "P01",
			start: "2025-01-01",
			end: "2025-01-31",
		});
		const { currentProjectId } = useStore.getState();
		// Feature from Feb 1, 10 days → ends Feb 11, beyond Jan 31
		addFeature(
			currentProjectId!,
			makeFeature({ start: "2025-02-01", days: 10 }),
		);
		const p = useStore
			.getState()
			.projects.find((x) => x.id === currentProjectId)!;
		expect(p.end > "2025-01-31").toBe(true);
	});

	it("moves project start earlier when feature predates it", () => {
		const { addProject, addFeature } = useStore.getState();
		addProject({
			name: "P",
			desc: "",
			tag: "P01",
			start: "2025-03-01",
			end: "2025-04-30",
		});
		const { currentProjectId } = useStore.getState();
		addFeature(
			currentProjectId!,
			makeFeature({ start: "2025-02-01", days: 3 }),
		);
		const p = useStore
			.getState()
			.projects.find((x) => x.id === currentProjectId)!;
		expect(p.start).toBe("2025-02-01");
	});

	it("does not shrink project end if feature is shorter", () => {
		const { addProject, addFeature } = useStore.getState();
		addProject({
			name: "P",
			desc: "",
			tag: "P01",
			start: "2025-01-01",
			end: "2025-12-31",
		});
		const { currentProjectId } = useStore.getState();
		addFeature(
			currentProjectId!,
			makeFeature({ start: "2025-03-01", days: 2 }),
		);
		const p = useStore
			.getState()
			.projects.find((x) => x.id === currentProjectId)!;
		expect(p.end).toBe("2025-12-31"); // unchanged
	});
});

// ── Feature CRUD ────────────────────────────────────────────────────────────
describe("feature CRUD", () => {
	it("adds a feature to the project", () => {
		const { addProject, addFeature } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "Login" }));
		const features = useStore.getState().projects[0].features;
		expect(features).toHaveLength(1);
		expect(features[0].name).toBe("Login");
	});

	it("updates a feature status", () => {
		const { addProject, addFeature, updateFeature } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "Login" }));
		const fid = useStore.getState().projects[0].features[0].id;
		updateFeature(currentProjectId!, fid, { status: "done" });
		const f = useStore.getState().projects[0].features[0];
		expect(f.status).toBe("done");
	});

	it("deletes a feature", () => {
		const { addProject, addFeature, deleteFeature } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "Login" }));
		const fid = useStore.getState().projects[0].features[0].id;
		deleteFeature(currentProjectId!, fid);
		expect(useStore.getState().projects[0].features).toHaveLength(0);
	});
});

// ── Sprint assignment ────────────────────────────────────────────────────────
describe("sprint assignment", () => {
	it("assigns a feature to a sprint", () => {
		const { addProject, addFeature, addSprint, assignTaskToSprint } =
			useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "Login" }));
		addSprint(currentProjectId!, {
			name: "Sprint 1",
			start: "",
			end: "",
			goal: "",
			taskIds: [],
		});
		const fid = useStore.getState().projects[0].features[0].id;
		const sid = useStore.getState().projects[0].sprints[0].id;
		assignTaskToSprint(currentProjectId!, fid, sid);
		const f = useStore.getState().projects[0].features[0];
		expect(f.sprintId).toBe(sid);
	});

	it("unassigns a feature from sprint when null passed", () => {
		const { addProject, addFeature, addSprint, assignTaskToSprint } =
			useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "Login" }));
		addSprint(currentProjectId!, {
			name: "Sprint 1",
			start: "",
			end: "",
			goal: "",
			taskIds: [],
		});
		const fid = useStore.getState().projects[0].features[0].id;
		const sid = useStore.getState().projects[0].sprints[0].id;
		assignTaskToSprint(currentProjectId!, fid, sid);
		assignTaskToSprint(currentProjectId!, fid, null);
		const f = useStore.getState().projects[0].features[0];
		expect(f.sprintId).toBe("");
	});
});

// ── Module management ────────────────────────────────────────────────────────
describe("module management", () => {
	it("adds a module", () => {
		const { addProject, addModule } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addModule(currentProjectId!, {
			name: "Auth",
			color: "#004ced",
			description: "",
		});
		expect(useStore.getState().projects[0].modules).toHaveLength(1);
	});

	it("deletes a module and unlinks features", () => {
		const { addProject, addModule, addFeature, deleteModule } =
			useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addModule(currentProjectId!, {
			name: "Auth",
			color: "#004ced",
			description: "",
		});
		const mid = useStore.getState().projects[0].modules[0].id;
		addFeature(
			currentProjectId!,
			makeFeature({ name: "Login", moduleId: mid }),
		);
		deleteModule(currentProjectId!, mid);
		const p = useStore.getState().projects[0];
		expect(p.modules).toHaveLength(0);
		expect(p.features[0].moduleId).toBe("");
	});
});

// ── Dependency management ────────────────────────────────────────────────────
describe("dependencies", () => {
	it("toggles a dependency on", () => {
		const { addProject, addFeature, toggleDependency } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "A" }));
		addFeature(currentProjectId!, makeFeature({ name: "B" }));
		const [a, b] = useStore.getState().projects[0].features;
		toggleDependency(currentProjectId!, b.id, a.id);
		const bUpdated = useStore.getState().projects[0].features[1];
		expect(bUpdated.dependsOn).toContain(a.id);
	});

	it("toggles a dependency off (removes it)", () => {
		const { addProject, addFeature, toggleDependency } = useStore.getState();
		addProject({ name: "P", desc: "", tag: "P01", start: "", end: "" });
		const { currentProjectId } = useStore.getState();
		addFeature(currentProjectId!, makeFeature({ name: "A" }));
		addFeature(currentProjectId!, makeFeature({ name: "B" }));
		const [a, b] = useStore.getState().projects[0].features;
		toggleDependency(currentProjectId!, b.id, a.id);
		toggleDependency(currentProjectId!, b.id, a.id);
		const bUpdated = useStore.getState().projects[0].features[1];
		expect(bUpdated.dependsOn).not.toContain(a.id);
	});
});

// ── Project deletion ──────────────────────────────────────────────────────────
describe("deleteProject", () => {
	it("removes the project", () => {
		const { addProject, deleteProject } = useStore.getState();
		addProject({ name: "P1", desc: "", tag: "P01", start: "", end: "" });
		const id = useStore.getState().projects[0].id;
		deleteProject(id);
		expect(useStore.getState().projects).toHaveLength(0);
	});

	it("switches currentProjectId after deletion", () => {
		const { addProject, deleteProject } = useStore.getState();
		addProject({ name: "P1", desc: "", tag: "P01", start: "", end: "" });
		addProject({ name: "P2", desc: "", tag: "P02", start: "", end: "" });
		const id1 = useStore.getState().projects[0].id;
		useStore.setState({ currentProjectId: id1 });
		deleteProject(id1);
		expect(useStore.getState().currentProjectId).not.toBe(id1);
	});
});
