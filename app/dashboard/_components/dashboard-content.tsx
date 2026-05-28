"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { InsightDetailSection } from "@/components/insight-detail";
import { InsightInput } from "@/components/insight-input";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import type { InsightSummary } from "@/lib/queries/insight";
import { insightsQueryOptions } from "@/lib/queries/insight";
import { tagsQueryOptions } from "@/lib/queries/user";
import { deserializeTab } from "@/lib/tabs/tab-utils";
import { formatDate } from "@/lib/utils/date";
import { HomeInsightCard } from "./home-insight-card";
import {
	HomeInsightList,
	HomeTitleHeader,
	HomeToggleHeader,
} from "./home-insight-list";
import { HomeTagCard } from "./home-tag-card";
import { TagPage } from "./tag-page";

const INSIGHT_SKELETON_KEYS = [
	"insight-skeleton-1",
	"insight-skeleton-2",
	"insight-skeleton-3",
	"insight-skeleton-4",
];
const TAG_SKELETON_KEYS = [
	"tag-skeleton-1",
	"tag-skeleton-2",
	"tag-skeleton-3",
	"tag-skeleton-4",
];

function formatInsightDate(dateString: string) {
	const { year, month, day } = formatDate(dateString);
	return `${year}. ${month}. ${day}.`;
}

function getInsightTitle(insight: InsightSummary) {
	return insight.title || "제목 없는 인사이트";
}

function buildTagPreviewMap(insights: InsightSummary[]) {
	const previewMap = new Map<number, { id: number; title: string }[]>();

	for (const insight of insights) {
		for (const tag of insight.tags) {
			const previews = previewMap.get(tag.tagId) ?? [];
			if (previews.length < 3) {
				previews.push({
					id: insight.insightId,
					title: getInsightTitle(insight),
				});
				previewMap.set(tag.tagId, previews);
			}
		}
	}

	return previewMap;
}

function HomePage() {
	const { dispatch } = useDashboardTabs();
	const [isLatest, setIsLatest] = useState(true);
	const sort = isLatest ? "LATEST" : "VIEWS";
	const {
		data: insightsData,
		isError: isInsightsError,
		isLoading: isInsightsLoading,
	} = useQuery(insightsQueryOptions({ page: 0, size: 12, sort }));
	const {
		data: tags = [],
		isError: isTagsError,
		isLoading: isTagsLoading,
	} = useQuery(tagsQueryOptions());
	const insights = insightsData?.content ?? [];
	const tagPreviewMap = buildTagPreviewMap(insights);

	const openInsight = (id: number) => {
		dispatch(
			{ type: "add", tab: `insight:${id}` },
			{ type: "activate", tab: `insight:${id}` },
		);
	};

	const openTag = (id: number, name: string) => {
		dispatch(
			{ type: "add", tab: `tag:${id}:${name}` },
			{ type: "activate", tab: `tag:${id}:${name}` },
		);
	};

	return (
		<div className="flex flex-col items-center gap-[80px] w-full pb-[100px] pt-[60px] max-w-[1200px] mx-auto px-[40px]">
			<div className="flex flex-col items-center gap-[24px]">
				<Image
					src="/ahaive.svg"
					alt="Aha!ve"
					width={280}
					height={63}
					priority
				/>
			</div>

			<InsightInput
				titleClassName="text-center w-full"
				onSuccess={(id) =>
					dispatch({
						type: "add",
						tab: `insight:${id}`,
					})
				}
			/>

			<div className="flex flex-col gap-[80px] w-full mt-[40px]">
				<HomeInsightList
					header={
						<HomeToggleHeader isLatest={isLatest} onToggle={setIsLatest} />
					}
					onMoreClick={() => {}}
				>
					{isInsightsLoading
						? INSIGHT_SKELETON_KEYS.map((key) => <HomeCardSkeleton key={key} />)
						: isInsightsError
							? [
									<EmptyHomeCard
										key="insights-error"
										message="인사이트를 불러오지 못했어요."
									/>,
								]
							: insights.length > 0
								? insights.map((insight) => (
										<HomeInsightCard
											key={`insight-${insight.insightId}`}
											id={insight.insightId}
											title={getInsightTitle(insight)}
											content={insight.confirmedContent}
											date={formatInsightDate(insight.createdDate)}
											tags={insight.tags.map((tag) => ({
												id: tag.tagId,
												name: tag.tagName,
											}))}
											onOpen={() => openInsight(insight.insightId)}
										/>
									))
								: [
										<EmptyHomeCard
											key="empty-insights"
											message="아직 생성한 인사이트가 없어요."
										/>,
									]}
				</HomeInsightList>

				<HomeInsightList
					header={
						<HomeTitleHeader
							title="태그"
							icon={
								<Image src="/hash-tag.svg" alt="#" width={19} height={19} />
							}
						/>
					}
					onMoreClick={() => {}}
				>
					{isTagsLoading
						? TAG_SKELETON_KEYS.map((key) => <HomeCardSkeleton key={key} />)
						: isTagsError
							? [
									<EmptyHomeCard
										key="tags-error"
										message="태그를 불러오지 못했어요."
									/>,
								]
							: tags.length > 0
								? tags.map((tag) => (
										<HomeTagCard
											key={`tag-${tag.tagId}`}
											id={tag.tagId}
											name={tag.tagName}
											insights={tagPreviewMap.get(tag.tagId) ?? []}
											totalCount={tag.insightCount}
											onOpen={() => openTag(tag.tagId, tag.tagName)}
										/>
									))
								: [
										<EmptyHomeCard
											key="empty-tags"
											message="아직 등록된 태그가 없어요."
										/>,
									]}
				</HomeInsightList>
			</div>
		</div>
	);
}

