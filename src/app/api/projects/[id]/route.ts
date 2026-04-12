import { NextResponse } from "next/server";
import { badRequest, parseBody, validateIds } from "@/lib/api-validation";
import { deleteProject, upsertProject } from "@/lib/db/queries";
import type { Project } from "@/lib/store";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!validateIds(id)) return badRequest("Invalid id");
		const body = await parseBody<Project>(req);
		if (!body) return badRequest();
		await upsertProject({ ...body, id });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		if (!validateIds(id)) return badRequest("Invalid id");
		await deleteProject(id);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
