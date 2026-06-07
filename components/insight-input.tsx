"use client";

import {
	QueryErrorResetBoundary,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { overlay } from "overlay-kit";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	insightCreationMutationOptions,
	insightKeys,
} from "@/lib/queries/insight";
import type { User } from "@/lib/queries/user";
import { userKeys, userQueryOptions } from "@/lib/queries/user";
import { cn } from "@/lib/utils";

const PLACEHOLDER_BY_POSITION: Record<
	string,
	{ title: string; placeholder: string }
> = {
	DEV: {
		title: "방금 겪은 문제나 깨달음을 한 줄로 적어보세요",
		placeholder: "예: 로그 안 남겨서 디버깅이 너무 힘들었다",
	},
	DESIGN: {
		title: "작업 중 떠오른 UX/디자인 인사이트를 남겨보세요",
		placeholder: "예: 버튼 위치 하나로 전환율이 달라진다",
	},
	PROMOTER: {
		title: "방금 정리된 기획 포인트를 입력해주세요",
		placeholder: "예: 문제 정의가 기능보다 먼저다",
	},
	DEFAULT: {
		title: "지금 막 떠오른 생각을 한 줄로 적어보세요.",
		placeholder: "예: 반복되는 문제에는 항상 이유가 있다",
	},
};

function getPositionContent(position: User["position"] | undefined) {
	return (
		PLACEHOLDER_BY_POSITION[position ?? "DEFAULT"] ??
		PLACEHOLDER_BY_POSITION.DEFAULT
	);
}

interface InsightInputProps {
	onSuccess?: (insightId: number) => void;
	titleClassName?: string;
}

export const InsightInput = dynamic<InsightInputProps>(
	() => Promise.resolve(InsightInputContent),
	{
		ssr: false,
		loading: () => <InsightInputSkeleton />,
	},
);

function InsightInputContent(props: InsightInputProps) {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<ErrorBoundary
					onReset={reset}
					fallbackRender={() => (
						<GuestInsightInput titleClassName={props.titleClassName} />
					)}
				>
					<Suspense
						fallback={
							<InsightInputSkeleton titleClassName={props.titleClassName} />
						}
					>
						<AuthenticatedInsightInputWithUser {...props} />
					</Suspense>
				</ErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
}

function AuthenticatedInsightInputWithUser({
	onSuccess,
	titleClassName,
}: InsightInputProps) {
	const { data: user } = useSuspenseQuery(userQueryOptions());

	return (
		<AuthenticatedInsightInput
			user={user}
			onSuccess={onSuccess}
			titleClassName={titleClassName}
		/>
	);
}

function InsightInputSkeleton({ titleClassName }: { titleClassName?: string }) {
	return (
		<section className="flex w-full max-w-240 flex-col items-start gap-8">
			<div
				className={cn(
					"h-8 w-2/3 animate-pulse rounded-md bg-dnd-fill-normal",
					titleClassName,
				)}
			/>
			<div className="min-h-54 w-full rounded-3xl border border-dnd-line-normal bg-white p-6">
				<div className="h-5 w-1/2 animate-pulse rounded-md bg-dnd-fill-normal" />
			</div>
		</section>
	);
}

function GuestInsightInput({ titleClassName }: { titleClassName?: string }) {
	const content = getPositionContent(undefined);

	return (
		<section className="flex w-full max-w-240 flex-col items-start gap-8">
			<h1
				className={cn(
					"typo-title-2 font-medium text-dnd-label-strong",
					titleClassName,
				)}
			>
				{content.title}
			</h1>
			<Textarea
				placeholder={content.placeholder}
				showCharacterCount
				maxLength={200}
				resize="none"
				value=""
				onFocus={() => {
					overlay.open(({ isOpen, close }) => (
						<LoginModal isOpen={isOpen} onClose={close} />
					));
				}}
				trailingContent={
					<Button variant="solid" size="dnd-large" disabled>
						인사이트 생성
					</Button>
				}
			/>
		</section>
	);
}

interface AuthenticatedInsightInputProps {
	user: User;
	onSuccess?: (insightId: number) => void;
	titleClassName?: string;
}

function AuthenticatedInsightInput({
	user,
	onSuccess,
	titleClassName,
}: AuthenticatedInsightInputProps) {
	const [value, setValue] = useState("");
	const queryClient = useQueryClient();
	const content = getPositionContent(user.position);
	const { mutate: createInsight, isPending } = useMutation(
		insightCreationMutationOptions(),
	);

	const handleSubmit = () => {
		if (!value.trim()) return;

		createInsight(
			{ memo: value },
			{
				onSuccess: (data) => {
					setValue("");
					queryClient.invalidateQueries({ queryKey: insightKeys.all });
					queryClient.invalidateQueries({ queryKey: userKeys.tags() });
					onSuccess?.(data.insightId);
				},
				onError: (error) => {
					console.error("Failed to create insight:", error);
				},
			},
		);
	};

	return (
		<section className="flex w-full max-w-240 flex-col items-start gap-8">
			<h1
				className={cn(
					"typo-title-2 font-medium text-dnd-label-strong",
					titleClassName,
				)}
			>
				{content.title}
			</h1>
			<Textarea
				placeholder={content.placeholder}
				showCharacterCount
				maxLength={200}
				resize="none"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				disabled={isPending}
				trailingContent={
					<Button
						variant="solid"
						size="dnd-large"
						disabled={value.length === 0}
						onClick={handleSubmit}
					>
						{isPending ? "생성 중..." : "인사이트 생성"}
					</Button>
				}
			/>
		</section>
	);
}
