import type { ExperimentMetadata } from "@/lib/experiments";

interface TrackExperimentEventInput {
	eventName: string;
	experimentKey?: string;
	variant?: string;
	metadata?: ExperimentMetadata;
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