function HomeCardSkeleton() {
	return (
		<div className="flex h-[292px] w-[260px] shrink-0 flex-col gap-[28px] rounded-[24px] border border-dnd-line-alternative bg-white p-[24px] shadow-dnd-normal animate-pulse">
			<div className="flex flex-col gap-[8px]">
				<div className="h-[22px] w-3/4 rounded-md bg-dnd-fill-normal" />
				<div className="h-[14px] w-1/3 rounded-md bg-dnd-fill-normal" />
			</div>
			<div className="flex flex-col gap-[6px]">
				<div className="h-[18px] w-full rounded-md bg-dnd-fill-normal" />
				<div className="h-[18px] w-5/6 rounded-md bg-dnd-fill-normal" />
				<div className="h-[18px] w-2/3 rounded-md bg-dnd-fill-normal" />
			</div>
			<div className="flex gap-[8px]">
				<div className="h-[28px] w-[54px] rounded-[8px] bg-dnd-fill-normal" />
				<div className="h-[28px] w-[54px] rounded-[8px] bg-dnd-fill-normal" />
			</div>
		</div>
	);
}

function EmptyHomeCard({ message }: { message: string }) {
	return (
		<div className="flex h-[180px] w-[280px] shrink-0 items-center justify-center rounded-[24px] border border-dashed border-dnd-line-normal bg-white px-[24px] text-center typo-body-1 text-dnd-label-alternative">
			{message}
		</div>
	);
}

function NewInsightPage() {
	const { dispatch } = useDashboardTabs();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-[40px] px-[240px]">
			<InsightInput
				onSuccess={(id) =>
					dispatch({
						type: "replace",
						targetTab: "new",
						newTab: `insight:${id}`,
					})
				}
			/>
		</div>
	);
}

export function DashboardContent() {
	const { state } = useDashboardTabs();
	const currentTabObj = deserializeTab(state.currentTab);

	switch (currentTabObj.type) {
		case "home":
			return <HomePage />;
		case "new":
			return <NewInsightPage />;
		case "insight":
			return <InsightDetailSection insightId={Number(currentTabObj.id)} />;
		case "trash":
			return <div className="p-4">휴지통 화면 (준비중)</div>;
		case "tag":
			return (
				<TagPage
					tagId={Number(currentTabObj.id)}
					tagName={currentTabObj.name}
				/>
			);
		default:
			throw new Error("유효하지 않은 탭 타입입니다.");
	}
}
