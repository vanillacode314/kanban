import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { getRequestEvent } from 'solid-js/web';
import { getCookie } from 'vinxi/http';
import { db } from '..';
import { users } from '../schema';

const getUser = async () => {
	'use server';

	const event = getRequestEvent()!;
	const token = getCookie(event.nativeEvent, 'accessToken');
	if (!token) return null;

	let data;
	try {
		data = jwt.verify(token, process.env.AUTH_SECRET!) as { id: number };
	} catch (err) {
		return null;
	}
	if (!Number.isInteger(data.id)) return null;

	const [$user] = await db.select().from(users).where(eq(users.id, data.id));
	if (!$user) return null;

	return $user;
};

export { getUser };
