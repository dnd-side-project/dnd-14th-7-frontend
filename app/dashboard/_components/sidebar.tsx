"use client";

import { PenSquare, Trash2 } from "lucide-react";
import {
	SidebarTagListSection,
	SidebarUserProfileSection,
} from "@/components/sidebar-auth";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";

export function Sidebar() {
	const { dispatch } = useDashboardTabs();
	const { open, toggleSidebar } = useSidebar();

	return (
		<div
			className={`fixed left-0 top-0 flex h-full w-[260px] flex-col gap-[32px] overflow-hidden bg-dnd-bg-alternative p-[24px] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-linear ${
				open ? "translate-x-0" : "-translate-x-full"
			}`}
		>
			<div className="flex w-full items-center justify-between">
				<SidebarUserProfileSection />
				<Button
					variant="ghost"
					size="icon"
					className="size-[32px] shrink-0 p-0 hover:bg-transparent"
					onClick={toggleSidebar}
				>
					<svg
						role="img"
						aria-label="사이드바 메뉴 아이콘"
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
				</Button>
			</div>

			<div className="flex w-full flex-1 min-h-0 flex-col gap-[32px]">
				<Button
					className="h-auto w-full shrink-0 flex-row items-center justify-center gap-[4px] rounded-[8px] py-[8px] bg-white border border-dnd-line-normal shadow-dnd-normal hover:bg-dnd-bg-alternative"
					variant="ghost"
					onClick={() => {
						dispatch(
							{ type: "add", tab: "new" },
							{ type: "activate", tab: "new" },
						);
					}}
				>
					<PenSquare className="size-[16px] text-dnd-label-neutral" />
					<span className="typo-label-1 font-medium text-dnd-label-neutral">
						새 페이지 만들기
					</span>
				</Button>

				<div className="flex w-full flex-1 min-h-0 flex-col gap-[8px]">
					<p className="typo-body-1 w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-dnd-label-alternative">
						태그
					</p>
					<div className="flex-1 min-h-0 overflow-y-auto">
						<SidebarTagListSection />
					</div>
				</div>

				<Button
					variant="text-secondary"
					className="w-full shrink-0 justify-start gap-[8px] px-[8px] py-[8px] h-auto"
					onClick={() => {
						dispatch(
							{ type: "add", tab: "trash" },
							{ type: "activate", tab: "trash" },
						);
					}}
				>
					<div className="flex h-[24px] w-[20px] items-center justify-center">
						<Trash2 className="size-[20px] text-dnd-label-neutral" />
					</div>
					<span className="typo-body-1 font-medium text-dnd-label-neutral">
						휴지통
					</span>
				</Button>
			</div>
		</div>
	);
}
