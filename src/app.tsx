import {
	ColorModeProvider,
	ColorModeScript,
	cookieStorageManagerSSR,
	useColorMode
} from '@kobalte/core/color-mode';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, Suspense } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Toaster } from 'solid-sonner';
import { getCookie } from 'vinxi/http';
import 'virtual:uno.css';
import Nav from '~/components/Nav';
import './app.css';
function getServerCookies() {
	'use server';
	const colorMode = getCookie('kb-color-mode');
	return colorMode ? `kb-color-mode=${colorMode}` : '';
}

export default function App() {
	const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);

	return (
		<Router
			singleFlight={false}
			root={(props) => (
				<>
					<ColorModeScript storageType={storageManager.type} />
					<ColorModeProvider storageManager={storageManager}>
						<ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
							<Suspense>
								<ColoredToaster />
								<div class="flex h-full flex-col">
									<Nav class="container mx-auto" />
									<div class="container mx-auto h-full p-4">{props.children}</div>
								</div>
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

function ColoredToaster() {
	const { colorMode } = useColorMode();
	return <Toaster richColors theme={colorMode()} />;
}
