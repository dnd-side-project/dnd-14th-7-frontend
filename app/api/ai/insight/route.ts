import { NextResponse } from "next/server";
import {
	consumeAiCredits,
	InsufficientCreditsError,
	recordAiUsage,
	refundAiCredits,
} from "@/lib/ai/credits";
import {
	askOpenAIWithUsage,
	estimateOpenAICost,
	parseOpenAIJson,
} from "@/lib/ai/openai";
import { AI_CREDIT_COSTS } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface InsightGenerationResponse {
	title: string;
	insight: string;
	tags: string[];
	questions: string[];
}

function normalizeStrings(values: unknown, maxLength: number) {
	if (!Array.isArray(values)) return [];

	return values
		.filter((value): value is string => typeof value === "string")
		.map((value) => value.trim())
		.filter(Boolean)
		.slice(0, maxLength);
}

function createPrompt(memo: string) {
	return `
다음 사용자의 메모를 Aha!ve 서비스의 인사이트 데이터로 변환해줘.
반드시 마크다운 코드블록 없이 순수 JSON만 출력해.
부가 설명은 절대 포함하지 마.

요구사항:
- title: 핵심을 담은 짧은 제목, 20자 이내
- insight: 메모를 바탕으로 정리한 핵심 인사이트 한 문장
- tags: 핵심 키워드 3개
- questions: 사용자가 더 깊게 생각해볼 질문 3개

출력 형식:
{
  "title": "서버 로그의 중요성",
  "insight": "서버 코드에 로그를 충분히 남겨두면 오류 원인을 더 빠르게 파악할 수 있다.",
  "tags": ["개발", "디버깅", "로그"],
  "questions": ["이 경험을 한 문장 원칙으로 정리하면 무엇인가요?", "다음 프로젝트에서 적용할 로그 기준은 무엇인가요?", "로그가 없어서 실제로 막혔던 지점은 어디였나요?"]
}

메모: ${memo}
`;
}

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
	}

	let memo = "";
	try {
		const body = (await request.json()) as { memo?: unknown };
		memo = typeof body.memo === "string" ? body.memo.trim() : "";
	} catch {
		return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
	}

	if (!memo) {
		return NextResponse.json({ message: "memo is required" }, { status: 400 });
	}

	let creditReservation: Awaited<ReturnType<typeof consumeAiCredits>> | null =
		null;
	let createdInsightId: number | null = null;

	try {
		creditReservation = await consumeAiCredits(supabase, {
			feature: "INSIGHT_CREATE",
			cost: AI_CREDIT_COSTS.INSIGHT_CREATE,
		});

		const aiResponse = await askOpenAIWithUsage(createPrompt(memo));
		const parsed = parseOpenAIJson<InsightGenerationResponse>(aiResponse.text);
		const title =
			typeof parsed?.title === "string" && parsed.title.trim()
				? parsed.title.trim()
				: "제목 없는 인사이트";
		const insightContent =
			typeof parsed?.insight === "string" && parsed.insight.trim()
				? parsed.insight.trim()
				: memo;
		const tags = normalizeStrings(parsed?.tags, 3);
		const questions = normalizeStrings(parsed?.questions, 3);

		const { data: insight, error } = await supabase
			.from("insights")
			.insert({
				user_id: user.id,
				initial_thought: memo,
				title,
			})
			.select("id")
			.single();

		if (error) throw error;
		createdInsightId = insight.id;

		const { error: pieceError } = await supabase.from("insight_pieces").insert({
			insight_id: insight.id,
			content: insightContent,
			created_type: "INIT",
		});

		if (pieceError) throw pieceError;

		const tagNames = [...new Set(tags.map((tag) => tag.trim()))].filter(
			Boolean,
		);

		if (tagNames.length > 0) {
			const { data: createdTags, error: tagError } = await supabase
				.from("tags")
				.upsert(
					tagNames.map((name) => ({ user_id: user.id, name })),
					{ onConflict: "user_id,name" },
				)
				.select("id");

			if (tagError) throw tagError;

			if (createdTags && createdTags.length > 0) {
				const { error: insightTagError } = await supabase
					.from("insight_tags")
					.insert(
						createdTags.map((tag) => ({
							insight_id: insight.id,
							tag_id: tag.id,
						})),
					);

				if (insightTagError) throw insightTagError;
			}
		}

		if (questions.length > 0) {
			const { error: questionError } = await supabase.from("questions").insert(
				questions.map((content) => ({
					insight_id: insight.id,
					content,
				})),
			);

			if (questionError) throw questionError;
		}

		await recordAiUsage(supabase, {
			userId: user.id,
			feature: "INSIGHT_CREATE",
			model: aiResponse.model,
			promptTokens: aiResponse.usage.promptTokens,
			completionTokens: aiResponse.usage.completionTokens,
			totalTokens: aiResponse.usage.totalTokens,
			estimatedCost: estimateOpenAICost(aiResponse.usage),
			relatedEntityType: "insight",
			relatedEntityId: String(insight.id),
		}).catch((usageError) => {
			console.error("Failed to record insight creation AI usage:", usageError);
		});

		return NextResponse.json({ insightId: insight.id });
	} catch (error) {
		if (createdInsightId !== null) {
			const { error: cleanupError } = await supabase
				.from("insights")
				.delete()
				.eq("id", createdInsightId);

			if (cleanupError) {
				console.error("Failed to clean up orphaned insight:", cleanupError);
			}
		}

		if (creditReservation) {
			await refundAiCredits(
				supabase,
				creditReservation.idempotencyKey,
				"AI insight creation failed",
			).catch((refundError) => {
				console.error(
					"Failed to refund insight creation credits:",
					refundError,
				);
			});
		}

		if (error instanceof InsufficientCreditsError) {
			return NextResponse.json(
				{
					message: "Insufficient credits",
					requiredCredits: error.requiredCredits,
				},
				{ status: 402 },
			);
		}

		console.error("Failed to generate insight with OpenAI:", error);
		return NextResponse.json(
			{ message: "Failed to generate insight" },
			{ status: 500 },
		);
	}
}
