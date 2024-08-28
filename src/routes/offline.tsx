import { createConnectivitySignal } from '@solid-primitives/connectivity';
import { useNavigate } from '@solidjs/router';
import { createEffect } from 'solid-js';

export default function OfflinePage() {
	const navigate = useNavigate();
	const isOnline = createConnectivitySignal();
	createEffect(() => isOnline() && navigate('/'));

	return (
		<div class="grid place-content-center place-items-center">
			<span class="i-heroicons:exclamation-circle text-8xl"></span>
			<p>You are offline</p>
		</div>
	);
}
