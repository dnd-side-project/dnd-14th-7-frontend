import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

type ServerSupabaseClient = SupabaseClient<Database>;
export type ExperimentMetadata = Record<string, Json>;

interface RecordExperimentEventInput {
	eventName: string;
	experimentKey?: string;
	variant?: string;
	metadata?: ExperimentMetadata;
}

export async function recordExperimentEvent(
	supabase: ServerSupabaseClient,
	input: RecordExperimentEventInput,
) {
	const { error } = await supabase.rpc("record_experiment_event", {
		p_event_name: input.eventName,
		p_experiment_key: input.experimentKey ?? null,
		p_variant: input.variant ?? null,
		p_metadata: input.metadata ?? {},
	});

	if (error) throw error;
}
