import { NextResponse } from "next/server";
import { badRequest, parseBody, validateIds } from "@/lib/api-validation";
import { deleteFeature, upsertFeature } from "@/lib/db/queries";
import type { Feature } from "@/lib/store";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string; fid: string }> },
) {
	try {
		const { id, fid } = await params;
		if (!validateIds(id, fid)) return badRequest("Invalid id");
		const body = await parseBody<Feature>(req);
		if (!body) return badRequest();
		await upsertFeature(id, { ...body, id: fid });
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: Promise<{ id: string; fid: string }> },
) {
	try {
		const { id, fid } = await params;
		if (!validateIds(id, fid)) return badRequest("Invalid id");
		await deleteFeature(fid);
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ error: String(e) }, { status: 500 });
	}
}
