"use client";

import { useCallback, useRef, useState } from "react";
import type { InsightPiece } from "@/lib/queries/insight";
import { DefaultModeView } from "./default-mode-view";
import { LoadingModeView } from "./loading-mode-view";
import { SelectingModeView } from "./selecting-mode-view";

type Mode = "DEFAULT" | "LOADING" | "SELECTING";

export function InsightPieceItem({
	piece,
	index,
}: {
	piece: InsightPiece;
	index: number;
}) {
	const [mode, setMode] = useState<Mode>("DEFAULT");
	const [currentContent, setCurrentContent] = useState(piece.content);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handleRetry = useCallback(() => {
		setMode("LOADING");
		timeoutRef.current = setTimeout(() => {
			setMode("SELECTING");
		}, 1500);
	}, []);

	const handleCancel = useCallback(() => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setMode("DEFAULT");
	}, []);

	const candidates = [
		piece.content,
		"로그는 추측에 의존하는 디버깅 리소스를 데이터 기반의 확신으로 전환하여 가설 검증 비용을 최소화하는 핵심 증거이다.",
		"에러 발생 당시의 구체적인 맥락을 박제하는 로깅은 장애 재현의 불확실성을 제거하고 시스템의 관측 가능성을 완성한다.",
		"사후 분석을 넘어 선제적 장애 예방을 위한 핵심 자산이다.",
	];

	const overlay = mode !== "DEFAULT" && (
		<div className="fixed inset-0 bg-black/50 z-40" />
	);

	switch (mode) {
		case "DEFAULT":
			return (
				<DefaultModeView
					piece={piece}
					index={index}
					currentContent={currentContent}
					onRetry={handleRetry}
				/>
			);
		case "LOADING":
			return (
				<>
					{overlay}
					<LoadingModeView piece={piece} index={index} />
				</>
			);
		case "SELECTING":
			return (
				<>
					{overlay}
					<SelectingModeView
						piece={piece}
						index={index}
						candidates={candidates}
						onCancel={handleCancel}
						onSelect={(content) => {
							setCurrentContent(content);
							setMode("DEFAULT");
						}}
					/>
				</>
			);
	}
}
