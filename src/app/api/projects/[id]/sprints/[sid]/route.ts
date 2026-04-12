import { NextResponse } from "next/server";
import { badRequest, parseBody, validateIds } from "@/lib/api-validation";
import { deleteSprint, upsertSprint } from "@/lib/db/queries";
import type { Sprint } from "@/lib/store";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string; sid: string }> },
) {
	try {
		const { id, sid } = await params;
		if (!validateIds(id, sid)) return badRequest("Invalid id");
		const body = await parseBody<Sprint>(req);
		if (!body) return badRequest();
		await upsertSprint(id, { ...body, id: sid });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: Promise<{ id: string; sid: string }> },
) {
	try {
		const { id, sid } = await params;
		if (!validateIds(id, sid)) return badRequest("Invalid id");
		await deleteSprint(sid);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
