import { NextResponse } from "next/server";
import { askOpenAI, parseOpenAIJson } from "@/lib/ai/openai";
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

요구사항:
- 후보는 정확히 3개
- 각 후보는 한 문장
- 기존 문장을 단순 paraphrase하지 말고 관점이 달라야 함
- 너무 추상적인 문장보다 실무에서 바로 이해되는 문장

출력 형식:
{
  "insightCandidates": [
    "충분한 로그는 문제 해결을 빠르게 한다.",
    "로그가 없으면 문제 원인 파악이 어려워진다.",
    "개발 초기부터 로그 전략을 세우는 것이 중요하다."
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

	try {
		const aiText = await askOpenAI(createPrompt(content));
		const parsed = parseOpenAIJson<InsightCandidatesResponse>(aiText);
		const candidates = normalizeCandidates(parsed?.insightCandidates);

		if (candidates.length !== 3) {
			throw new Error(
				`Expected exactly 3 candidates, received ${candidates.length}: ${aiText}`,
			);
		}

		return NextResponse.json({ candidates });
	} catch (error) {
		console.error("Failed to generate insight candidates with OpenAI:", error);
		return NextResponse.json(
			{ message: "Failed to generate insight candidates" },
			{ status: 500 },
		);
	}
}
