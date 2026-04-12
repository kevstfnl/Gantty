import { NextResponse } from "next/server";
import { badRequest, parseBody, validateIds } from "@/lib/api-validation";
import { deleteModule, upsertModule } from "@/lib/db/queries";
import type { Module } from "@/lib/store";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string; mid: string }> },
) {
	try {
		const { id, mid } = await params;
		if (!validateIds(id, mid)) return badRequest("Invalid id");
		const body = await parseBody<Module>(req);
		if (!body) return badRequest();
		await upsertModule(id, { ...body, id: mid });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: Promise<{ id: string; mid: string }> },
) {
	try {
		const { id, mid } = await params;
		if (!validateIds(id, mid)) return badRequest("Invalid id");
		await deleteModule(mid);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
