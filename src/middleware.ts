import { redirect } from '@solidjs/router';
import { createMiddleware } from '@solidjs/start/middleware';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { H3Event, getCookie, setCookie } from 'vinxi/http';
import { db } from './db';
import { TUser, refreshTokens, users } from './db/schema';

const PUBLIC_API_ROUTE_REGEX = new RegExp('^/api/v\\d+/public/.*');

export default createMiddleware({
	onRequest: [
		async (event) => {
			event.locals.user = await getUser(event.nativeEvent);

			const pathname = new URL(event.request.url).pathname;
			const isServerRoute = pathname.startsWith('/_server');
			const isAuthRoute = pathname.startsWith('/auth');
			const isPublicRoute = pathname.startsWith('/public') || PUBLIC_API_ROUTE_REGEX.test(pathname);
			const isPrivateRoute = !(isServerRoute || isAuthRoute || isPublicRoute);

			if (event.locals.user && isAuthRoute) {
				return redirect('/');
			}
			if (!event.locals.user && isPrivateRoute) {
				return redirect('/auth/signin');
			}
		}
	]
});

async function getUser(event: H3Event) {
	const accessToken = getCookie(event, 'accessToken');

	try {
		if (accessToken) {
			return jwt.verify(accessToken, process.env.AUTH_SECRET!) as Omit<TUser, 'passwordHash'>;
		} else {
			return refreshAccessToken(event);
		}
	} catch (err) {
		return refreshAccessToken(event);
	}
}

async function refreshAccessToken(event: H3Event) {
	const refreshToken = getCookie(event, 'refreshToken');
	if (!refreshToken) return null;

	let data: string | jwt.JwtPayload;
	try {
		data = jwt.verify(refreshToken, process.env.AUTH_SECRET!);
	} catch {
		return null;
	}
	if (!data) return null;
	const [user] = await db
		.select({ id: refreshTokens.userId })
		.from(refreshTokens)
		.where(eq(refreshTokens.token, refreshToken));
	if (!user) return null;
	const [$user] = await db.select().from(users).where(eq(users.id, user.id));
	if (!$user) {
		return null;
	}
	const accessToken = jwt.sign({ ...$user, passwordHash: undefined }, process.env.AUTH_SECRET!, {
		expiresIn: '1h'
	});
	setCookie(event, 'accessToken', accessToken, {
		httpOnly: true,
		secure: true,
		path: '/',
		maxAge: 3600
	});
	return $user;
}
