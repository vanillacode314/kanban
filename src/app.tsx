import {
	ColorModeProvider,
	ColorModeScript,
	cookieStorageManagerSSR,
	useColorMode
} from '@kobalte/core/color-mode';
import { RouteSectionProps, Router, useBeforeLeave } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, Suspense } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Toaster, toast } from 'solid-sonner';
import { getCookie } from 'vinxi/http';
import 'virtual:uno.css';
import Nav from '~/components/Nav';
import './app.css';
function getServerCookies() {
	'use server';
	const colorMode = getCookie('kb-color-mode');
	return colorMode ? `kb-color-mode=${colorMode}` : '';
}

function RootLayout(props: RouteSectionProps) {
	const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);
	useBeforeLeave(() => toast.dismiss());

	return (
		<>
			<ColorModeScript storageType={storageManager.type} />
			<ColorModeProvider storageManager={storageManager}>
				<ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
					<Suspense>
						<ColoredToaster />
						<div class="flex h-full flex-col">
							<Nav class="full-width content-grid" />
							<div class="content-grid h-full">{props.children}</div>
						</div>
					</Suspense>
				</ErrorBoundary>
			</ColorModeProvider>
		</>
	);
}

export default function App() {
	return (
		<Router singleFlight={false} root={RootLayout}>
			<FileRoutes />
		</Router>
	);
}

function ColoredToaster() {
	const { colorMode } = useColorMode();
	return <Toaster richColors theme={colorMode()} />;
}
