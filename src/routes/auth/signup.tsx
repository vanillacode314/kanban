import { A, action, redirect, useSubmission } from '@solidjs/router';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { Show, createEffect, createSignal, untrack } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { toast } from 'solid-sonner';
import { setCookie } from 'vinxi/http';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { TextField, TextFieldInput, TextFieldLabel } from '~/components/ui/text-field';
import { Toggle } from '~/components/ui/toggle';
import { ONE_MONTH_IN_SECONDS } from '~/consts';
import { db } from '~/db';
import { refreshTokens, users } from '~/db/schema';

const signUp = action(async (formData: FormData) => {
	'use server';
	const email = String(formData.get('email'));
	const password = String(formData.get('password'));

	const passwordHash = await bcrypt.hash(password, 10);

	{
		const [user] = await db.select().from(users).where(eq(users.email, email));
		if (user) return new Error('Email already exists', { cause: 'EMAIL_ALREADY_EXISTS' });
	}

	const [user] = await db.insert(users).values({ email, passwordHash }).returning();

	if (!user) return new Error('Database Error', { cause: 'INTERNAL_SERVER_ERROR' });

	const accessToken = jwt.sign({ ...user, passwordHash: undefined }, process.env.AUTH_SECRET!, {
		expiresIn: '1h'
	});

	const refreshToken = jwt.sign({}, process.env.AUTH_SECRET!, {
		expiresIn: 6 * ONE_MONTH_IN_SECONDS
	});

	await db.insert(refreshTokens).values({
		userId: user.id,
		token: refreshToken,
		expiresAt: new Date(Date.now() + 6 * ONE_MONTH_IN_SECONDS * 1000)
	});

	const event = getRequestEvent()!;
	setCookie(event.nativeEvent, 'accessToken', accessToken, {
		httpOnly: true,
		secure: true,
		path: '/',
		sameSite: 'lax'
	});
	setCookie(event.nativeEvent, 'refreshToken', refreshToken, {
		httpOnly: true,
		secure: true,
		path: '/',
		sameSite: 'lax'
	});
	return redirect('/');
}, 'signup');

export default function SignUpPage() {
	const [passwordVisible, setPasswordVisible] = createSignal<boolean>(false);
	const submission = useSubmission(signUp);

	createEffect(() => {
		const result = submission.result;
		untrack(() => {
			if (!result) return;
			if (result instanceof Error) {
				switch (result.cause) {
					case 'EMAIL_ALREADY_EXISTS':
						toast.error(result.message);
						break;
					default:
						console.error(result);
				}
			}
		});
	});

	return (
		<form class="grid h-full place-content-center" action={signUp} method="post">
			<Card class="w-full max-w-sm">
				<CardHeader>
					<CardTitle class="text-2xl">Sign Up</CardTitle>
					<CardDescription>Enter your details below to create an account.</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-4">
					<div class="grid gap-2">
						<TextField>
							<TextFieldLabel for="email">Email</TextFieldLabel>
							<TextFieldInput
								id="email"
								type="email"
								name="email"
								placeholder="m@example.com"
								required
								autocomplete="username"
							/>
						</TextField>
					</div>
					<div class="grid gap-2">
						<TextField>
							<TextFieldLabel for="password">Password</TextFieldLabel>
							<div class="flex gap-2">
								<TextFieldInput
									name="password"
									id="password"
									type={passwordVisible() ? 'text' : 'password'}
									required
									autocomplete="current-password"
								/>
								<Toggle
									aria-label="toggle password"
									onChange={(value) => setPasswordVisible(value)}
								>
									{(state) => (
										<Show
											when={state.pressed()}
											fallback={<span class="i-heroicons:eye-slash text-lg"></span>}
										>
											<span class="i-heroicons:eye-solid text-lg"></span>
										</Show>
									)}
								</Toggle>
							</div>
						</TextField>
					</div>
				</CardContent>
				<CardFooter class="grid gap-4 sm:grid-cols-2">
					<Button type="submit" class="w-full">
						Sign Up
					</Button>
					<Button variant="ghost" href="/auth/signin" as={A}>
						Sign In Instead
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
