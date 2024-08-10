import { redirect } from '@solidjs/router';
import { createMiddleware } from '@solidjs/start/middleware';
import jwt from 'jsonwebtoken';
import { getCookie } from 'vinxi/http';

export default createMiddleware({
	onRequest: [
		async (event) => {
			const token = getCookie(event.nativeEvent, 'accessToken');
			event.locals.user = null;

			if (token) {
				try {
					event.locals.user = jwt.verify(token, process.env.AUTH_SECRET!) as { id: number };
				} catch (err) {}
			}

			const pathname = new URL(event.request.url).pathname;
			const isServerRoute = pathname.startsWith('/_server');
			const isAuthRoute = pathname.startsWith('/auth');
			const isPublicRoute = pathname.startsWith('/public');
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
