"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { overlay } from "overlay-kit";
import { useState } from "react";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { insightCreationMutationOptions } from "@/lib/queries/insight";
import type { User } from "@/lib/queries/user";
import { userQueryOptions } from "@/lib/queries/user";

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

export function InsightInput({ onSuccess, titleClassName }: InsightInputProps) {
	const { data: user, isError } = useQuery(userQueryOptions());

	if (isError || !user) {
		return <GuestInsightInput titleClassName={titleClassName} />;
	}

	return (
		<AuthenticatedInsightInput
			user={user}
			onSuccess={onSuccess}
			titleClassName={titleClassName}
		/>
	);
}

function GuestInsightInput({ titleClassName }: { titleClassName?: string }) {
	const content = getPositionContent(undefined);

	return (
		<section className="flex flex-col items-start gap-[32px] w-full max-w-[960px]">
			<h1
				className={`typo-title-2 font-medium text-dnd-label-strong ${titleClassName ?? ""}`}
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
					onSuccess?.(data.insightId);
				},
				onError: (error) => {
					console.error("Failed to create insight:", error);
				},
			},
		);
	};

	return (
		<section className="flex flex-col items-start gap-[32px] w-full max-w-[960px]">
			<h1
				className={`typo-title-2 font-medium text-dnd-label-strong ${titleClassName ?? ""}`}
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
