"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type InsightPiece,
	insightKeys,
	insightPieceUpdateMutationOptions,
} from "@/lib/queries/insight";
import { DefaultModeView } from "./default-mode-view";
import { LoadingModeView } from "./loading-mode-view";
import { type RetryCandidate, SelectingModeView } from "./selecting-mode-view";

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
): Promise<RetryCandidate[]> {
	const controller = new AbortController();
	const timeoutId = setTimeout(
		() => controller.abort(),
		RETRY_CANDIDATES_TIMEOUT_MS,
	);

	try {
		const response = await fetch("/api/ai/insight-candidates", {
			method: "POST",
			signal: controller.signal,
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ content }),
		});

		if (!response.ok) {
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
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") {
			throw new Error("Retry candidates request timed out");
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

export function InsightPieceItem({
	insightId,
	piece,
	index,
	onRetryStart,
	onRetryEnd,
}: {
	insightId: number;
	piece: InsightPiece;
	index: number;
	onRetryStart: (pieceId: number) => void;
	onRetryEnd: () => void;
}) {
	const [retryState, setRetryState] = useState<RetryState>({ status: "idle" });
	const [selectedContent, setSelectedContent] = useState(() => piece.content);
	const displayContent =
		retryState.status === "idle" ? piece.content : selectedContent;
	const requestIdRef = useRef(0);
	const queryClient = useQueryClient();
	const { mutate: updatePieceContent } = useMutation({
		...insightPieceUpdateMutationOptions(piece.insightPieceId),
		onSuccess: (_, { content }) => {
			setSelectedContent(content);
			queryClient.invalidateQueries({
				queryKey: insightKeys.pieces(insightId),
			});
			finishRetry();
		},
		onError: () => {
			setRetryState({
				status: "error",
				message: "선택한 후보를 반영하지 못했어요. 잠시 후 다시 시도해주세요.",
			});
		},
	});

	useEffect(() => {
		return () => {
			requestIdRef.current += 1;
		};
	}, []);

	const finishRetry = useCallback(() => {
		requestIdRef.current += 1;
		setRetryState({ status: "idle" });
		onRetryEnd();
	}, [onRetryEnd]);

	const handleRetry = useCallback(async () => {
		const requestId = requestIdRef.current + 1;
		const retryContent =
			retryState.status === "idle" ? piece.content : selectedContent;
		requestIdRef.current = requestId;
		onRetryStart(piece.insightPieceId);
		setSelectedContent(retryContent);
		setRetryState({ status: "loading" });

		try {
			const candidates = await generateRetryCandidates(retryContent);
			if (requestIdRef.current !== requestId) return;
			setRetryState({ status: "selecting", candidates });
		} catch (error) {
			if (requestIdRef.current !== requestId) return;
			console.error("Failed to generate retry candidates:", error);
			setRetryState({
				status: "error",
				message: "후보를 생성하지 못했어요. 잠시 후 다시 시도해주세요.",
			});
		}
	}, [
		onRetryStart,
		piece.content,
		piece.insightPieceId,
		retryState.status,
		selectedContent,
	]);

	const handleSelect = useCallback(
		(content: string) => {
			updatePieceContent({ content });
		},
		[updatePieceContent],
	);

	return (
		<div className="flex flex-col gap-4">
			<DefaultModeView
				piece={piece}
				index={index}
				currentContent={displayContent}
				onRetry={handleRetry}
			/>
			{retryState.status === "loading" && (
				<LoadingModeView onCancel={finishRetry} />
			)}
			{retryState.status === "selecting" && (
				<SelectingModeView
					candidates={retryState.candidates}
					onCancel={finishRetry}
					onSelect={handleSelect}
				/>
			)}
			{retryState.status === "error" && (
				<RetryErrorCard
					message={retryState.message}
					onRetry={handleRetry}
					onCancel={finishRetry}
				/>
			)}
		</div>
	);
}

function RetryErrorCard({
	message,
	onRetry,
	onCancel,
}: {
	message: string;
	onRetry: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-dnd-heavy">
			<p className="typo-body-1 text-dnd-status-negative">{message}</p>
			<div className="flex justify-end gap-2">
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-bg-alternative px-7 py-3 font-medium text-dnd-label-neutral transition-colors hover:bg-dnd-fill-normal"
					onClick={onCancel}
				>
					닫기
				</button>
				<button
					type="button"
					className="typo-body-1 rounded-xl bg-dnd-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-dnd-primary-strong"
					onClick={onRetry}
				>
					다시 시도
				</button>
			</div>
		</div>
	);
}
