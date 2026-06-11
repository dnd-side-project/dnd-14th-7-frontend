import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiCreditFeature } from "@/lib/credits";
import type { Database } from "@/lib/supabase/types";

type ServerSupabaseClient = SupabaseClient<Database>;

interface ConsumeCreditsInput {
	feature: AiCreditFeature;
	cost: number;
	relatedEntityType?: string;
	relatedEntityId?: string;
}

interface RecordAiUsageInput {
	userId: string;
	feature: AiCreditFeature;
	model: string;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	estimatedCost: number;
	relatedEntityType?: string;
	relatedEntityId?: string;
}

export class InsufficientCreditsError extends Error {
	constructor(public readonly requiredCredits: number) {
		super("Insufficient credits");
		this.name = "InsufficientCreditsError";
	}
}

export async function consumeAiCredits(
	supabase: ServerSupabaseClient,
	input: ConsumeCreditsInput,
) {
	const idempotencyKey = crypto.randomUUID();
	const { data, error } = await supabase
		.rpc("consume_credits", {
			p_amount: input.cost,
			p_feature: input.feature,
			p_idempotency_key: idempotencyKey,
			p_related_entity_type: input.relatedEntityType ?? null,
			p_related_entity_id: input.relatedEntityId ?? null,
		})
		.single();

	if (error) throw error;
	if (!data?.success) {
		throw new InsufficientCreditsError(input.cost);
	}

	return {
		idempotencyKey,
		balanceAfter: data.balance_after,
	};
}

export async function refundAiCredits(
	supabase: ServerSupabaseClient,
	idempotencyKey: string,
	reason: string,
) {
	const { error } = await supabase.rpc("refund_credits", {
		p_idempotency_key: idempotencyKey,
		p_reason: reason,
	});

	if (error) throw error;
}

export async function recordAiUsage(
	supabase: ServerSupabaseClient,
	input: RecordAiUsageInput,
) {
	const { error } = await supabase.rpc("record_ai_usage", {
		p_user_id: input.userId,
		p_feature: input.feature,
		p_model: input.model,
		p_prompt_tokens: input.promptTokens,
		p_completion_tokens: input.completionTokens,
		p_total_tokens: input.totalTokens,
		p_estimated_cost: input.estimatedCost,
		p_related_entity_type: input.relatedEntityType ?? null,
		p_related_entity_id: input.relatedEntityId ?? null,
	});

	if (error) throw error;
}
