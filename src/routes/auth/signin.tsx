import { A, action, redirect, useNavigate, useSubmission } from '@solidjs/router';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { Show, createEffect, createSignal, untrack } from 'solid-js';
import { getRequestEvent } from 'solid-js/web';
import { toast } from 'solid-sonner';
import { setCookie } from 'vinxi/http';
import { z } from 'zod';
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

const signIn = action(async (formData: FormData) => {
	'use server';
	const email = String(formData.get('email'));
	const password = String(formData.get('password'));

	const [user] = await db.select().from(users).where(eq(users.email, email));

	if (!user) return new Error('Email or password incorrect', { cause: 'INVALID_CREDENTIALS' });

	if (!(await bcrypt.compare(password, user.passwordHash)))
		return new Error('Email or password incorrect', { cause: 'INVALID_CREDENTIALS' });

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
		sameSite: 'lax',
		maxAge: 2 ** 31
	});
	setCookie(event.nativeEvent, 'refreshToken', refreshToken, {
		httpOnly: true,
		secure: true,
		path: '/',
		sameSite: 'lax',
		maxAge: 2 ** 31
	});
	return redirect('/');
}, 'signin');

export default function SignInPage() {
	const [passwordVisible, setPasswordVisible] = createSignal<boolean>(false);
	const submission = useSubmission(signIn);
	const [email, setEmail] = createSignal('');
	const navigate = useNavigate();

	let toastId: string | number | undefined;
	createEffect(() => {
		const { result, pending } = submission;

		untrack(() => {
			if (pending) {
				if (toastId) toast.dismiss(toastId);
				toastId = toast.loading('Logging in...', { duration: Number.POSITIVE_INFINITY });
				return;
			}
			if (!result) return;
			if (result instanceof Error) {
				switch (result.cause) {
					case 'INVALID_CREDENTIALS':
						toast.error(result.message, { id: toastId, duration: 3000 });
						break;
					default:
						console.error(result);
				}
			} else {
				toast.success('Login successful', { id: toastId, duration: 3000 });
			}
			toastId = undefined;
		});
	});

	return (
		<form class="grid h-full place-content-center" action={signIn} method="post">
			<Card class="w-full max-w-sm">
				<CardHeader>
					<CardTitle class="text-2xl">Sign In</CardTitle>
					<CardDescription>Enter your details below to login to your account.</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-4">
					<div class="grid gap-2">
						<TextField>
							<TextFieldLabel for="email">Email</TextFieldLabel>
							<TextFieldInput
								value={email()}
								onInput={(e) => setEmail(e.currentTarget.value)}
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
							<div class="flex items-center justify-between gap-2">
								<TextFieldLabel for="password">Password</TextFieldLabel>
								<Button
									onClick={() => {
										try {
											const $email = z.string().email().parse(email());
											navigate('/auth/forgot-password?email=' + $email);
										} catch {
											toast.error('Invalid email', { id: toastId, duration: 3000 });
										}
									}}
									variant="link"
								>
									Forgot Password?
								</Button>
							</div>
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
						Sign in
					</Button>
					<Button variant="ghost" href="/auth/signup" as={A}>
						Sign Up Instead
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
