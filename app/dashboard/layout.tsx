import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { type Tag, type User, userKeys } from "@/lib/queries/user";
import { createClient } from "@/lib/supabase/server";
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
	const supabase = await createClient();

	const {
		data: { user: authUser },
	} = await supabase.auth.getUser();

	if (authUser) {
		// Prefetch user profile
		const { data: profile } = await supabase
			.from("profiles")
			.select("nickname, email, credit, plan_type, position")
			.eq("id", authUser.id)
			.maybeSingle();

		if (profile) {
			queryClient.setQueryData<User>(userKeys.profile(), {
				nickname: profile.nickname,
				email: profile.email,
				credit: profile.credit,
				planType: profile.plan_type,
				position: profile.position as User["position"],
			});
		}

		// Prefetch tags
		const { data: tags } = await supabase
			.from("tags")
			.select("id, name, insight_tags(count)")
			.eq("user_id", authUser.id);

		if (tags) {
			const tagList: Tag[] = tags.map((row) => ({
				tagId: row.id,
				tagName: row.name,
				insightCount:
					Array.isArray(row.insight_tags) && row.insight_tags.length > 0
						? (row.insight_tags[0] as { count: number }).count
						: 0,
			}));
			queryClient.setQueryData<Tag[]>(userKeys.tags(), tagList);
		}
	}

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
