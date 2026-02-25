"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { InsightInput } from "@/components/insight-input";
import { TopNavigation } from "@/components/top-navigation";

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
			<main className="flex flex-col items-center gap-[40px] px-[240px] pt-[60px] pb-[120px]">
				<InsightInput onSuccess={handleSuccess} />
				<div className="flex flex-col items-center gap-16 w-full pt-[20px]">
					<Image
						src="/intro-1.png"
						alt="Intro 1"
						width={1440}
						height={508}
						className="w-full h-auto"
					/>
					<Image
						src="/intro-2.png"
						alt="Intro 2"
						width={1440}
						height={508}
						className="w-full h-auto"
					/>
					<Image
						src="/intro-3.png"
						alt="Intro 3"
						width={1440}
						height={508}
						className="w-full h-auto"
					/>
					<Image
						src="/intro-4.png"
						alt="Intro 4"
						width={1440}
						height={508}
						className="w-full h-auto"
					/>
				</div>
			</main>
		</div>
	);
}
