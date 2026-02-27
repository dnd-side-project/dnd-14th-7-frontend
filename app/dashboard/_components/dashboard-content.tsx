"use client";

import Image from "next/image";
import { useState } from "react";
import { InsightDetailSection } from "@/components/insight-detail";
import { InsightInput } from "@/components/insight-input";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import { deserializeTab } from "@/lib/tabs/tab-utils";
import { HomeInsightCard } from "./home-insight-card";
import {
	HomeInsightList,
	HomeTitleHeader,
	HomeToggleHeader,
} from "./home-insight-list";
import { HomeTagCard } from "./home-tag-card";
import { TagPage } from "./tag-page";

const mockInsights = Array.from({ length: 5 }).map((_, i) => ({
	id: i + 1,
	title: "서버로그의 중요성",
	content:
		"서버 코드에 로그를 충분히 남겨두면 나중에 오류원인 찾을 때 편리하다. 서버 코드에 로그를 충분히 남겨두면 나중에 오류원인 찾을 때 편리하다, 서버 코드에 로그를 충분히 남겨두면 나중에 오류원인 찾을 때 편리하다.",
	date: "2026. 1. 11.",
	tags: [
		{ id: 1, name: "개발", colorClass: "dnd-tag-purple" },
		{ id: 2, name: "디버깅", colorClass: "dnd-tag-green" },
		{ id: 3, name: "로그", colorClass: "dnd-tag-red" },
	],
}));

const mockTags = Array.from({ length: 5 }).map((_, i) => ({
	id: i + 1,
	name: "개발",
	insights: [
		{ id: 1, title: "서버로그의 중요성" },
		{ id: 2, title: "서버로그의 중요성" },
		{ id: 3, title: "서버로그의 중요성" },
	],
	totalCount: 7,
}));

function HomePage() {
	const { dispatch } = useDashboardTabs();
	const [isLatest, setIsLatest] = useState(true);

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
					{mockInsights.map((insight) => (
						<HomeInsightCard key={`insight-${insight.id}`} {...insight} />
					))}
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
					{mockTags.map((tag) => (
						<HomeTagCard key={`tag-${tag.id}`} {...tag} />
					))}
				</HomeInsightList>

				<HomeInsightList
					header={
						<HomeTitleHeader
							title="잊고 있던 인사이트"
							icon={
								<Image
									src="/exclamation-mark.svg"
									alt="!"
									width={3}
									height={21}
								/>
							}
						/>
					}
					onMoreClick={() => {}}
				>
					{mockInsights.map((insight) => (
						<HomeInsightCard key={`forgotten-${insight.id}`} {...insight} />
					))}
				</HomeInsightList>
			</div>
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
