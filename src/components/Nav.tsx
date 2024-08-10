import { useColorMode } from '@kobalte/core';
import { action, redirect } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { deleteCookie } from 'vinxi/http';
import { cn } from '~/lib/utils';
import { Button } from './ui/button';

const signOut = action(async () => {
	'use server';

	const event = getRequestEvent()!;
	deleteCookie(event.nativeEvent, 'accessToken');
	return redirect('/signin');
}, 'signout');

export default function Nav(props: { class?: string }) {
	const { toggleColorMode } = useColorMode();

	return (
		<div class={cn('border-offset-background full-width bg-background border-b py-4', props.class)}>
			<div class="flex items-center gap-4">
				<a href="/">
					<p class="font-bold uppercase tracking-wide">Kanban</p>
				</a>
				<span class="grow" />
				<form action={signOut} method="post">
					<Button type="submit" class="flex items-center gap-2" variant="outline">
						<span>Sign Out</span>
						<span class="i-heroicons:arrow-right-end-on-rectangle text-xl"></span>
					</Button>
				</form>
				<Button onClick={() => toggleColorMode()} variant="outline" size="icon">
					<div class="i-heroicons:sun rotate-0 scale-100 text-xl transition-all dark:-rotate-90 dark:scale-0" />
					<div class="i-heroicons:moon absolute rotate-90 scale-0 text-xl transition-all dark:rotate-0 dark:scale-100" />
					<span class="sr-only">Toggle theme</span>
				</Button>
			</div>
		</div>
	);
}
