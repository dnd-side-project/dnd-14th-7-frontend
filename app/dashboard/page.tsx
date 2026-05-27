import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { DashboardContent } from "./_components/dashboard-content";
import { ClientBoundary } from "./_components/error-wrapper";

export default async function DashboardPage() {
	const queryClient = new QueryClient();

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ClientBoundary fallback={<div>잘못된 페이지입니다.</div>}>
				<DashboardContent />
			</ClientBoundary>
		</HydrationBoundary>
	);
}
