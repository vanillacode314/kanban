import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, Suspense } from 'solid-js';
import 'virtual:uno.css';
import Nav from '~/components/Nav';
import './app.css';

import { ColorModeProvider, ColorModeScript, cookieStorageManagerSSR } from '@kobalte/core';
import { isServer } from 'solid-js/web';
import { getCookie } from 'vinxi/http';
function getServerCookies() {
	'use server';
	const colorMode = getCookie('kb-color-mode');
	return colorMode ? `kb-color-mode=${colorMode}` : '';
}

export default function App() {
	const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);
	return (
		<Router
			root={(props) => (
				<>
					<ColorModeScript storageType={storageManager.type} />
					<ColorModeProvider storageManager={storageManager}>
						<Nav class="container mx-auto" />
						<ErrorBoundary fallback={(error) => <div>{error.message}</div>}>
							<Suspense>
								<div class="container mx-auto h-full p-4">{props.children}</div>
							</Suspense>
						</ErrorBoundary>
					</ColorModeProvider>
				</>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
