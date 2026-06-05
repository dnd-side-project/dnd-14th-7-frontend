"use client";

import {
	QueryErrorResetBoundary,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type User,
	updateProfileMutationOptions,
	userKeys,
	userQueryOptions,
} from "@/lib/queries/user";

const POSITION_LABEL: Record<User["position"], string> = {
	DEV: "개발",
	DESIGN: "디자인",
	PROMOTER: "기획",
	OTHER: "기타",
	NONE: "미설정",
};

const EDITABLE_POSITIONS = ["DEV", "DESIGN", "PROMOTER", "OTHER"] as const;

export function MyPage() {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<ErrorBoundary
					onReset={reset}
					fallbackRender={({ resetErrorBoundary }) => (
						<MyPageError onRetry={resetErrorBoundary} />
					)}
				>
					<Suspense fallback={<MyPageSkeleton />}>
						<MyPageContent />
					</Suspense>
				</ErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
}

function MyPageContent() {
	const { data: user } = useSuspenseQuery(userQueryOptions());
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);
	const [nickname, setNickname] = useState(() => user.nickname);
	const [position, setPosition] = useState<User["position"]>(
		() => user.position,
	);
	const [errorMessage, setErrorMessage] = useState("");
	const { mutate: updateProfile, isPending } = useMutation({
		...updateProfileMutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: userKeys.profile() });
			setErrorMessage("");
			setIsEditing(false);
		},
		onError: () => {
			setErrorMessage("프로필을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
		},
	});
	const trimmedNickname = nickname.trim();
	const hasChanges =
		trimmedNickname !== user.nickname || position !== user.position;
	const canSave = Boolean(trimmedNickname) && hasChanges && !isPending;

	const startEdit = () => {
		setNickname(user.nickname);
		setPosition(user.position);
		setErrorMessage("");
		setIsEditing(true);
	};

	const cancelEdit = () => {
		setNickname(user.nickname);
		setPosition(user.position);
		setErrorMessage("");
		setIsEditing(false);
	};

	const submitEdit = () => {
		if (!canSave) return;
		updateProfile({ nickname: trimmedNickname, position });
	};

	return (
		<div className="flex w-full justify-center px-20 pt-20">
			<section className="flex w-full max-w-180 flex-col gap-6 rounded-4xl bg-white p-8 shadow-dnd-normal">
				<div className="flex items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-4">
						<div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
							<div className="size-full bg-gray-300" />
						</div>
						<div className="flex min-w-0 flex-col gap-1">
							<h1 className="typo-title-2 truncate font-semibold text-dnd-label-normal">
								{user.nickname}
							</h1>
							<p className="typo-body-1 truncate text-dnd-label-alternative">
								{user.email}
							</p>
						</div>
					</div>
					{!isEditing && (
						<Button variant="secondary" onClick={startEdit}>
							프로필 수정
						</Button>
					)}
				</div>

				{isEditing ? (
					<ProfileEditForm
						nickname={nickname}
						position={position}
						errorMessage={errorMessage}
						isPending={isPending}
						canSave={canSave}
						onNicknameChange={setNickname}
						onPositionChange={setPosition}
						onCancel={cancelEdit}
						onSubmit={submitEdit}
					/>
				) : (
					<div className="flex flex-col gap-3">
						<MyPageInfoRow label="직군" value={POSITION_LABEL[user.position]} />
						<MyPageInfoRow label="크레딧" value={`${user.credit}`} />
					</div>
				)}
			</section>
		</div>
	);
}

function ProfileEditForm({
	nickname,
	position,
	errorMessage,
	isPending,
	canSave,
	onNicknameChange,
	onPositionChange,
	onCancel,
	onSubmit,
}: {
	nickname: string;
	position: User["position"];
	errorMessage: string;
	isPending: boolean;
	canSave: boolean;
	onNicknameChange: (value: string) => void;
	onPositionChange: (value: User["position"]) => void;
	onCancel: () => void;
	onSubmit: () => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label
					className="typo-body-1 text-dnd-label-alternative"
					htmlFor="mypage-nickname"
				>
					닉네임
				</label>
				<Input
					id="mypage-nickname"
					variant="outlined"
					inputSize="dnd-medium"
					maxLength={20}
					value={nickname}
					disabled={isPending}
					onChange={(event) => onNicknameChange(event.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<span className="typo-body-1 text-dnd-label-alternative">직군</span>
				<Select
					value={position === "NONE" ? undefined : position}
					disabled={isPending}
					onValueChange={(value) => onPositionChange(value as User["position"])}
				>
					<SelectTrigger className="min-h-12 w-full rounded-[12px] border-dnd-line-neutral px-4 typo-body-1">
						<SelectValue placeholder="직군을 선택해주세요" />
					</SelectTrigger>
					<SelectContent className="rounded-2xl bg-white">
						{EDITABLE_POSITIONS.map((value) => (
							<SelectItem key={value} value={value}>
								{POSITION_LABEL[value]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{errorMessage && (
				<p className="typo-body-2 text-dnd-status-negative">{errorMessage}</p>
			)}

			<div className="flex justify-end gap-2">
				<Button variant="secondary" disabled={isPending} onClick={onCancel}>
					취소
				</Button>
				<Button variant="solid" disabled={!canSave} onClick={onSubmit}>
					{isPending ? "저장 중..." : "저장"}
				</Button>
			</div>
		</div>
	);
}

function MyPageSkeleton() {
	return (
		<div className="flex w-full justify-center px-20 pt-20">
			<section className="flex w-full max-w-180 animate-pulse flex-col gap-6 rounded-4xl bg-white p-8 shadow-dnd-normal">
				<div className="flex items-center gap-4">
					<div className="size-14 rounded-full bg-dnd-fill-strong" />
					<div className="flex flex-1 flex-col gap-2">
						<div className="h-8 w-40 rounded bg-dnd-fill-strong" />
						<div className="h-5 w-64 rounded bg-dnd-fill-normal" />
					</div>
				</div>
				<div className="flex flex-col gap-3">
					<div className="h-14 rounded-2xl bg-dnd-fill-normal" />
					<div className="h-14 rounded-2xl bg-dnd-fill-normal" />
				</div>
			</section>
		</div>
	);
}

function MyPageError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-8 py-6 shadow-dnd-normal">
				<p className="typo-body-1 text-dnd-label-alternative">
					사용자 정보를 불러오지 못했어요.
				</p>
				<Button variant="secondary" onClick={onRetry}>
					다시 시도
				</Button>
			</div>
		</div>
	);
}

function MyPageInfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between rounded-2xl bg-dnd-bg-alternative px-5 py-4">
			<span className="typo-body-1 text-dnd-label-alternative">{label}</span>
			<span className="typo-body-1 font-medium text-dnd-label-normal">
				{value}
			</span>
		</div>
	);
}
