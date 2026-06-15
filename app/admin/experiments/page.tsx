import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

interface DashboardSummary {
	shortageViews: number;
	proClicks: number;
	ctaCtr: number;
	insufficientEvents: number;
	aiCalls: number;
	estimatedCost: number;
	spentCredits: number;
}

interface DailyMetric {
	date: string;
	shortageViews: number;
	proClicks: number;
	insufficientEvents: number;
	aiCalls: number;
}

interface FeatureMetric {
	feature: string;
	shortageViews: number;
	proClicks: number;
	ctaCtr: number;
	insufficientEvents: number;
	aiCalls: number;
	estimatedCost: number;
	spentCredits: number;
}

interface CreditExperimentDashboardData {
	summary: DashboardSummary;
	daily: DailyMetric[];
	features: FeatureMetric[];
}

export default async function AdminExperimentDashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/");

	const { data, error } = await supabase.rpc("get_credit_experiment_dashboard");

	if (error) {
		console.error("Failed to load credit experiment dashboard:", error);

		if (isAccessDeniedError(error)) {
			return <AdminAccessDenied />;
		}

		return <AdminDashboardLoadError />;
	}

	const dashboard = parseDashboardData(data);
	const maxDailyValue = Math.max(
		1,
		...dashboard.daily.map((item) =>
			Math.max(item.shortageViews, item.proClicks, item.aiCalls),
		),
	);
	const maxFeatureShortageViews = Math.max(
		1,
		...dashboard.features.map((item) => item.shortageViews),
	);

	return (
		<main className="min-h-screen bg-dnd-bg-alternative px-6 py-10">
			<div className="mx-auto flex max-w-7xl flex-col gap-8">
				<header className="flex flex-col gap-2">
					<p className="typo-label-1 font-semibold text-dnd-primary">Admin</p>
					<h1 className="typo-title-1 font-bold text-dnd-label-normal">
						크레딧 실험 대시보드
					</h1>
					<p className="typo-body-1 text-dnd-label-alternative">
						크레딧 부족 모달 노출, Pro 알림 CTA 클릭률, AI 사용량을 확인해요.
					</p>
				</header>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="부족 모달 노출"
						value={formatNumber(dashboard.summary.shortageViews)}
					/>
					<MetricCard
						label="Pro CTA 클릭"
						value={formatNumber(dashboard.summary.proClicks)}
						description={`CTR ${dashboard.summary.ctaCtr}%`}
					/>
					<MetricCard
						label="AI 호출"
						value={formatNumber(dashboard.summary.aiCalls)}
						description={`$${dashboard.summary.estimatedCost.toFixed(4)}`}
					/>
					<MetricCard
						label="차감 크레딧"
						value={formatNumber(dashboard.summary.spentCredits)}
						description={`부족 ${formatNumber(dashboard.summary.insufficientEvents)}회`}
					/>
				</section>

				<section className="rounded-3xl bg-white p-6 shadow-dnd-light">
					<div className="mb-6 flex flex-col gap-1">
						<h2 className="typo-heading-1 font-bold text-dnd-label-normal">
							최근 14일 추이
						</h2>
						<p className="typo-body-2 text-dnd-label-alternative">
							초록: 모달 노출 · 보라: CTA 클릭 · 회색: AI 호출
						</p>
					</div>
					<div className="flex h-72 items-end gap-3 overflow-x-auto border-dnd-line-normal border-b pb-4">
						{dashboard.daily.map((item) => (
							<DailyBars key={item.date} item={item} maxValue={maxDailyValue} />
						))}
					</div>
				</section>

				<section className="rounded-3xl bg-white p-6 shadow-dnd-light">
					<div className="mb-6 flex flex-col gap-1">
						<h2 className="typo-heading-1 font-bold text-dnd-label-normal">
							기능별 전환
						</h2>
						<p className="typo-body-2 text-dnd-label-alternative">
							기능별 부족 모달 노출 대비 Pro 알림 클릭률을 확인해요.
						</p>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-220 text-left">
							<thead className="typo-label-2 text-dnd-label-alternative">
								<tr className="border-dnd-line-normal border-b">
									<th className="py-3 pr-4">기능</th>
									<th className="py-3 pr-4">부족 노출</th>
									<th className="py-3 pr-4">CTA 클릭</th>
									<th className="py-3 pr-4">CTR</th>
									<th className="py-3 pr-4">AI 호출</th>
									<th className="py-3 pr-4">예상 비용</th>
									<th className="py-3">차감 크레딧</th>
								</tr>
							</thead>
							<tbody>
								{dashboard.features.map((item) => (
									<tr
										key={item.feature}
										className="border-dnd-line-normal border-b last:border-b-0"
									>
										<td className="py-4 pr-4 typo-body-2 font-semibold text-dnd-label-normal">
											{item.feature}
										</td>
										<td className="py-4 pr-4">
											<div className="flex items-center gap-3">
												<div className="h-2 w-32 rounded-full bg-dnd-fill-normal">
													<div
														className="h-2 rounded-full bg-dnd-primary"
														style={{
															width: `${Math.max(4, (item.shortageViews / maxFeatureShortageViews) * 100)}%`,
														}}
													/>
												</div>
												<span className="typo-body-2 text-dnd-label-neutral">
													{formatNumber(item.shortageViews)}
												</span>
											</div>
										</td>
										<td className="py-4 pr-4 typo-body-2 text-dnd-label-neutral">
											{formatNumber(item.proClicks)}
										</td>
										<td className="py-4 pr-4 typo-body-2 font-semibold text-dnd-primary">
											{item.ctaCtr}%
										</td>
										<td className="py-4 pr-4 typo-body-2 text-dnd-label-neutral">
											{formatNumber(item.aiCalls)}
										</td>
										<td className="py-4 pr-4 typo-body-2 text-dnd-label-neutral">
											${item.estimatedCost.toFixed(4)}
										</td>
										<td className="py-4 typo-body-2 text-dnd-label-neutral">
											{formatNumber(item.spentCredits)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</main>
	);
}

function AdminAccessDenied() {
	return (
		<main className="min-h-screen bg-dnd-bg-alternative px-6 py-10">
			<section className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl bg-white p-8 shadow-dnd-light">
				<h1 className="typo-title-2 font-bold text-dnd-label-normal">
					접근할 수 없어요
				</h1>
				<p className="typo-body-1 text-dnd-label-alternative">
					관리자 권한이 있는 계정만 실험 대시보드를 볼 수 있어요.
				</p>
			</section>
		</main>
	);
}

function AdminDashboardLoadError() {
	return (
		<main className="min-h-screen bg-dnd-bg-alternative px-6 py-10">
			<section className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl bg-white p-8 shadow-dnd-light">
				<h1 className="typo-title-2 font-bold text-dnd-label-normal">
					대시보드를 불러오지 못했어요
				</h1>
				<p className="typo-body-1 text-dnd-label-alternative">
					잠시 후 다시 시도해주세요. 문제가 계속되면 데이터베이스 상태를
					확인해주세요.
				</p>
			</section>
		</main>
	);
}

function isAccessDeniedError(error: { message?: string; code?: string }) {
	const message = error.message?.toLowerCase() ?? "";
	return message.includes("forbidden") || message.includes("unauthenticated");
}

function MetricCard({
	label,
	value,
	description,
}: {
	label: string;
	value: string;
	description?: string;
}) {
	return (
		<div className="rounded-3xl bg-white p-6 shadow-dnd-light">
			<p className="typo-label-1 text-dnd-label-alternative">{label}</p>
			<p className="mt-3 typo-title-1 font-bold text-dnd-label-normal">
				{value}
			</p>
			{description && (
				<p className="mt-2 typo-body-2 text-dnd-label-neutral">{description}</p>
			)}
		</div>
	);
}

function DailyBars({
	item,
	maxValue,
}: {
	item: DailyMetric;
	maxValue: number;
}) {
	return (
		<div className="flex min-w-20 flex-1 flex-col items-center gap-2">
			<div className="flex h-56 items-end gap-1">
				<Bar
					value={item.shortageViews}
					maxValue={maxValue}
					className="bg-dnd-primary"
				/>
				<Bar
					value={item.proClicks}
					maxValue={maxValue}
					className="bg-purple-500"
				/>
				<Bar
					value={item.aiCalls}
					maxValue={maxValue}
					className="bg-dnd-label-assistive"
				/>
			</div>
			<span className="typo-caption-1 text-dnd-label-alternative">
				{item.date.slice(5)}
			</span>
		</div>
	);
}

function Bar({
	value,
	maxValue,
	className,
}: {
	value: number;
	maxValue: number;
	className: string;
}) {
	return (
		<div
			className={`w-3 rounded-t-full ${className}`}
			style={{
				height: `${Math.max(value > 0 ? 6 : 0, (value / maxValue) * 100)}%`,
			}}
			title={String(value)}
		/>
	);
}

function parseDashboardData(data: Json): CreditExperimentDashboardData {
	const value = isRecord(data) ? data : {};
	return {
		summary: parseSummary(value.summary),
		daily: Array.isArray(value.daily) ? value.daily.map(parseDailyMetric) : [],
		features: Array.isArray(value.features)
			? value.features.map(parseFeatureMetric)
			: [],
	};
}

function parseSummary(value: Json | undefined): DashboardSummary {
	const record = isRecord(value) ? value : {};
	return {
		shortageViews: toNumber(record.shortageViews),
		proClicks: toNumber(record.proClicks),
		ctaCtr: toNumber(record.ctaCtr),
		insufficientEvents: toNumber(record.insufficientEvents),
		aiCalls: toNumber(record.aiCalls),
		estimatedCost: toNumber(record.estimatedCost),
		spentCredits: toNumber(record.spentCredits),
	};
}

function parseDailyMetric(value: Json): DailyMetric {
	const record = isRecord(value) ? value : {};
	return {
		date: typeof record.date === "string" ? record.date : "",
		shortageViews: toNumber(record.shortageViews),
		proClicks: toNumber(record.proClicks),
		insufficientEvents: toNumber(record.insufficientEvents),
		aiCalls: toNumber(record.aiCalls),
	};
}

function parseFeatureMetric(value: Json): FeatureMetric {
	const record = isRecord(value) ? value : {};
	return {
		feature: typeof record.feature === "string" ? record.feature : "UNKNOWN",
		shortageViews: toNumber(record.shortageViews),
		proClicks: toNumber(record.proClicks),
		ctaCtr: toNumber(record.ctaCtr),
		insufficientEvents: toNumber(record.insufficientEvents),
		aiCalls: toNumber(record.aiCalls),
		estimatedCost: toNumber(record.estimatedCost),
		spentCredits: toNumber(record.spentCredits),
	};
}

function isRecord(value: Json | undefined): value is Record<string, Json> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: Json | undefined) {
	return typeof value === "number" ? value : 0;
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("ko-KR").format(value);
}
