"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { userQueryOptions } from "@/lib/queries/user";

function openLoginModal() {
	return overlay.open(({ isOpen, close }) => (
		<LoginModal isOpen={isOpen} onClose={close} />
	));
}

export function TopNavigation() {
	const router = useRouter();
	const {
		data: user,
		isLoading,
		isError,
		error,
	} = useQuery(userQueryOptions());
	const renderAuthAction = () => {
		if (isLoading) {
			return (
				<div className="h-12 w-25 animate-pulse rounded-xl bg-dnd-fill-normal" />
			);
		}

		if (user) {
			return (
				<div className="flex min-w-0 items-center gap-2 sm:gap-3">
					<span className="hidden max-w-32 truncate typo-body-2 text-dnd-label-alternative sm:block">
						{user.nickname}님
					</span>
					<Button
						variant="solid"
						size="dnd-large"
						onClick={() => router.push("/dashboard")}
					>
						대시보드로 이동
					</Button>
				</div>
			);
		}

		if (error instanceof Error && error.message === "Unauthenticated") {
			return (
				<Button variant="solid" size="dnd-large" onClick={openLoginModal}>
					로그인
				</Button>
			);
		}

		if (isError) {
			return (
				<Button
					variant="solid"
					size="dnd-large"
					onClick={() => router.refresh()}
				>
					다시 시도
				</Button>
			);
		}

		return (
			<Button variant="solid" size="dnd-large" onClick={openLoginModal}>
				로그인
			</Button>
		);
	};

	return (
		<nav className="flex h-20 items-center justify-between px-4 py-4 sm:px-8 lg:h-28 lg:px-[120px] xl:px-[240px]">
			<Image
				src="/logo.svg"
				alt="Aha!ve"
				width={120}
				height={40}
				className="h-auto w-28 sm:w-30"
			/>
			{renderAuthAction()}
		</nav>
	);
}
