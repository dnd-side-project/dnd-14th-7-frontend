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

interface QuestionGenerationResponse {
	questions: string[];
}

function normalizeQuestions(values: unknown) {
	if (!Array.isArray(values)) return [];

	return values
		.filter((value): value is string => typeof value === "string")
		.map((value) => value.trim())
		.filter(Boolean)
		.slice(0, 3);
}

function createPrompt({
	title,
	initialThought,
	insightPieces,
	existingQuestions,
}: {
	title: string;
	initialThought: string;
	insightPieces: string[];
	existingQuestions: string[];
}) {
	return `
다음 인사이트를 더 깊게 생각해볼 수 있는 후속 질문 3개를 생성해줘.
반드시 마크다운 코드블록 없이 순수 JSON만 출력해.
부가 설명은 절대 포함하지 마.

목표:
- 사용자의 업무·학습·경험을 더 선명한 인사이트로 확장
- 단순 정보 확인이 아니라 경험의 원인, 판단 기준, 다음 행동을 끌어내기
- 개발, 디자인, 기획, 기타 직군 어디에도 적용될 수 있는 실무적인 질문 사용

요구사항:
- 질문은 정확히 3개
- 사용자가 직접 답변하기 좋은 질문
- 이미 드러난 내용을 반복하지 말고 더 깊은 회고/적용/구체화를 유도
- 기존 질문과 같은 질문 또는 단순 paraphrase는 피하기
- 각 질문은 한 문장

출력 형식:
{
  "questions": [
    "이 경험에서 처음에 놓쳤던 가정이나 판단 기준은 무엇이었나요?",
    "비슷한 상황이 다시 생긴다면 가장 먼저 확인하거나 바꿀 행동은 무엇인가요?",
    "이 인사이트를 다른 사람에게 공유한다면 어떤 원칙이나 체크리스트로 정리할 수 있나요?"
  ]
}

제목: ${title}
첫 생각: ${initialThought}
인사이트 조각:
${insightPieces.map((piece, index) => `${index + 1}. ${piece}`).join("\n")}

기존 질문:
${existingQuestions.length > 0 ? existingQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n") : "없음"}
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

	let insightId: number | null = null;
	try {
		const body = (await request.json()) as { insightId?: unknown };
		insightId = typeof body.insightId === "number" ? body.insightId : null;
	} catch {
		return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
	}

	if (!insightId) {
		return NextResponse.json(
			{ message: "insightId is required" },
			{ status: 400 },
		);
	}

	const { data: insight, error: insightError } = await supabase
		.from("insights")
		.select("id, title, initial_thought")
		.eq("id", insightId)
		.eq("user_id", user.id)
		.single();

	if (insightError || !insight) {
		return NextResponse.json({ message: "Insight not found" }, { status: 404 });
	}

	let creditReservation: Awaited<ReturnType<typeof consumeAiCredits>> | null =
		null;

	try {
		creditReservation = await consumeAiCredits(supabase, {
			feature: "QUESTION_REFRESH",
			cost: AI_CREDIT_COSTS.QUESTION_REFRESH,
			relatedEntityType: "insight",
			relatedEntityId: String(insightId),
		});

		const { data: pieces, error: piecesError } = await supabase
			.from("insight_pieces")
			.select("content")
			.eq("insight_id", insightId)
			.order("created_at", { ascending: true });

		if (piecesError) throw piecesError;

		const { data: existingQuestions, error: existingQuestionsError } =
			await supabase
				.from("questions")
				.select("content")
				.eq("insight_id", insightId)
				.order("created_at", { ascending: true });

		if (existingQuestionsError) throw existingQuestionsError;

		const aiResponse = await askOpenAIWithUsage(
			createPrompt({
				title: insight.title ?? "",
				initialThought: insight.initial_thought ?? "",
				insightPieces: (pieces ?? []).map((piece) => piece.content),
				existingQuestions: (existingQuestions ?? []).map(
					(question) => question.content,
				),
			}),
		);
		const parsed = parseOpenAIJson<QuestionGenerationResponse>(aiResponse.text);
		const questions = normalizeQuestions(parsed?.questions);

		if (questions.length !== 3) {
			throw new Error(
				`Expected exactly 3 questions, received ${questions.length}: ${aiResponse.text}`,
			);
		}

		const { error: archiveError } = await supabase
			.from("questions")
			.update({ status: "ARCHIVED" })
			.eq("insight_id", insightId)
			.eq("status", "WAITING");

		if (archiveError) throw archiveError;

		const { data: insertedQuestions, error: insertError } = await supabase
			.from("questions")
			.insert(
				questions.map((content) => ({
					insight_id: insightId,
					content,
				})),
			)
			.select("id, content, status, created_at");

		if (insertError) throw insertError;

		await recordAiUsage(supabase, {
			userId: user.id,
			feature: "QUESTION_REFRESH",
			model: aiResponse.model,
			promptTokens: aiResponse.usage.promptTokens,
			completionTokens: aiResponse.usage.completionTokens,
			totalTokens: aiResponse.usage.totalTokens,
			estimatedCost: estimateOpenAICost(aiResponse.usage),
			relatedEntityType: "insight",
			relatedEntityId: String(insightId),
		}).catch((usageError) => {
			console.error("Failed to record question refresh AI usage:", usageError);
		});

		return NextResponse.json({ questions: insertedQuestions ?? [] });
	} catch (error) {
		if (creditReservation) {
			await refundAiCredits(
				supabase,
				creditReservation.idempotencyKey,
				"AI question refresh failed",
			).catch((refundError) => {
				console.error(
					"Failed to refund question refresh credits:",
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

		console.error("Failed to generate insight questions with OpenAI:", error);
		return NextResponse.json(
			{ message: "Failed to generate insight questions" },
			{ status: 500 },
		);
	}
}
