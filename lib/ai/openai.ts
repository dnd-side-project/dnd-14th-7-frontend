const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_REQUEST_TIMEOUT_MS = 10_000;

interface OpenAIMessageResponse {
	choices: Array<{
		message?: {
			content?: string | null;
		};
	}>;
}

export async function askOpenAI(prompt: string): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("Missing OPENAI_API_KEY");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(
		() => controller.abort(),
		OPENAI_REQUEST_TIMEOUT_MS,
	);

	try {
		const response = await fetch(OPENAI_API_URL, {
			method: "POST",
			signal: controller.signal,
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
				temperature: 0.7,
				response_format: { type: "json_object" },
				messages: [
					{
						role: "system",
						content:
							"너는 사용자의 메모를 실용적인 인사이트로 정리하는 한국어 AI 어시스턴트야. 반드시 유효한 JSON만 출력해.",
					},
					{ role: "user", content: prompt },
				],
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`OpenAI API request failed: ${response.status} ${errorBody}`,
			);
		}

		const data = (await response.json()) as OpenAIMessageResponse;
		const text = data?.choices?.[0]?.message?.content?.trim();

		if (!text) {
			throw new Error("OpenAI API returned empty content");
		}

		return text.replaceAll("```json", "").replaceAll("```", "").trim();
	} finally {
		clearTimeout(timeoutId);
	}
}

export function parseOpenAIJson<T>(text: string): T {
	const trimmed = text.trim();
	const jsonStart = Math.min(
		...[trimmed.indexOf("{"), trimmed.indexOf("[")].filter(
			(index) => index >= 0,
		),
	);
	const jsonText = Number.isFinite(jsonStart)
		? trimmed.slice(jsonStart)
		: trimmed;

	return JSON.parse(jsonText) as T;
}
