import { cache, redirect } from '@solidjs/router';
import { JSXElement } from 'solid-js';
import { getUser } from '~/db/utils/users';

const load = cache(async () => {
	const user = await getUser();
	if (user) {
		return redirect('/');
	}
}, '(auth) load');

export const route = { load };

export default function (props: { children: JSXElement }) {
	return props.children;
}
