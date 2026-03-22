"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PositionSelectModal } from "@/components/position-select-modal";
import { Button } from "@/components/ui/button";
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

	return (
		<button
			type="button"
			className="flex flex-1 cursor-pointer items-center gap-[8px]"
		>
			<div className="flex size-[32px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
				<div className="size-full bg-gray-300" />
			</div>
			<p className="typo-headline-1 font-medium text-dnd-label-neutral">
				{user.nickname}
			</p>
		</button>
	);
}

function SidebarTagList() {
	const { data: tags } = useSuspenseQuery(tagsQueryOptions());

	return (
		<div className="flex w-full flex-col items-start gap-[2px]">
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
			className="w-full justify-start gap-[8px] px-[8px] py-[8px] h-auto"
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
			className="flex flex-1 cursor-pointer items-center gap-[8px]"
		>
			<div className="flex size-[32px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-dnd-fill-strong" />
			<p className="typo-headline-1 font-medium text-dnd-label-neutral">
				로그인
			</p>
		</button>
	);
}

function SidebarUserProfileSkeleton() {
	return (
		<div className="flex flex-1 items-center gap-[8px]">
			<div className="size-[32px] shrink-0 animate-pulse rounded-full bg-dnd-fill-strong" />
			<div className="h-[18px] w-[60px] animate-pulse rounded bg-dnd-fill-strong" />
		</div>
	);
}

function SidebarTagListFallback() {
	return (
		<div className="flex w-full flex-col gap-[4px] rounded-[16px] bg-white p-[16px]">
			<CircleAlert className="size-[24px] text-dnd-label-alternative" />
			<p className="typo-label-1 font-normal text-dnd-label-neutral">
				인사이트를 저장하려면 로그인하세요. 로그인하면 태그기능을 이용할 수
				있어요.
			</p>
			<Button
				variant="ghost"
				className="mt-[12px] h-auto w-full rounded-[10px] bg-[#e1f5f3] px-[20px] py-[9px] hover:bg-[#d0eeeb]"
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
		<div className="flex w-full flex-col gap-[4px]">
			<div className="h-[32px] w-full animate-pulse rounded bg-dnd-fill-strong" />
			<div className="h-[32px] w-full animate-pulse rounded bg-dnd-fill-strong" />
			<div className="h-[32px] w-3/4 animate-pulse rounded bg-dnd-fill-strong" />
		</div>
	);
}
