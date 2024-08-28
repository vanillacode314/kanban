import { createAsync } from '@solidjs/router';
import { JSXElement } from 'solid-js';
import { getUser } from '~/utils/auth.server';

export const route = {
	preload: () => getUser('auth-server', false)
};
export default function AuthLayout(props: { children: JSXElement }): JSXElement {
	createAsync(() => getUser('auth-client', false));
	return <>{props.children}</>;
}
