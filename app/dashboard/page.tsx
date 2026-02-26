import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import {
	insightDetailQueryOptions,
	insightPiecesQueryOptions,
	insightQuestionsQueryOptions,
} from "@/lib/queries/insight";
import { DashboardContent } from "./_components/dashboard-content";
import { ClientBoundary } from "./_components/error-wrapper";

interface DashboardPageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({
	searchParams,
}: DashboardPageProps) {
	const params = await searchParams;
	const currentTab = params?.currentTab;
	const queryClient = new QueryClient();

	if (currentTab?.startsWith("insight:")) {
		const insightId = Number(currentTab.split(":")[1]);
		if (!Number.isNaN(insightId)) {
			await Promise.all([
				queryClient.prefetchQuery(insightDetailQueryOptions(insightId)),
				queryClient.prefetchQuery(insightPiecesQueryOptions(insightId)),
				queryClient.prefetchQuery(insightQuestionsQueryOptions(insightId)),
			]);
		}
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ClientBoundary fallback={<div>잘못된 페이지입니다.</div>}>
				<DashboardContent />
			</ClientBoundary>
		</HydrationBoundary>
	);
}
