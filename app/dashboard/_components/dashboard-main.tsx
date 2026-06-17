"use client";

import { useSidebar } from "@/components/ui/sidebar";

export function DashboardMain({ children }: { children: React.ReactNode }) {
	const { isMobile, open } = useSidebar();

	return (
		<div
			className={`flex min-w-0 flex-1 flex-col transition-[margin-left] duration-200 ease-linear ${
				!isMobile && open ? "ml-[var(--sidebar-width)]" : "ml-0"
			}`}
		>
			{children}
		</div>
	);
}
