import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { tagsQueryOptions, userQueryOptions } from "@/lib/queries/user";
import { DashboardMain } from "./_components/dashboard-main";
import { DashboardTabBar } from "./_components/dashboard-tab-bar";
import { ClientBoundary } from "./_components/error-wrapper";
import { Sidebar } from "./_components/sidebar";

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const queryClient = new QueryClient();

	await Promise.all([
		queryClient.prefetchQuery(userQueryOptions()),
		queryClient.prefetchQuery(tagsQueryOptions()),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SidebarProvider>
				<ClientBoundary>
					<Sidebar />
				</ClientBoundary>
				<DashboardMain>
					<ClientBoundary>
						<DashboardTabBar />
					</ClientBoundary>
					<main className="pt-[56px]">{children}</main>
				</DashboardMain>
			</SidebarProvider>
		</HydrationBoundary>
	);
}
