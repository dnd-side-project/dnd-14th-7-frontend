"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Image from "next/image";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import { insightDetailQueryOptions } from "@/lib/queries/insight";
import type { Tab } from "@/lib/tabs/tab-utils";
import { deserializeTab } from "@/lib/tabs/tab-utils";

function InsightTabLabel({ insightId }: { insightId: number }) {
	const { data, isLoading } = useQuery(insightDetailQueryOptions(insightId));
	return <>{isLoading ? "인사이트 생성 중..." : data?.title || "인사이트"}</>;
}

export function DashboardTabBar() {
	const { state, dispatch } = useDashboardTabs();
	const currentTabKey = state.currentTab || "home";

	return (
		<div className="fixed left-[260px] top-0 right-0 z-10 flex h-[56px] items-center border-b border-[#e1e2e4] bg-dnd-bg-mint">
			<button
				type="button"
				onClick={() => dispatch({ type: "activate", tab: null })}
				className={`flex h-full shrink-0 items-center justify-center border-r border-[#e1e2e4] px-[16px] transition-colors ${
					currentTabKey === "home"
						? "bg-white"
						: "bg-dnd-bg-mint hover:bg-white/60"
				}`}
			>
				<Image src="/home.svg" alt="Home" width={24} height={24} />
			</button>

			<div role="tablist" className="flex flex-1 items-stretch overflow-x-auto">
				{state.openTabs.map((tabKey: string) => {
					const tab = deserializeTab(tabKey);
					return (
						<TabItem
							key={tabKey}
							tabKey={tabKey}
							tab={tab}
							isActive={currentTabKey === tabKey}
							onNavigate={(key) => dispatch({ type: "activate", tab: key })}
							onClose={(key) => dispatch({ type: "remove", tab: key })}
						/>
					);
				})}
			</div>

			<button
				type="button"
				className="flex h-full shrink-0 items-center justify-center px-[16px] text-dnd-label-neutral hover:text-dnd-label-normal"
			>
				<Search className="size-[20px]" />
			</button>
		</div>
	);
}

interface TabItemProps {
	tabKey: string;
	tab: Tab;
	isActive: boolean;
	onNavigate: (key: string) => void;
	onClose: (key: string) => void;
}

function TabItem({ tabKey, tab, isActive, onNavigate, onClose }: TabItemProps) {
	return (
		<div
			role="tab"
			tabIndex={0}
			aria-selected={isActive}
			className={`group flex h-[56px] w-[224px] shrink-0 cursor-pointer items-center gap-[8px] border-r border-[#e1e2e4] px-[16px] transition-colors ${
				isActive ? "bg-white" : "bg-dnd-bg-mint"
			}`}
			onClick={() => onNavigate(tabKey)}
			onKeyDown={(e) => e.key === "Enter" && onNavigate(tabKey)}
		>
			<span className="min-w-0 flex-1 truncate text-[17px] font-medium leading-[1.41] text-dnd-label-neutral">
				{tab.type === "new" ? (
					"새 페이지"
				) : tab.type === "insight" ? (
					<InsightTabLabel insightId={Number(tab.id)} />
				) : tab.type === "tag" ? (
					`태그 ${tab.name}`
				) : tab.type === "trash" ? (
					"휴지통"
				) : (
					""
				)}
			</span>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClose(tabKey);
				}}
				className="shrink-0 rounded p-[2px] opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
			>
				<Image src="/cross.svg" alt="close" width={24} height={24} />
			</button>
		</div>
	);
}
