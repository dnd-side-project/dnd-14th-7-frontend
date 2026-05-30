"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InsightPiece } from "@/lib/queries/insight";
import { DefaultModeView } from "./default-mode-view";
import { LoadingModeView } from "./loading-mode-view";
import { type RetryCandidate, SelectingModeView } from "./selecting-mode-view";

type RetryState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "selecting"; candidates: RetryCandidate[] };

const RETRY_DELAY_MS = 800;

function createMockCandidates(content: string): RetryCandidate[] {
	return [
		{
			id: "evidence-based-debugging",
			content:
				"로그는 추측에 의존하는 디버깅을 데이터 기반의 판단으로 전환해 문제 원인 파악 비용을 줄여준다.",
		},
		{
			id: "context-preserving-logging",
			content:
				"에러 발생 당시의 맥락을 남기는 로깅은 장애 재현의 불확실성을 낮추고 시스템 관측 가능성을 높인다.",
		},
		{
			id: "proactive-incident-prevention",
			content:
				content.length > 80
					? "잘 설계된 로그는 사후 분석을 넘어 반복되는 장애 패턴을 발견하고 선제적으로 예방하는 자산이 된다."
					: "로그는 사후 분석뿐 아니라 반복되는 장애를 미리 발견하고 예방하는 데 필요한 핵심 자산이다.",
		},
	];
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
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const clearRetryTimer = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const handleRetry = useCallback(() => {
		clearRetryTimer();
		onRetryStart(piece.insightPieceId);
		setRetryState({ status: "loading" });
		timeoutRef.current = setTimeout(() => {
			setRetryState({
				status: "selecting",
				candidates: createMockCandidates(piece.content),
			});
			timeoutRef.current = null;
		}, RETRY_DELAY_MS);
	}, [clearRetryTimer, onRetryStart, piece.content, piece.insightPieceId]);

	const handleCancel = useCallback(() => {
		clearRetryTimer();
		setRetryState({ status: "idle" });
		onRetryEnd();
	}, [clearRetryTimer, onRetryEnd]);

	const handleSelect = useCallback(
		(content: string) => {
			setGeneratedContents((prev) => [...prev, content]);
			setRetryState({ status: "idle" });
			onRetryEnd();
		},
		[onRetryEnd],
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
				<LoadingModeView onCancel={handleCancel} />
			)}
			{retryState.status === "selecting" && (
				<SelectingModeView
					candidates={retryState.candidates}
					onCancel={handleCancel}
					onSelect={handleSelect}
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
