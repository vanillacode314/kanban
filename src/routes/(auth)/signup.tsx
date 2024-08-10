import { action, redirect, useSubmission } from '@solidjs/router';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createEffect } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { setCookie } from 'vinxi/http';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { TextField, TextFieldInput, TextFieldLabel } from '~/components/ui/text-field';
import { db } from '~/db';
import { users } from '~/db/schema';

const signUp = action(async (formData: FormData) => {
	'use server';
	const email = String(formData.get('email'));
	const password = String(formData.get('password'));

	const passwordHash = await bcrypt.hash(password, 10);

	const [user] = await db.insert(users).values({ email, passwordHash }).returning();

	if (!user) return new Error('Database Error', { cause: 'INTERNAL_SERVER_ERROR' });

	const token = jwt.sign({ id: user.id }, process.env.AUTH_SECRET!, {
		expiresIn: '3 days'
	});

	const event = getRequestEvent()!;
	setCookie(event.nativeEvent, 'accessToken', token, {
		httpOnly: true,
		secure: true,
		path: '/',
		sameSite: 'lax'
	});
	return redirect('/');
}, 'signup');

export default function SignInPage() {
	const submission = useSubmission(signUp);

	createEffect(() => {
		const result = submission.result;
		if (!result) return;
		if (result instanceof Error) {
			switch (result.cause) {
				case 'INTERNAL_SERVER_ERROR':
					alert(result.message);
					break;
				default:
					break;
			}
		}
	});

	return (
		<div class="grid h-full place-content-center">
			<Card class="w-full min-w-80 max-w-96">
				<form action={signUp} method="post" class="flex flex-col gap-4 p-4">
					<TextField class="grid w-full items-center gap-1.5">
						<TextFieldLabel for="email">Email</TextFieldLabel>
						<TextFieldInput type="email" id="email" name="email" placeholder="Email" />
					</TextField>
					<TextField class="grid w-full items-center gap-1.5">
						<TextFieldLabel for="password">Password</TextFieldLabel>
						<TextFieldInput type="password" id="password" name="password" placeholder="password" />
					</TextField>
					<Button type="submit" class="self-end">
						Submit
					</Button>
				</form>
			</Card>
		</div>
	);
}
