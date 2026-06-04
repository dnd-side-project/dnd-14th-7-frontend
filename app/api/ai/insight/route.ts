import { NextResponse } from "next/server";
import { askOpenAI, parseOpenAIJson } from "@/lib/ai/openai";
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

	try {
		const aiText = await askOpenAI(createPrompt(memo));
		const parsed = parseOpenAIJson<InsightGenerationResponse>(aiText);
		const title =
			typeof parsed?.title === "string" && parsed.title.trim()
				? parsed.title.trim()
				: "제목 없는 인사이트";
		const insight =
			typeof parsed?.insight === "string" && parsed.insight.trim()
				? parsed.insight.trim()
				: memo;
		const tags = normalizeStrings(parsed?.tags, 3);
		const questions = normalizeStrings(parsed?.questions, 3);

		return NextResponse.json({ title, insight, tags, questions });
	} catch (error) {
		console.error("Failed to generate insight with OpenAI:", error);
		return NextResponse.json(
			{ message: "Failed to generate insight" },
			{ status: 500 },
		);
	}
}
