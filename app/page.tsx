"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { InsightInput } from "@/components/insight-input";
import { TopNavigation } from "@/components/top-navigation";
import intro1Image from "../public/intro-1.webp";
import intro2Image from "../public/intro-2.webp";
import intro3Image from "../public/intro-3.webp";
import intro4Image from "../public/intro-4.webp";

const INTRO_IMAGE_SIZES = "(max-width: 768px) 100vw, calc(100vw - 480px)";

export default function Page() {
	const router = useRouter();

	const handleSuccess = (id: number) => {
		const params = new URLSearchParams();
		params.set("openTab", `insight:${id}`);
		params.set("currentTab", `insight:${id}`);
		router.push(`/dashboard?${params.toString()}`);
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,rgba(242,250,249,0.15)_3.5%,rgb(242,250,249)_35.4%),white]">
			<TopNavigation />
			<main className="flex flex-col items-center gap-10 px-4 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-[120px] xl:px-[240px] xl:pb-[120px] xl:pt-[60px]">
				<InsightInput onSuccess={handleSuccess} />
				<div className="flex flex-col items-center gap-16 w-full pt-[20px]">
					<Image
						src={intro1Image}
						alt="Intro 1"
						sizes={INTRO_IMAGE_SIZES}
						priority
						className="w-full h-auto"
					/>
					<Image
						src={intro2Image}
						alt="Intro 2"
						sizes={INTRO_IMAGE_SIZES}
						className="w-full h-auto"
					/>
					<Image
						src={intro3Image}
						alt="Intro 3"
						sizes={INTRO_IMAGE_SIZES}
						className="w-full h-auto"
					/>
					<Image
						src={intro4Image}
						alt="Intro 4"
						sizes={INTRO_IMAGE_SIZES}
						className="w-full h-auto"
					/>
				</div>
			</main>
		</div>
	);
}
