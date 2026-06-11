import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { userKeys } from "@/lib/queries/user";
import type { RetryCandidate } from "./selecting-mode-view";

type RetryState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "selecting"; candidates: RetryCandidate[] }
	| { status: "error"; message: string };

const RETRY_CANDIDATES_TIMEOUT_MS = 10_000;

function isRetryCandidate(value: unknown): value is RetryCandidate {
	if (typeof value !== "object" || value === null) return false;

	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === "string" && typeof candidate.content === "string"
	);
}

async function generateRetryCandidates(
	content: string,
	signal: AbortSignal,
): Promise<RetryCandidate[]> {
	const response = await fetch("/api/ai/insight-candidates", {
		method: "POST",
		signal,
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ content }),
	});

	if (!response.ok) {
		if (response.status === 402) throw new Error("Insufficient credits");
		throw new Error("Failed to generate retry candidates");
	}

	const data = (await response.json()) as unknown;
	if (typeof data !== "object" || data === null || !("candidates" in data)) {
		throw new Error("Retry candidates response is malformed");
	}

	const { candidates } = data as { candidates: unknown };
	if (!Array.isArray(candidates) || !candidates.every(isRetryCandidate)) {
		throw new Error("Retry candidates response has invalid candidates");
	}

	return candidates;
}

interface UseRetryCandidatesParams {
	pieceId: number;
	onRetryStart: (pieceId: number) => void;
	onRetryEnd: () => void;
	onInsufficientCredits?: () => void;
}

export function useRetryCandidates({
	pieceId,
	onRetryStart,
	onRetryEnd,
	onInsufficientCredits,
}: UseRetryCandidatesParams) {
	const queryClient = useQueryClient();
	const [retryState, setRetryState] = useState<RetryState>({ status: "idle" });
	const abortControllerRef = useRef<AbortController | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearRetryRequest = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		abortControllerRef.current = null;
	}, []);

	const abortRetryRequest = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		clearRetryRequest();
	}, [clearRetryRequest]);

	const completeRetry = useCallback(() => {
		clearRetryRequest();
		setRetryState({ status: "idle" });
		onRetryEnd();
	}, [clearRetryRequest, onRetryEnd]);

	const cancelRetry = useCallback(() => {
		abortRetryRequest();
		setRetryState({ status: "idle" });
		onRetryEnd();
	}, [abortRetryRequest, onRetryEnd]);

	const startRetry = useCallback(
		async (content: string) => {
			abortRetryRequest();
			const controller = new AbortController();
			let didTimeout = false;
			abortControllerRef.current = controller;
			timeoutRef.current = setTimeout(() => {
				didTimeout = true;
				controller.abort();
			}, RETRY_CANDIDATES_TIMEOUT_MS);
			onRetryStart(pieceId);
			setRetryState({ status: "loading" });

			try {
				const candidates = await generateRetryCandidates(
					content,
					controller.signal,
				);
				if (controller.signal.aborted) return;
				clearRetryRequest();
				queryClient.invalidateQueries({ queryKey: userKeys.profile() });
				setRetryState({ status: "selecting", candidates });
			} catch (error) {
				if (controller.signal.aborted && !didTimeout) return;
				clearRetryRequest();

				if (
					error instanceof Error &&
					error.message === "Insufficient credits"
				) {
					setRetryState({ status: "idle" });
					onRetryEnd();
					onInsufficientCredits?.();
					return;
				}

				console.error("Failed to generate retry candidates:", error);
				setRetryState({
					status: "error",
					message: didTimeout
						? "후보 생성 요청 시간이 초과됐어요. 잠시 후 다시 시도해주세요."
						: "후보를 생성하지 못했어요. 잠시 후 다시 시도해주세요.",
				});
			}
		},
		[
			abortRetryRequest,
			clearRetryRequest,
			onInsufficientCredits,
			onRetryEnd,
			onRetryStart,
			pieceId,
			queryClient,
		],
	);

	useEffect(() => {
		return abortRetryRequest;
	}, [abortRetryRequest]);

	return {
		retryState,
		setRetryState,
		startRetry,
		cancelRetry,
		completeRetry,
	};
}
