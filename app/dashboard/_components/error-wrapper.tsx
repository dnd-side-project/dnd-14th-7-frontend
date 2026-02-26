"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface ClientBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	suspenseFallback?: React.ReactNode;
}

export function ClientBoundary({
	children,
	fallback = <div />,
	suspenseFallback,
}: ClientBoundaryProps) {
	return (
		<ErrorBoundary fallback={fallback}>
			<Suspense fallback={suspenseFallback}>{children}</Suspense>
		</ErrorBoundary>
	);
}
