import { reload } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getRequestEvent } from 'solid-js/web';
import { deleteCookie } from 'vinxi/http';
import { db } from '~/db';
import { verificationTokens } from '~/db/schema';
import { resend } from './resend.server';

async function getUser() {
	'use server';

	const event = getRequestEvent()!;
	return event.locals.user;
}

async function refreshAccessToken() {
	'use server';
	const event = getRequestEvent()!;
	deleteCookie(event.nativeEvent, 'accessToken');
	return reload();
}

async function resendVerificationEmail() {
	'use server';
	const user = await getUser();
	if (!user) throw new Error('Unauthorized');
	const event = getRequestEvent()!;

	const verificationToken = await db.transaction(async (tx) => {
		await tx.delete(verificationTokens).where(eq(verificationTokens.userId, user.id));
		const [{ token }] = await tx
			.insert(verificationTokens)
			.values({ token: nanoid(), userId: user.id })
			.returning({ token: verificationTokens.token });
		if (!token) return new Error('Database Error');
		return token;
	});

	if (verificationToken instanceof Error) throw verificationToken;

	await resend.emails.send({
		from: 'justkanban <no-reply@notifications.raqueeb.com>',
		to: [user.email],
		subject: 'Confirm your email',
		text: `Goto this link to confirm your email: ${new URL(event.request.url).origin}/api/public/confirm-email?token=${verificationToken}`,
		tags: [
			{
				name: 'category',
				value: 'confirm_email'
			}
		]
	});
}

export { getUser, refreshAccessToken, resendVerificationEmail };
