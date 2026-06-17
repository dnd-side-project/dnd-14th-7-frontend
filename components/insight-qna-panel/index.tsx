"use client";

import { ChevronsUpDown, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnswerCardsSection } from "./answer-cards-section";
import { QuestionSection } from "./question-section";

export type QnAMode = "questions" | "answers";
type QuestionMode = "current" | "history";

interface InsightQnAPanelProps {
	insightId: number;
}

export function InsightQnAPanel({ insightId }: InsightQnAPanelProps) {
	const [mode, setMode] = useState<QnAMode>("questions");
	const [questionMode, setQuestionMode] = useState<QuestionMode>("current");

	return (
		<div className="flex h-[min(520px,calc(100svh-120px))] min-h-96 w-full flex-col overflow-hidden rounded-3xl border border-[var(--dnd-line-normal)] bg-[var(--dnd-bg-question)] shadow-sm sm:rounded-4xl xl:sticky xl:top-20 xl:h-[calc(100vh-100px)] xl:w-109 xl:shrink-0">
			<QuestionSectionHeader
				mode={questionMode}
				onExpand={() => setMode("questions")}
				onToggleHistory={() =>
					setQuestionMode((currentMode) =>
						currentMode === "history" ? "current" : "history",
					)
				}
			/>

			<div
				className={cn(
					"relative no-scrollbar transition-all duration-300 ease-in-out",
					mode === "questions"
						? "flex-1 min-h-0 overflow-y-auto p-4 opacity-100 sm:p-6"
						: "flex-none h-0 overflow-hidden px-6 py-0 opacity-0 pointer-events-none",
				)}
			>
				<QuestionSection
					key={questionMode}
					insightId={insightId}
					mode={questionMode}
				/>
			</div>

			<div
				className={cn(
					"flex flex-col transition-all duration-300 ease-in-out rounded-t-4xl overflow-hidden",
					mode === "answers"
						? "flex-1 min-h-0 bg-[var(--dnd-bg-alternative)]"
						: "flex-none shadow-[0_-4px_10px_rgba(0,0,0,0.05)] bg-white",
				)}
			>
				<AnswerCardsSectionHeader
					mode={mode}
					onToggle={() =>
						setMode(mode === "questions" ? "answers" : "questions")
					}
				/>

				<div
					className={cn(
						"transition-all duration-300 ease-in-out bg-[var(--dnd-bg-alternative)]",
						mode === "answers"
							? "flex-1 overflow-y-auto p-4 opacity-100 sm:p-8"
							: "flex-none overflow-hidden h-0 p-0 opacity-0 pointer-events-none",
					)}
				>
					<AnswerCardsSection insightId={insightId} />
				</div>
			</div>
		</div>
	);
}

interface QuestionSectionHeaderProps {
	mode: QuestionMode;
	onExpand: () => void;
	onToggleHistory: () => void;
}

function QuestionSectionHeader({
	mode,
	onExpand,
	onToggleHistory,
}: QuestionSectionHeaderProps) {
	const isHistoryMode = mode === "history";

	return (
		<div className="flex items-center justify-between rounded-t-3xl bg-[var(--dnd-bg-question)] px-4 py-4 sm:rounded-t-4xl sm:px-8">
			<button type="button" className="text-left" onClick={onExpand}>
				<h2 className="typo-headline-1 font-medium text-[var(--dnd-label-normal)]">
					{isHistoryMode ? "질문 히스토리" : "제안된 질문"}
				</h2>
			</button>
			<div className="relative group/history">
				<button
					type="button"
					className="rounded-lg p-1 text-dnd-label-alternative hover:bg-white/50 hover:text-dnd-label-normal"
					onClick={() => {
						onExpand();
						onToggleHistory();
					}}
					aria-label={
						isHistoryMode ? "질문 히스토리 닫기" : "질문 히스토리 열기"
					}
				>
					{isHistoryMode ? (
						<X className="size-5" />
					) : (
						<Image src="/history-icon.svg" alt="" width={20} height={20} />
					)}
				</button>
				{!isHistoryMode && (
					<div className="pointer-events-none absolute top-full right-0 z-10 mt-2 w-48 rounded-lg bg-[var(--dnd-label-normal)] p-2.5 typo-body-2 text-sm text-[var(--dnd-bg-normal)] opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover/history:opacity-100">
						<div className="absolute top-[-6px] right-3 h-3 w-3 rotate-45 bg-[var(--dnd-label-normal)]" />
						<div className="text-center">이전 질문을 확인해보세요</div>
					</div>
				)}
			</div>
		</div>
	);
}

interface AnswerCardsSectionHeaderProps {
	mode: QnAMode;
	onToggle: () => void;
}

function AnswerCardsSectionHeader({
	mode,
	onToggle,
}: AnswerCardsSectionHeaderProps) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full cursor-pointer items-center justify-between rounded-t-3xl border-b border-[var(--dnd-line-normal)] px-4 py-4 sm:rounded-t-4xl sm:px-8",
				mode === "questions" ? "bg-white" : "bg-[var(--dnd-bg-alternative)]",
			)}
			onClick={onToggle}
			aria-expanded={mode === "answers"}
		>
			<h2 className="typo-headline-2 font-medium text-[var(--dnd-label-normal)]">
				답변카드
			</h2>
			<ChevronsUpDown size={24} />
		</button>
	);
}

export function InsightQnAPanelSkeleton() {
	return (
		<div className="flex h-[min(520px,calc(100svh-120px))] min-h-96 w-full flex-col overflow-hidden rounded-3xl border border-[var(--dnd-line-normal)] bg-[var(--dnd-bg-question)] shadow-sm sm:rounded-4xl xl:sticky xl:top-20 xl:h-[calc(100vh-100px)] xl:w-109 xl:shrink-0">
			<div className="flex-1 flex flex-col">
				<div className="flex items-center justify-between rounded-t-3xl px-4 py-4 sm:rounded-t-4xl sm:px-8">
					<div className="h-6 w-24 animate-pulse rounded-md bg-[var(--dnd-fill-strong)]" />
					<div className="h-6 w-6 animate-pulse rounded-full bg-[var(--dnd-fill-normal)]" />
				</div>
				<div className="flex flex-1 flex-col gap-2 p-4 sm:p-6">
					<div className="h-10 w-full animate-pulse rounded-full bg-white" />
					<div className="h-10 w-3/4 animate-pulse rounded-full bg-white" />
					<div className="h-10 w-5/6 animate-pulse rounded-full bg-white" />
					<div className="mt-4 h-10 w-35 animate-pulse rounded-lg border border-[var(--dnd-line-strong)] bg-white" />
				</div>
			</div>
			<div className="flex h-15 items-center justify-between rounded-t-3xl border-b border-[var(--dnd-line-normal)] bg-white px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] sm:rounded-t-4xl sm:px-8">
				<div className="h-6 w-20 animate-pulse rounded-md bg-[var(--dnd-fill-strong)]" />
				<div className="h-6 w-6 animate-pulse rounded-md bg-[var(--dnd-fill-normal)]" />
			</div>
		</div>
	);
}
