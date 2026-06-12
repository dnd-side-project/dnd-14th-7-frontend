import { NextResponse } from "next/server";
import { recordExperimentEvent } from "@/lib/experiments";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
	}

	let body: {
		eventName?: unknown;
		experimentKey?: unknown;
		variant?: unknown;
		metadata?: unknown;
	};

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
	}

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
	}

	if (typeof body.eventName !== "string" || !body.eventName.trim()) {
		return NextResponse.json(
			{ message: "eventName is required" },
			{ status: 400 },
		);
	}

	await recordExperimentEvent(supabase, {
		eventName: body.eventName.trim(),
		experimentKey:
			typeof body.experimentKey === "string" ? body.experimentKey : undefined,
		variant: typeof body.variant === "string" ? body.variant : undefined,
		metadata: isJsonObject(body.metadata) ? body.metadata : undefined,
	});

	return NextResponse.json({ ok: true });
}

function isJsonObject(value: unknown): value is Json {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
