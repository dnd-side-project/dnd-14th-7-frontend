import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { tagsQueryOptions, userQueryOptions } from "@/lib/queries/user";
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
			<div className="flex min-h-screen bg-dnd-bg-normal">
				<ClientBoundary>
					<Sidebar />
				</ClientBoundary>
				<div className="ml-[260px] flex flex-1 flex-col">
					<ClientBoundary>
						<DashboardTabBar />
					</ClientBoundary>
					<main className="pt-[56px]">{children}</main>
				</div>
			</div>
		</HydrationBoundary>
	);
}
