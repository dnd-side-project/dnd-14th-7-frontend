"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InsightPiece } from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";

export function InsightPieceItem({
	piece,
	index,
}: {
	piece: InsightPiece;
	index: number;
}) {
	const [mode, setMode] = useState<"DEFAULT" | "LOADING" | "SELECTING">(
		"DEFAULT",
	);
	const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<
		number | null
	>(null);
	const [currentContent, setCurrentContent] = useState(piece.content);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;
		if (mode === "LOADING") {
			timeout = setTimeout(() => {
				setMode("SELECTING");
			}, 1500);
		}
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	}, [mode]);

	const candidates = [
		piece.content,
		"로그는 추측에 의존하는 디버깅 리소스를 데이터 기반의 확신으로 전환하여 가설 검증 비용을 최소화하는 핵심 증거이다.",
		"에러 발생 당시의 구체적인 맥락을 박제하는 로깅은 장애 재현의 불확실성을 제거하고 시스템의 관측 가능성을 완성한다.",
		"사후 분석을 넘어 선제적 장애 예방을 위한 핵심 자산이다.",
	];

	const getLabel = (type: InsightPiece["createdType"]) => {
		switch (type) {
			case "INIT":
				return "첫 생각";
			case "SELF":
				return "나의 생각";
			case "ANSWER":
				return "질문 답변";
			default:
				return "생각";
		}
	};

	const getFormattedDate = (dateString: string) => {
		const { year, month, day, weekday } = formatDate(dateString);
		return `${year}.${month}.${day} ${weekday}`;
	};

	switch (mode) {
		case "DEFAULT": {
			return (
				<div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 group">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--dnd-bg-insight-box)] text-[var(--dnd-primary)] typo-caption-2 font-bold shrink-0">
								{index + 1}
							</span>
							<div className="typo-caption-1 text-[var(--dnd-label-alternative)]">
								{getLabel(piece.createdType)} ·{" "}
								{getFormattedDate(piece.createdDate)}
							</div>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger
								className="text-[var(--dnd-label-assistive)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0 select-none outline-none"
								aria-label="인사이트 메뉴"
							>
								<Image
									src="/kebab-icon.svg"
									alt="더보기"
									width={24}
									height={24}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-[172px] rounded-[16px] p-2 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)] border-none flex flex-col gap-1"
							>
								<DropdownMenuItem
									className="p-3 rounded-xl bg-[var(--dnd-bg-alternative)] cursor-pointer flex items-start gap-3 w-[156px] focus:bg-[var(--dnd-bg-alternative)]"
									onClick={() => setMode("LOADING")}
								>
									<div className="flex bg-[#ffcccb] opacity-50 absolute inset-0 mix-blend-multiply pointer-events-none hidden"></div>
									<Image
										src="/re-try.svg"
										alt="재시도"
										width={24}
										height={24}
										className="shrink-0"
									/>
									<div className="flex flex-col gap-1 w-full text-left">
										<span className="typo-body-1 font-medium text-[var(--dnd-label-neutral)] leading-tight !text-[var(--dnd-label-neutral)]">
											재시도
										</span>
										<span className="typo-label-2 text-[var(--dnd-label-alternative)] leading-[1.2] whitespace-pre-wrap break-keep !text-[var(--dnd-label-alternative)]">
											3개의 인사이트 후보를 추가로 받아볼 수 있어요
										</span>
									</div>
								</DropdownMenuItem>

								<DropdownMenuSeparator className="bg-[var(--dnd-line-normal)] my-1" />

								<DropdownMenuItem className="px-3 h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)] cursor-pointer focus:bg-[var(--dnd-bg-alternative)] flex items-center gap-3">
									<Image src="/edit.svg" alt="수정" width={24} height={24} />
									수정
								</DropdownMenuItem>
								<DropdownMenuItem className="px-3 h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-label-neutral)] cursor-pointer focus:bg-[var(--dnd-bg-alternative)] flex items-center gap-3">
									<Image
										src="/copy.svg"
										alt="텍스트 복사"
										width={24}
										height={24}
									/>
									텍스트 복사
								</DropdownMenuItem>

								<DropdownMenuItem className="px-3 h-[48px] rounded-lg typo-body-1 font-normal text-[var(--dnd-status-negative)] cursor-pointer focus:bg-[var(--dnd-bg-alternative)] focus:text-[var(--dnd-status-negative)] flex items-center gap-3">
									<Image src="/delete.svg" alt="삭제" width={24} height={24} />
									삭제
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<p className="typo-headline-2 text-[var(--dnd-label-strong)] whitespace-pre-wrap">
						{currentContent}
					</p>
				</div>
			);
		}
		case "LOADING": {
			return (
				<div className="bg-white rounded-[24px] p-6 flex flex-col gap-6">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--dnd-bg-insight-box)] text-[var(--dnd-primary)] typo-caption-2 font-bold shrink-0">
								{index + 1}
							</span>
							<div className="typo-caption-1 text-[var(--dnd-label-alternative)]">
								{getLabel(piece.createdType)} ·{" "}
								{getFormattedDate(piece.createdDate)}
							</div>
						</div>
					</div>
					<p className="typo-headline-2 text-[var(--dnd-primary)] whitespace-pre-wrap animate-pulse">
						AI가 생각을 정리하는 중...
					</p>
				</div>
			);
		}

		case "SELECTING": {
			return (
				<div className="bg-white rounded-[24px] p-6 flex flex-col gap-3">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--dnd-bg-insight-box)] text-[var(--dnd-primary)] typo-caption-2 font-bold shrink-0">
								{index + 1}
							</span>
							<div className="typo-caption-1 text-[var(--dnd-label-alternative)]">
								{getLabel(piece.createdType)} ·{" "}
								{getFormattedDate(piece.createdDate)}
							</div>
						</div>
					</div>
					{candidates.map((candidate, candidateIndex) => {
						const isSelected = selectedCandidateIndex === candidateIndex;
						const isOriginal = candidateIndex === 0;

						const candidateStyle = isSelected
							? "bg-[var(--dnd-bg-mint2)] border border-[var(--dnd-primary)] text-[var(--dnd-label-strong)]"
							: isOriginal
								? "bg-[var(--dnd-bg-alternative)] text-[var(--dnd-label-strong)] hover:bg-[#ebebeb]"
								: "bg-[var(--dnd-bg-mint2)] text-[var(--dnd-label-strong)] hover:bg-[#e1f5f3]";

						return (
							// biome-ignore lint/a11y/useKeyWithClickEvents: Selection item
							<div
								key={candidateIndex}
								onClick={() => setSelectedCandidateIndex(candidateIndex)}
								className={`p-4 rounded-[16px] cursor-pointer transition-colors text-[20px] font-medium leading-[1.4] tracking-[-0.24px] whitespace-pre-wrap ${candidateStyle}`}
							>
								{candidate}
							</div>
						);
					})}
					<div className="flex justify-end items-center gap-2">
						<button
							type="button"
							className="px-7 py-3 rounded-[12px] typo-body-1 font-medium bg-[var(--dnd-bg-alternative)] text-[var(--dnd-label-neutral)] hover:bg-[#ebebeb] transition-colors"
							onClick={() => {
								setMode("DEFAULT");
								setSelectedCandidateIndex(null);
							}}
						>
							취소
						</button>
						<button
							type="button"
							className={`px-7 py-3 rounded-[12px] typo-body-1 font-semibold transition-colors ${
								selectedCandidateIndex !== null
									? "bg-[#51ccbd] text-white hover:bg-[#43bfb0]"
									: "bg-[var(--dnd-interaction-disable)] text-[var(--dnd-label-assistive)] cursor-not-allowed"
							}`}
							onClick={() => {
								if (selectedCandidateIndex !== null) {
									setCurrentContent(candidates[selectedCandidateIndex]);
									setMode("DEFAULT");
									setSelectedCandidateIndex(null);
								}
							}}
							disabled={selectedCandidateIndex === null}
						>
							선택
						</button>
					</div>
				</div>
			);
		}
	}
	return null;
}
