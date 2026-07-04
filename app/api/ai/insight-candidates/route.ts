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

interface InsightCandidatesResponse {
	insightCandidates: string[];
}

function createPrompt(content: string) {
	return `
다음 인사이트 조각을 바탕으로 다른 관점의 핵심 인사이트 후보 3개를 생성해줘.
반드시 마크다운 코드블록 없이 순수 JSON만 출력해.
부가 설명은 절대 포함하지 마.

목표:
- 사용자의 업무·학습·경험을 다음에 적용 가능한 원칙으로 재정리
- 개발, 디자인, 기획, 기타 직군 어디에도 적용될 수 있는 실무적인 표현 사용

요구사항:
- 후보는 정확히 3개
- 각 후보는 한 문장
- 기존 문장을 단순 paraphrase하지 말고 관점이 달라야 함
- 후보 관점은 가능하면 원인, 판단 기준, 다음 행동 중 서로 다른 축으로 제시
- 너무 추상적인 문장보다 실무에서 바로 이해되는 문장

출력 형식:
{
  "insightCandidates": [
    "문제를 빠르게 해결하려면 작업 초반부터 관찰 가능한 단서를 남겨야 한다.",
    "원인 파악이 늦어진 경험은 다음 작업의 점검 기준을 만드는 재료가 된다.",
    "반복되는 문제는 개인의 실수보다 프로세스와 기준의 부재에서 시작될 수 있다."
  ]
}

인사이트 조각: ${content}
`;
}

function normalizeCandidates(values: unknown) {
	if (!Array.isArray(values)) return [];

	return values
		.filter((value): value is string => typeof value === "string")
		.map((value) => value.trim())
		.filter(Boolean)
		.slice(0, 3)
		.map((content, index) => ({ id: `candidate-${index + 1}`, content }));
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

	let content = "";
	try {
		const body = (await request.json()) as { content?: unknown };
		content = typeof body.content === "string" ? body.content.trim() : "";
	} catch {
		return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
	}

	if (!content) {
		return NextResponse.json(
			{ message: "content is required" },
			{ status: 400 },
		);
	}

	let creditReservation: Awaited<ReturnType<typeof consumeAiCredits>> | null =
		null;

	try {
		creditReservation = await consumeAiCredits(supabase, {
			feature: "INSIGHT_CANDIDATE_RETRY",
			cost: AI_CREDIT_COSTS.INSIGHT_CANDIDATE_RETRY,
		});

		const aiResponse = await askOpenAIWithUsage(createPrompt(content));
		const parsed = parseOpenAIJson<InsightCandidatesResponse>(aiResponse.text);
		const candidates = normalizeCandidates(parsed?.insightCandidates);

		if (candidates.length !== 3) {
			throw new Error(
				`Expected exactly 3 candidates, received ${candidates.length}: ${aiResponse.text}`,
			);
		}

		await recordAiUsage(supabase, {
			userId: user.id,
			feature: "INSIGHT_CANDIDATE_RETRY",
			model: aiResponse.model,
			promptTokens: aiResponse.usage.promptTokens,
			completionTokens: aiResponse.usage.completionTokens,
			totalTokens: aiResponse.usage.totalTokens,
			estimatedCost: estimateOpenAICost(aiResponse.usage),
		}).catch((usageError) => {
			console.error("Failed to record candidate retry AI usage:", usageError);
		});

		return NextResponse.json({ candidates });
	} catch (error) {
		if (creditReservation) {
			await refundAiCredits(
				supabase,
				creditReservation.idempotencyKey,
				"AI insight candidate retry failed",
			).catch((refundError) => {
				console.error("Failed to refund candidate retry credits:", refundError);
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

		console.error("Failed to generate insight candidates with OpenAI:", error);
		return NextResponse.json(
			{ message: "Failed to generate insight candidates" },
			{ status: 500 },
		);
	}
}
