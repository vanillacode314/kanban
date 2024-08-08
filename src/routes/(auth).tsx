import { cache, redirect } from '@solidjs/router';
import { JSXElement } from 'solid-js';
import { getUser } from '~/db/utils/users';

export const route = {
	load: cache(async () => {
		const user = await getUser()
		if (user) {
			return redirect('/')
		}
	}, '(auth) load')
};

export default function (props: { children: JSXElement }) {
	return props.children;
}
