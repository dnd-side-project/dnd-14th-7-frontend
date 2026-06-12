import type { Json } from "@/lib/supabase/types";

interface TrackExperimentEventInput {
	eventName: string;
	experimentKey?: string;
	variant?: string;
	metadata?: Json;
}

export async function trackExperimentEvent(input: TrackExperimentEventInput) {
	const response = await fetch("/api/experiments", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(input),
	});

	if (!response.ok) {
		throw new Error("Failed to track experiment event");
	}
}
