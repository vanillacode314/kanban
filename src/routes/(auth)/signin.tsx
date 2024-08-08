import { action, redirect } from '@solidjs/router';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getRequestEvent } from 'solid-js/web';
import { setCookie } from 'vinxi/http';
import { db } from '~/db';
import { users } from '~/db/schema';

const signIn = action(async (formData: FormData) => {
	'use server';
	const email = String(formData.get('email'));
	const password = String(formData.get('password'));

	const [user] = await db
		.select({ id: users.id, passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.email, email));

	if (!user) return new Error('Invalid Credentials');

	if (!(await bcrypt.compare(password, user.passwordHash))) return new Error('Invalid Credentials');

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
}, 'signin');

export default function SignInPage() {
	return (
		<div>
			<form action={signIn} method="post" class="flex flex-col gap-2 p-4">
				<input name="email" type="email" placeholder="Email" class="bg-gray-800" />
				<input name="password" type="password" placeholder="Password" class="bg-gray-800" />
				<button>submit</button>
			</form>
		</div>
	);
}
