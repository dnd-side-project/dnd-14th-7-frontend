"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SIGNUP_CREDIT_GRANT } from "@/lib/credits";
import { signInWithGoogle } from "@/lib/queries/user";

export interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
	const handleGoogleLogin = async () => {
		onClose();
		await signInWithGoogle();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="flex max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-[700px] flex-col items-center gap-8 overflow-y-auto rounded-[28px] bg-dnd-bg-normal p-6 ring-0 sm:gap-12 sm:rounded-[32px] sm:p-12">
				<DialogTitle className="sr-only">로그인</DialogTitle>

				<div className="flex flex-col items-center gap-8">
					<Image
						src="/logo.svg"
						alt="Aha!ve"
						width={254}
						height={80}
						className="h-auto w-48 sm:w-[254px]"
					/>
					<div className="flex flex-col items-center gap-3">
						<div className="flex flex-col items-center gap-1">
							<p className="typo-heading-1 font-medium text-dnd-label-neutral text-center">
								로그인하고 아하이브에서
							</p>
							<p className="typo-heading-1 font-medium text-dnd-label-neutral text-center">
								내 경험을 인사이트로 쌓아보세요
							</p>
						</div>
						<p className="rounded-full bg-dnd-bg-mint px-4 py-2 typo-body-2 font-semibold text-dnd-primary">
							가입하면 AI 생성에 사용할 수 있는 {SIGNUP_CREDIT_GRANT} 크레딧을
							드려요
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={handleGoogleLogin}
					className="flex min-h-16 w-full items-center gap-3 rounded-[48px] border border-dnd-line-normal bg-dnd-bg-normal px-5 py-4 transition-colors hover:bg-dnd-bg-alternative sm:h-[88px] sm:gap-4 sm:px-9 sm:py-6"
				>
					<Image src="/google-logo.svg" alt="Google" width={32} height={32} />
					<span className="flex-1 typo-heading-2 text-center font-bold text-black sm:typo-title-2">
						구글로 로그인하기
					</span>
				</button>

				<p className="typo-body-2 text-dnd-label-neutral text-center">
					로그인시 아하이브 <span className="underline">이용약관</span> 및{" "}
					<span className="underline">개인정보정책</span>에 동의한것으로
					간주합니다.
				</p>
			</DialogContent>
		</Dialog>
	);
}
