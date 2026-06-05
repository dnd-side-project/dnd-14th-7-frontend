"use client";

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { CircleAlert, LogOut, User } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PositionSelectModal } from "@/components/position-select-modal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardTabs } from "@/hooks/use-dashboard-tabs";
import {
	logoutMutationOptions,
	signInWithGoogle,
	type Tag,
	tagsQueryOptions,
	userQueryOptions,
} from "@/lib/queries/user";

export function SidebarUserProfileSection() {
	return (
		<ErrorBoundary fallbackRender={() => <SidebarUserProfileFallback />}>
			<Suspense fallback={<SidebarUserProfileSkeleton />}>
				<SidebarPositionSetup />
				<SidebarUserProfile />
			</Suspense>
		</ErrorBoundary>
	);
}

export function SidebarTagListSection() {
	return (
		<ErrorBoundary fallbackRender={() => <SidebarTagListFallback />}>
			<Suspense fallback={<SidebarTagListSkeleton />}>
				<SidebarTagList />
			</Suspense>
		</ErrorBoundary>
	);
}

function SidebarPositionSetup() {
	const { data: user } = useSuspenseQuery(userQueryOptions());
	const [dismissed, setDismissed] = useState(false);

	return (
		<PositionSelectModal
			isOpen={user.position === "NONE" && !dismissed}
			onClose={() => setDismissed(true)}
		/>
	);
}

function SidebarUserProfile() {
	const { data: user } = useSuspenseQuery(userQueryOptions());
	const queryClient = useQueryClient();
	const { dispatch } = useDashboardTabs();
	const { mutate: logout, isPending } = useMutation(
		logoutMutationOptions(queryClient),
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-dnd-primary"
				>
					<div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
						<div className="size-full bg-gray-300" />
					</div>
					<p className="typo-headline-1 truncate font-medium text-dnd-label-neutral">
						{user.nickname}
					</p>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-55 rounded-2xl border border-dnd-line-normal bg-white p-2 shadow-dnd-normal"
			>
				<DropdownMenuItem
					className="cursor-pointer gap-2 rounded-[10px] px-3 py-2.5 typo-body-1 text-dnd-label-neutral focus:bg-dnd-bg-alternative"
					onSelect={() =>
						dispatch(
							{ type: "add", tab: "mypage" },
							{ type: "activate", tab: "mypage" },
						)
					}
				>
					<User className="size-4.5 text-dnd-label-alternative" />
					마이페이지
				</DropdownMenuItem>
				<DropdownMenuItem
					className="cursor-pointer gap-2 rounded-[10px] px-3 py-2.5 typo-body-1 text-dnd-status-negative focus:bg-dnd-bg-alternative"
					disabled={isPending}
					onSelect={() => logout()}
				>
					<LogOut className="size-4.5" />
					로그아웃
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SidebarTagList() {
	const { data: tags } = useSuspenseQuery(tagsQueryOptions());

	return (
		<div className="flex w-full flex-col items-start gap-0.5">
			{tags.map((tag) => (
				<SidebarTag key={tag.tagId} tag={tag} />
			))}
		</div>
	);
}

function SidebarTag({ tag }: { tag: Tag }) {
	const { dispatch } = useDashboardTabs();
	const tabKey = `tag:${tag.tagId}:${tag.tagName}`;

	return (
		<Button
			variant="text-secondary"
			className="w-full justify-start gap-2 px-2 py-2 h-auto"
			onClick={() =>
				dispatch(
					{ type: "add", tab: tabKey },
					{ type: "activate", tab: tabKey },
				)
			}
		>
			<span className="typo-body-1 text-dnd-label-alternative">#</span>
			<span className="typo-body-1 font-medium text-dnd-label-neutral">
				{tag.tagName} ({tag.insightCount})
			</span>
		</Button>
	);
}

function SidebarUserProfileFallback() {
	return (
		<button
			type="button"
			onClick={() => signInWithGoogle()}
			className="flex flex-1 cursor-pointer items-center gap-2"
		>
			<div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dnd-fill-strong" />
			<p className="typo-headline-1 font-medium text-dnd-label-neutral">
				로그인
			</p>
		</button>
	);
}

function SidebarUserProfileSkeleton() {
	return (
		<div className="flex flex-1 items-center gap-2">
			<div className="size-8 shrink-0 animate-pulse rounded-full bg-dnd-fill-strong" />
			<div className="h-4.5 w-15 animate-pulse rounded bg-dnd-fill-strong" />
		</div>
	);
}

function SidebarTagListFallback() {
	return (
		<div className="flex w-full flex-col gap-1 rounded-2xl bg-white p-4">
			<CircleAlert className="size-6 text-dnd-label-alternative" />
			<p className="typo-label-1 font-normal text-dnd-label-neutral">
				인사이트를 저장하려면 로그인하세요. 로그인하면 태그기능을 이용할 수
				있어요.
			</p>
			<Button
				variant="ghost"
				className="mt-3 h-auto w-full rounded-[10px] bg-[#e1f5f3] px-5 py-2.25 hover:bg-[#d0eeeb]"
				onClick={() => signInWithGoogle()}
			>
				<span className="typo-body-2 font-semibold text-dnd-primary-strong">
					로그인
				</span>
			</Button>
		</div>
	);
}

function SidebarTagListSkeleton() {
	return (
		<div className="flex w-full flex-col gap-1">
			<div className="h-8 w-full animate-pulse rounded bg-dnd-fill-strong" />
			<div className="h-8 w-full animate-pulse rounded bg-dnd-fill-strong" />
			<div className="h-8 w-3/4 animate-pulse rounded bg-dnd-fill-strong" />
		</div>
	);
}
