"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
			<DialogContent className="w-[700px] sm:max-w-[700px] rounded-[32px] bg-dnd-bg-normal p-12 flex flex-col items-center gap-12 ring-0">
				<DialogTitle className="sr-only">로그인</DialogTitle>

				<div className="flex flex-col items-center gap-8">
					<Image src="/logo.svg" alt="Aha!ve" width={254} height={80} />
					<div className="flex flex-col items-center gap-1">
						<p className="typo-heading-1 font-medium text-dnd-label-neutral text-center">
							로그인하고 아하이브에서
						</p>
						<p className="typo-heading-1 font-medium text-dnd-label-neutral text-center">
							나만의 인사이트를 정리해보세요!
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={handleGoogleLogin}
					className="flex h-[88px] w-[604px] items-center gap-4 rounded-[48px] border border-dnd-line-normal bg-dnd-bg-normal px-9 py-6 hover:bg-dnd-bg-alternative transition-colors"
				>
					<Image src="/google-logo.svg" alt="Google" width={32} height={32} />
					<span className="flex-1 typo-title-2 font-bold text-black text-center">
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
