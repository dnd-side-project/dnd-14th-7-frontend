"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import { insightDetailQueryOptions } from "@/lib/queries/insight";
import type { Tab } from "@/lib/tabs/tab-utils";
import { deserializeTab } from "@/lib/tabs/tab-utils";
import { cn } from "@/lib/utils";
import { DashboardSearchDialog } from "./dashboard-search-dialog";

export function DashboardTabBar() {
	const { state, dispatch } = useDashboardTabs();
	const { open, toggleSidebar } = useSidebar();
	const currentTabKey = state.currentTab || "home";

	return (
		<div
			className={`fixed top-0 right-0 z-10 flex h-14 items-center border-b border-[#e1e2e4] bg-dnd-bg-mint transition-[left] duration-300 ${
				open ? "left-[var(--sidebar-width)]" : "left-0"
			}`}
		>
			{!open && (
				<button
					type="button"
					onClick={toggleSidebar}
					className="flex h-full shrink-0 items-center justify-center border-r border-[#e1e2e4] px-4 text-dnd-label-neutral hover:bg-white/60"
				>
					<Image src="/side-bar.svg" alt="side-bar" width={24} height={24} />
				</button>
			)}
			<button
				type="button"
				onClick={() => dispatch({ type: "activate", tab: null })}
				className={`flex h-full shrink-0 items-center justify-center border-r border-[#e1e2e4] px-4 transition-colors ${
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

			<DashboardSearchDialog />
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
			className={cn(
				"group flex h-14 w-56 shrink-0 cursor-pointer items-center gap-2 border-r border-[#e1e2e4] px-4 transition-colors",
				isActive ? "bg-white" : "bg-dnd-bg-mint",
			)}
			onClick={() => onNavigate(tabKey)}
			onKeyDown={(e) => e.key === "Enter" && onNavigate(tabKey)}
		>
			<TabLabel tab={tab} />
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClose(tabKey);
				}}
				className="shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
			>
				<Image src="/cross.svg" alt="close" width={24} height={24} />
			</button>
		</div>
	);
}

function TabLabel({ tab }: { tab: Tab }) {
	switch (tab.type) {
		case "tag":
			return <TagTabLabel name={tab.name ?? ""} />;
		case "insight":
			return <InsightTabLabel insightId={Number(tab.id)} />;
		case "new":
			return <TextTabLabel>새 페이지</TextTabLabel>;
		case "trash":
			return <TextTabLabel>휴지통</TextTabLabel>;
		case "mypage":
			return <TextTabLabel>마이페이지</TextTabLabel>;
		default:
			return null;
	}
}

function InsightTabLabel({ insightId }: { insightId: number }) {
	const { data, isError, isLoading } = useQuery(
		insightDetailQueryOptions(insightId),
	);

	if (isLoading) {
		return <TextTabLabel>로딩 중...</TextTabLabel>;
	}

	if (isError) {
		return <TextTabLabel>로드 실패</TextTabLabel>;
	}

	return <TextTabLabel>{data?.title || "제목 없는 인사이트"}</TextTabLabel>;
}

function TextTabLabel({ children }: { children: React.ReactNode }) {
	return (
		<span className="min-w-0 flex-1 truncate text-[17px] font-medium leading-[1.41] text-dnd-label-neutral">
			{children}
		</span>
	);
}

function TagTabLabel({ name }: { name: string }) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			<Image
				src="/hash-tag.svg"
				alt="#"
				width={16}
				height={16}
				className="shrink-0"
			/>
			<TextTabLabel>{name}</TextTabLabel>
		</div>
	);
}
