export const AI_CREDIT_COSTS = {
	INSIGHT_CREATE: 30,
	QUESTION_REFRESH: 10,
	INSIGHT_CANDIDATE_RETRY: 20,
} as const;

export type AiCreditFeature = keyof typeof AI_CREDIT_COSTS;

export const SIGNUP_CREDIT_GRANT = 200;
