import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
	AUTH_COOKIE_KEYS,
	accessTokenCookieOptions,
	refreshTokenCookieOptions,
} from "@/lib/auth/cookies";

export async function POST() {
	const cookieStore = await cookies();
	const refreshToken = cookieStore.get(AUTH_COOKIE_KEYS.REFRESH_TOKEN)?.value;

	if (!refreshToken) {
		return NextResponse.json({ error: "No refresh token" }, { status: 401 });
	}

	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/refresh`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${refreshToken}`,
			},
		},
	);

	if (!response.ok) {
		cookieStore.delete(AUTH_COOKIE_KEYS.ACCESS_TOKEN);
		cookieStore.delete(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
		return NextResponse.json(
			{ error: "Refresh failed" },
			{ status: response.status },
		);
	}

	const { data } = await response.json();

	cookieStore.set(
		AUTH_COOKIE_KEYS.ACCESS_TOKEN,
		data.accessToken,
		accessTokenCookieOptions,
	);
	cookieStore.set(
		AUTH_COOKIE_KEYS.REFRESH_TOKEN,
		data.refreshToken,
		refreshTokenCookieOptions,
	);

	return NextResponse.json({ success: true });
}
