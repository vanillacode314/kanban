import { getRequestEvent } from 'solid-js/web';

const getUser = async () => {
	'use server';
	const event = getRequestEvent()!;
	return event.locals.user;
};

export { getUser };
