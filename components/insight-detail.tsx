"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GetInsightResponse, InsightPiece } from "@/lib/queries/insight";
import {
	insightDetailQueryOptions,
	insightPiecesQueryOptions,
} from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";

interface InsightDetailSectionProps {
	insightId: number;
}

export function InsightDetailSection({ insightId }: InsightDetailSectionProps) {
	return (
		<ErrorBoundary fallback={<div>Error loading insight</div>}>
			<Suspense fallback={<InsightDetailSkeleton />}>
				<InsightDetailContent insightId={insightId} />
			</Suspense>
		</ErrorBoundary>
	);
}

function InsightDetailSkeleton() {
	return (
		<div className="flex gap-10 justify-center p-[80px] animate-pulse">
			<div className="w-full flex flex-col gap-6">
				<div className="flex justify-between items-start">
					<div className="flex flex-col gap-6 w-full">
						<div className="h-10 w-2/3 bg-[var(--dnd-fill-strong)] rounded-md" />
						<div className="flex flex-col gap-4">
							<div className="h-5 w-1/3 bg-[var(--dnd-fill-normal)] rounded-md" />
							<div className="flex gap-2">
								<div className="h-7 w-16 bg-[var(--dnd-fill-normal)] rounded-[10px]" />
								<div className="h-7 w-16 bg-[var(--dnd-fill-normal)] rounded-[10px]" />
								<div className="h-7 w-16 bg-[var(--dnd-fill-normal)] rounded-[10px]" />
							</div>
						</div>
					</div>
					<div className="w-6 h-6 bg-[var(--dnd-fill-normal)] rounded-full shrink-0" />
				</div>

				<div className="bg-[var(--dnd-bg-alternative)] rounded-3xl p-6 h-[72px] w-full flex items-center gap-4">
					<div className="h-6 w-16 bg-[var(--dnd-fill-normal)] rounded-[4px]" />
					<div className="h-6 w-2/3 bg-[var(--dnd-fill-normal)] rounded-md" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-8 w-24 bg-[var(--dnd-fill-normal)] rounded-md" />
					<div className="bg-[var(--dnd-bg-insight-box)] rounded-[32px] p-6 gap-4 flex flex-col">
						<div className="bg-white rounded-[24px] p-6 h-32 w-full" />
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-5 w-10 bg-[var(--dnd-fill-normal)] rounded-md" />
					<div className="h-[80px] w-full bg-[var(--dnd-fill-normal)] rounded-xl border border-[var(--dnd-line-normal)]" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-5 w-10 bg-[var(--dnd-fill-normal)] rounded-md" />
					<div className="flex gap-3">
						<div className="h-[46px] flex-[1] bg-[var(--dnd-fill-normal)] rounded-xl border border-[var(--dnd-line-normal)]" />
						<div className="h-[46px] flex-[2] bg-[var(--dnd-fill-normal)] rounded-xl border border-[var(--dnd-line-normal)]" />
						<div className="h-[46px] w-[86px] bg-[var(--dnd-fill-normal)] rounded-xl" />
					</div>
				</div>
			</div>

			{/* Q&A Panel Skeleton */}
			<InsightQnAPanelSkeleton />
		</div>
	);
}

import { InsightQnAPanel, InsightQnAPanelSkeleton } from "./insight-qna-panel";

function InsightDetailContent({ insightId }: { insightId: number }) {
	const { data } = useSuspenseQuery(insightDetailQueryOptions(insightId));
	const { data: piecesData } = useSuspenseQuery(
		insightPiecesQueryOptions(insightId),
	);

	return (
		<div className="flex gap-[80px] justify-center pl-[80px] pr-[24px]">
			<div className="w-full flex flex-col gap-6 pt-[80px] pb-[80px]">
				<InsightHeader data={data} />
				<InitialThoughtBox initialThought={data.initialThought} />
				<MainInsightBox insightPieces={piecesData.insightPieces} />
				<MemoSection />
				<LinkSection />
			</div>
			<div className="pt-[24px] pb-[24px]">
				<InsightQnAPanel insightId={insightId} />
			</div>
		</div>
	);
}

