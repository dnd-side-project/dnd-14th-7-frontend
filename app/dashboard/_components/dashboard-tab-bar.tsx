"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSidebar } from "@/components/ui/sidebar";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import { insightDetailQueryOptions } from "@/lib/queries/insight";
import type { Tab } from "@/lib/tabs/tab-utils";
import { deserializeTab } from "@/lib/tabs/tab-utils";

export function DashboardTabBar() {
	const { state, dispatch } = useDashboardTabs();
	const { open, toggleSidebar } = useSidebar();
	const currentTabKey = state.currentTab || "home";

	return (
		<div
			className={`fixed top-0 right-0 z-10 flex h-[56px] items-center border-b border-[#e1e2e4] bg-dnd-bg-mint transition-[left] duration-300 ${
				open ? "left-[260px]" : "left-0"
			}`}
		>
			{!open && (
				<button
					type="button"
					onClick={toggleSidebar}
					className="flex h-full shrink-0 items-center justify-center border-r border-[#e1e2e4] px-[16px] text-dnd-label-neutral hover:bg-white/60"
				>
					<svg
						role="img"
						aria-label="사이드바 열기"
						xmlns="http://www.w3.org/2000/svg"
						width="27"
						height="24"
						viewBox="0 0 27 24"
						fill="none"
					>
						<path
							d="M22.5342 0C24.5326 0.000159259 26.401 1.46991 26.4014 3.57031V20.1641C26.401 22.2645 24.5326 23.7342 22.5342 23.7344H3.86719C1.86865 23.7344 0.000342864 22.2646 0 20.1641V3.57031C0.000343021 1.46979 1.86865 5.6507e-08 3.86719 0H22.5342ZM10.4014 21.333H22.5342C23.4804 21.3329 23.9996 20.6813 24 20.1641V3.57031C23.9996 3.05305 23.4804 2.40152 22.5342 2.40137H10.4014V21.333ZM3.86719 2.40137C2.92075 2.40137 2.40176 3.05299 2.40137 3.57031V20.1641C2.40175 20.6814 2.92075 21.333 3.86719 21.333H8V2.40137H3.86719Z"
							fill="#2E2F33"
							fillOpacity="0.88"
						/>
					</svg>
				</button>
			)}
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
			<TabLabel tab={tab} />
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

function TabLabel({ tab }: { tab: Tab }) {
	switch (tab.type) {
		case "tag":
			return <TagTabLabel name={tab.name ?? ""} />;
		case "insight":
			return (
				<ErrorBoundary
					fallback={<TextTabLabel>인사이트</TextTabLabel>}
				>
					<Suspense
						fallback={<TextTabLabel>인사이트 생성 중...</TextTabLabel>}
					>
						<InsightTabLabel insightId={Number(tab.id)} />
					</Suspense>
				</ErrorBoundary>
			);
		case "new":
			return <TextTabLabel>새 페이지</TextTabLabel>;
		case "trash":
			return <TextTabLabel>휴지통</TextTabLabel>;
		default:
			return null;
	}
}

function InsightTabLabel({ insightId }: { insightId: number }) {
	const { data } = useSuspenseQuery(insightDetailQueryOptions(insightId));
	return <TextTabLabel>{data.title || "인사이트"}</TextTabLabel>;
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
		<div className="flex min-w-0 flex-1 items-center gap-[8px]">
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
