"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import type { InsightSummary } from "@/lib/queries/insight";
import { insightsQueryOptions } from "@/lib/queries/insight";
import { formatDate } from "@/lib/utils/date";

interface TagPageProps {
	tagId: number;
	tagName: string;
}

export function TagPage({ tagId, tagName }: TagPageProps) {
	return (
		<div className="flex flex-col items-center w-full pb-[100px] pt-[60px]">
			<div className="w-full max-w-[1180px] mx-auto flex flex-col gap-[24px]">
				<TagPageHeader tagName={tagName} />
				<ErrorBoundary
					fallback={
						<div className="text-dnd-label-alternative">
							인사이트를 불러오는 중 오류가 발생했습니다.
						</div>
					}
				>
					<Suspense fallback={<TagPageSkeleton />}>
						<TagInsightGrid tagId={tagId} />
					</Suspense>
				</ErrorBoundary>
			</div>
		</div>
	);
}

function TagPageHeader({ tagName }: { tagName: string }) {
	return (
		<div className="flex gap-[12px] items-center">
			<div className="bg-white rounded-[12px] p-[14.4px] flex items-center justify-center shrink-0">
				<Image src="/hash-tag.svg" alt="#" width={24} height={24} />
			</div>
			<div className="flex flex-1 items-center justify-between">
				<h1 className="typo-title-1 font-bold text-dnd-label-normal">
					{tagName}
				</h1>
				<button type="button" className="p-2 text-dnd-label-alternative">
					<MoreVertical size={24} />
				</button>
			</div>
		</div>
	);
}

function TagInsightGrid({ tagId }: { tagId: number }) {
	const { data } = useSuspenseQuery(insightsQueryOptions({ tag: tagId }));
	const { dispatch } = useDashboardTabs();

	if (data.content.length === 0) {
		return (
			<div className="flex items-center justify-center py-[80px] text-dnd-label-alternative typo-headline-1">
				아직 이 태그에 인사이트가 없어요.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-4 gap-[24px]">
			{data.content.map((insight) => (
				<button
					key={insight.insightId}
					type="button"
					className="text-left"
					onClick={() =>
						dispatch(
							{
								type: "add",
								tab: `insight:${insight.insightId}`,
							},
							{
								type: "activate",
								tab: `insight:${insight.insightId}`,
							},
						)
					}
				>
					<InsightCard insight={insight} />
				</button>
			))}
		</div>
	);
}

function InsightCard({ insight }: { insight: InsightSummary }) {
	const { year, month, day } = formatDate(insight.createdDate);
	const dateStr = `${year}. ${month}. ${day}.`;

	return (
		<div className="flex flex-col p-[24px] items-start gap-[28px] bg-white rounded-[32px] border border-dnd-line-normal">
			<div className="flex flex-col gap-[4px] w-full">
				<div className="flex items-center justify-between w-full">
					<h3 className="typo-heading-1 font-semibold text-dnd-label-normal line-clamp-1">
						{insight.title}
					</h3>
					<button
						type="button"
						className="p-1 text-dnd-label-alternative"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreVertical size={24} />
					</button>
				</div>
				<span className="typo-label-1 text-dnd-label-alternative">
					{dateStr}
				</span>
			</div>

			<p className="typo-headline-1 font-normal text-dnd-label-neutral line-clamp-3 w-full">
				{insight.confirmedContent}
			</p>

			<div className="flex flex-wrap gap-[8px]">
				{insight.tags.map((tag) => (
					<span
						key={tag.tagId}
						className="px-[10px] py-[6px] rounded-[8px] typo-label-1 font-medium text-dnd-primary border border-dnd-primary/40 bg-dnd-primary/5"
					>
						{tag.tagName}
					</span>
				))}
			</div>
		</div>
	);
}

function TagPageSkeleton() {
	return (
		<div className="grid grid-cols-4 gap-[24px] animate-pulse">
			{Array.from({ length: 8 }).map((_, i) => (
				<div
					key={`skeleton-${i}`}
					className="flex flex-col p-[24px] gap-[28px] bg-white rounded-[32px] border border-dnd-line-normal"
				>
					<div className="flex flex-col gap-[4px]">
						<div className="h-[22px] w-3/4 bg-dnd-fill-normal rounded-md" />
						<div className="h-[14px] w-1/3 bg-dnd-fill-normal rounded-md" />
					</div>
					<div className="flex flex-col gap-[4px]">
						<div className="h-[18px] w-full bg-dnd-fill-normal rounded-md" />
						<div className="h-[18px] w-full bg-dnd-fill-normal rounded-md" />
						<div className="h-[18px] w-2/3 bg-dnd-fill-normal rounded-md" />
					</div>
					<div className="flex gap-[8px]">
						<div className="h-[26px] w-[48px] bg-dnd-fill-normal rounded-[8px]" />
						<div className="h-[26px] w-[48px] bg-dnd-fill-normal rounded-[8px]" />
					</div>
				</div>
			))}
		</div>
	);
}