function InsightHeader({ data }: { data: GetInsightResponse }) {
	const createdDate = formatDate(data.createdDate);
	const updatedDate = formatDate(data.updatedDate);

	const createdDateStr = `${createdDate.year}.${createdDate.month}.${createdDate.day} ${createdDate.weekday} ${createdDate.ampm} ${createdDate.formattedHours}:${createdDate.minutes}`;
	const modifiedDateStr = `${updatedDate.year}.${updatedDate.month}.${updatedDate.day} ${updatedDate.weekday} (수정)`;

	const getTagStyle = (tagId: number) => {
		const colors = [
			"dnd-tag-brown",
			"dnd-tag-red",
			"dnd-tag-orange",
			"dnd-tag-yellow",
			"dnd-tag-green",
			"dnd-tag-teal",
			"dnd-tag-blue",
			"dnd-tag-purple",
			"dnd-tag-pink",
		];
		const index = Math.abs(tagId - 1) % colors.length;
		return colors[index];
	};

	return (
		<div className="flex justify-between items-start">
			<div className="flex flex-col gap-6">
				<h1 className="typo-title-1 font-bold text-[var(--dnd-label-strong)]">
					{data.title}
				</h1>
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2 typo-body-2 text-[var(--dnd-label-alternative)]">
						<span>{createdDateStr}</span>
						<span className="w-[1px] h-3 bg-[var(--dnd-line-normal)]" />
						<span>{modifiedDateStr}</span>
					</div>
					<div className="flex gap-[8px]">
						{data.tags.map((tag) => (
							<span
								key={tag.tagId}
								className={`rounded-[10px] px-[11px] py-[7px] typo-caption-1 font-bold ${getTagStyle(tag.tagId)}`}
							>
								{tag.tagName}
							</span>
						))}
					</div>
				</div>
			</div>
			<button type="button" className="p-2 text-[var(--dnd-label-alternative)]">
				<MoreVertical size={24} />
			</button>
		</div>
	);
}

function InitialThoughtBox({ initialThought }: { initialThought: string }) {
	return (
		<div className="bg-[var(--dnd-bg-alternative)] rounded-3xl px-6 py-5 flex items-center gap-4">
			<span className="bg-[var(--dnd-fill-normal)] text-[var(--dnd-label-alternative)] rounded-[4px] px-2 py-1 typo-caption-1 font-medium shrink-0">
				첫 생각
			</span>
			<p className="typo-body-1 text-[var(--dnd-label-normal)]">
				{initialThought}
			</p>
		</div>
	);
}

function MainInsightBox({ insightPieces }: { insightPieces: InsightPiece[] }) {
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

	return (
		<div className="flex flex-col gap-3">
			<span className="typo-headline-2 font-bold text-[var(--dnd-label-neutral)]">
				인사이트{" "}
				<span className="text-[var(--dnd-primary)]">
					{insightPieces.length}
				</span>
			</span>
			<div className="rounded-[32px] p-6 flex flex-col gap-4 bg-dnd-bg-insight-box">
				{insightPieces.map((piece, index) => (
					<div
						key={piece.insightPieceId}
						className="bg-white rounded-[24px] p-6 flex flex-col gap-6 group"
					>
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
									<DropdownMenuItem className="p-3 rounded-xl bg-[var(--dnd-bg-alternative)] cursor-pointer flex items-start gap-3 w-[156px] focus:bg-[var(--dnd-bg-alternative)]">
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
										<Image
											src="/delete.svg"
											alt="삭제"
											width={24}
											height={24}
										/>
										삭제
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<p className="typo-headline-2 text-[var(--dnd-label-strong)] whitespace-pre-wrap">
							{piece.content}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

function MemoSection() {
	return (
		<div className="flex flex-col gap-3">
			<label
				htmlFor="memo"
				className="typo-label-1 font-bold text-[var(--dnd-label-alternative)]"
			>
				메모
			</label>
			<textarea
				id="memo"
				className="w-full bg-transparent border border-[var(--dnd-line-normal)] rounded-xl p-4 min-h-[80px] placeholder-[var(--dnd-label-assistive)] typo-body-2 focus:outline-none focus:border-[var(--dnd-primary)] transition-colors resize-none"
				placeholder="상황, 참고내용 등 추가 메모를 입력해주세요."
			/>
		</div>
	);
}

function LinkSection() {
	return (
		<div className="flex flex-col gap-3">
			<label
				htmlFor="link"
				className="typo-label-1 font-bold text-[var(--dnd-label-alternative)]"
			>
				링크
			</label>
			<div className="flex gap-3">
				<input
					type="text"
					id="link-title"
					name="link-title"
					className="flex-[1] bg-transparent border border-[var(--dnd-line-normal)] rounded-xl px-4 py-3 placeholder-[var(--dnd-label-assistive)] typo-body-2 focus:outline-none focus:border-[var(--dnd-primary)] transition-colors"
					placeholder="링크 제목"
				/>
				<input
					type="text"
					id="link-url"
					name="link-url"
					className="flex-[2] bg-transparent border border-[var(--dnd-line-normal)] rounded-xl px-4 py-3 placeholder-[var(--dnd-label-assistive)] typo-body-2 focus:outline-none focus:border-[var(--dnd-primary)] transition-colors"
					placeholder="https://"
				/>
				<button
					type="button"
					className="bg-[var(--dnd-bg-alternative)] text-[var(--dnd-label-assistant)] px-6 rounded-xl typo-body-2 font-medium hover:bg-[var(--dnd-fill-normal)] transition-colors"
				>
					추가하기
				</button>
			</div>
		</div>
	);
}
