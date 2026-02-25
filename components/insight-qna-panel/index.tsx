"use client";

import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnswerCardsSection } from "./answer-cards-section";
import { QuestionSection } from "./question-section";

export type QnAMode = "questions" | "answers";

interface InsightQnAPanelProps {
	insightId: number;
}

export function InsightQnAPanel({ insightId }: InsightQnAPanelProps) {
	const [mode, setMode] = useState<QnAMode>("questions");

	return (
		<div className="w-[436px] h-[calc(100vh-100px)] sticky top-[80px] rounded-[32px] shadow-sm bg-[var(--dnd-bg-question)] flex flex-col overflow-hidden border border-[var(--dnd-line-normal)]">
			<QuestionSectionHeader onExpand={() => setMode("questions")} />

			<div
				className={cn(
					"relative no-scrollbar transition-all duration-300 ease-in-out",
					mode === "questions"
						? "flex-1 min-h-0 overflow-y-auto p-6 opacity-100"
						: "flex-none h-0 overflow-hidden px-6 py-0 opacity-0 pointer-events-none",
				)}
			>
				<QuestionSection insightId={insightId} />
			</div>

			<div
				className={cn(
					"flex flex-col transition-all duration-300 ease-in-out rounded-t-[32px] overflow-hidden",
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
							? "flex-1 overflow-y-auto p-[32px] opacity-100"
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
	onExpand: () => void;
}

function QuestionSectionHeader({ onExpand }: QuestionSectionHeaderProps) {
	return (
		<button
			type="button"
			className="px-[32px] py-[16px] flex justify-between items-center bg-[var(--dnd-bg-question)] rounded-t-[32px]"
			onClick={onExpand}
		>
			<h2 className="typo-headline-1 font-medium text-[var(--dnd-label-normal)]">
				제안된 질문
			</h2>
			<Image src="/history-icon.svg" alt="history" width={20} height={20} />
		</button>
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
				"w-full px-[32px] py-[16px] flex justify-between items-center border-b border-[var(--dnd-line-normal)] cursor-pointer rounded-t-[32px]",
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
		<div className="w-[436px] h-[calc(100vh-100px)] sticky top-[80px] rounded-[32px] shadow-sm bg-[var(--dnd-bg-question)] flex flex-col overflow-hidden border border-[var(--dnd-line-normal)]">
			<div className="flex-1 flex flex-col">
				<div className="px-[32px] py-[16px] flex justify-between items-center rounded-t-[32px]">
					<div className="h-6 w-24 bg-[var(--dnd-fill-strong)] rounded-md" />
					<div className="w-6 h-6 bg-[var(--dnd-fill-normal)] rounded-full" />
				</div>
				<div className="p-6 flex-1 flex flex-col gap-2">
					<div className="h-10 w-full bg-white rounded-full" />
					<div className="h-10 w-3/4 bg-white rounded-full" />
					<div className="h-10 w-5/6 bg-white rounded-full" />
					<div className="mt-4 h-10 w-[140px] bg-white rounded-lg border border-[var(--dnd-line-strong)]" />
				</div>
			</div>
			<div className="h-[60px] bg-white rounded-t-[32px] border-b border-[var(--dnd-line-normal)] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-center justify-between px-[32px]">
				<div className="h-6 w-20 bg-[var(--dnd-fill-strong)] rounded-md" />
				<div className="w-6 h-6 bg-[var(--dnd-fill-normal)] rounded-md" />
			</div>
		</div>
	);
}
