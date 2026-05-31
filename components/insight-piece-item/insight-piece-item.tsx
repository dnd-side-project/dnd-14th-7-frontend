"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InsightPiece } from "@/lib/queries/insight";
import { DefaultModeView } from "./default-mode-view";
import { LoadingModeView } from "./loading-mode-view";
import { type RetryCandidate, SelectingModeView } from "./selecting-mode-view";

type RetryState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "selecting"; candidates: RetryCandidate[] }
	| { status: "error"; message: string };

async function generateRetryCandidates(
	content: string,
): Promise<RetryCandidate[]> {
	const response = await fetch("/api/ai/insight-candidates", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ content }),
	});

	if (!response.ok) {
		throw new Error("Failed to generate retry candidates");
	}

	const data = (await response.json()) as { candidates: RetryCandidate[] };
	return data.candidates;
}

export function InsightPieceItem({
	piece,
	index,
	onRetryStart,
	onRetryEnd,
}: {
	piece: InsightPiece;
	index: number;
	onRetryStart: (pieceId: number) => void;
	onRetryEnd: () => void;
}) {
	const [retryState, setRetryState] = useState<RetryState>({ status: "idle" });
	const [generatedContents, setGeneratedContents] = useState<string[]>([]);
	const requestIdRef = useRef(0);

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
		requestIdRef.current = requestId;
		onRetryStart(piece.insightPieceId);
		setRetryState({ status: "loading" });

		try {
			const candidates = await generateRetryCandidates(piece.content);
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
	}, [onRetryStart, piece.content, piece.insightPieceId]);

	const handleSelect = useCallback(
		(content: string) => {
			setGeneratedContents((prev) => [...prev, content]);
			finishRetry();
		},
		[finishRetry],
	);

	return (
		<div className="flex flex-col gap-4">
			<DefaultModeView
				piece={piece}
				index={index}
				currentContent={piece.content}
				onRetry={handleRetry}
			/>
			{generatedContents.map((content, generatedIndex) => (
				<GeneratedContentCard
					// biome-ignore lint/suspicious/noArrayIndexKey: locally appended retry results do not have persisted ids yet.
					key={`${content}-${generatedIndex}`}
					index={generatedIndex + 1}
					content={content}
				/>
			))}
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

function GeneratedContentCard({
	index,
	content,
}: {
	index: number;
	content: string;
}) {
	return (
		<div className="flex flex-col gap-6 rounded-3xl bg-white p-6">
			<div className="flex items-center gap-2">
				<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-dnd-bg-insight-box typo-caption-2 font-bold text-dnd-primary">
					{index + 1}
				</span>
				<div className="typo-caption-1 text-dnd-label-alternative">
					인사이트
				</div>
			</div>
			<p className="typo-headline-2 whitespace-pre-wrap font-medium text-dnd-label-strong">
				{content}
			</p>
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
