import { action, redirect } from '@solidjs/router';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getRequestEvent } from 'solid-js/web';
import { setCookie } from 'vinxi/http';
import { db } from '~/db';
import { users } from '~/db/schema';

const signUp = action(async (formData: FormData) => {
	'use server';
	const email = String(formData.get('email'));
	const password = String(formData.get('password'));

	const passwordHash = await bcrypt.hash(password, 10);

	const [user] = await db.insert(users).values({ email, passwordHash }).returning();

	if (!user) return new Error('Database Error');

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
	return (
		<div>
			<form action={signUp} method="post" class="flex flex-col gap-2 p-4">
				<input name="email" type="email" placeholder="Email" class="bg-gray-800" />
				<input name="password" type="password" placeholder="Password" class="bg-gray-800" />
				<button>submit</button>
			</form>
		</div>
	);
}
