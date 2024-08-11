import { useColorMode } from '@kobalte/core/color-mode';
import { action, redirect, useLocation } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { Show, createResource } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { deleteCookie, getCookie } from 'vinxi/http';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { db } from '~/db';
import { refreshTokens } from '~/db/schema';
import { getUser } from '~/db/utils/users';
import { cn } from '~/lib/utils';
import { Button } from './ui/button';

const signOut = action(async () => {
	'use server';

	const event = getRequestEvent()!;
	deleteCookie(event.nativeEvent, 'accessToken');
	const refreshToken = getCookie(event.nativeEvent, 'refreshToken');
	deleteCookie(event.nativeEvent, 'refreshToken');
	if (refreshToken) await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
	return redirect('/auth/signin');
}, 'signout');

export default function Nav(props: { class?: string }) {
	const location = useLocation();
	const [user] = createResource(
		() => location.pathname,
		() => getUser()
	);
	const { toggleColorMode } = useColorMode();

	return (
		<nav class={cn('border-offset-background full-width border-b bg-background py-4', props.class)}>
			<div class="flex items-center gap-4">
				<a href="/">
					<p class="font-bold uppercase tracking-wide">Kanban</p>
				</a>
				<span class="grow" />
				<Show when={user()}>
					<form action={signOut} method="post">
						<Button type="submit" class="flex items-center gap-2" variant="outline">
							<span>Sign Out</span>
							<span class="i-heroicons:arrow-right-end-on-rectangle text-xl"></span>
						</Button>
					</form>
				</Show>
				<Button onClick={() => toggleColorMode()} variant="outline" size="icon">
					<div class="i-heroicons:sun rotate-0 scale-100 text-xl transition-all dark:-rotate-90 dark:scale-0" />
					<div class="i-heroicons:moon absolute rotate-90 scale-0 text-xl transition-all dark:rotate-0 dark:scale-100" />
					<span class="sr-only">Toggle theme</span>
				</Button>
			</div>
			<Show when={user() && !user()?.emailVerified}>
				<Alert class="mt-4">
					<AlertTitle>Email not verified</AlertTitle>
					<AlertDescription>Please check your inbox to verify your email</AlertDescription>
				</Alert>
			</Show>
		</nav>
	);
}
