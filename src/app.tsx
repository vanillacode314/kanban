import {
	ColorModeProvider,
	ColorModeScript,
	cookieStorageManagerSSR,
	useColorMode
} from '@kobalte/core/color-mode';
import { createConnectivitySignal, makeConnectivityListener } from '@solid-primitives/connectivity';
import { MetaProvider, Title } from '@solidjs/meta';
import {
	RouteSectionProps,
	Router,
	useBeforeLeave,
	useLocation,
	useNavigate
} from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { For, JSXElement, Suspense, createEffect } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Toaster, toast } from 'solid-sonner';
import { getCookie } from 'vinxi/http';
import 'virtual:uno.css';
import Nav from '~/components/Nav';
import './app.css';
import { AppProvider } from './context/app';

function getServerCookies() {
	'use server';
	const colorMode = getCookie('kb-color-mode');
	return colorMode ? `kb-color-mode=${colorMode}` : '';
}

function AutoImportModals() {
	const modals = import.meta.glob('~/components/modals/auto-import/*.tsx', {
		eager: true,
		import: 'default'
	}) as Record<string, () => JSXElement>;

	return <For each={Object.values(modals)}>{(Modal) => <Modal />}</For>;
}

const RootLayout = (props: RouteSectionProps) => {
	const location = useLocation();
	const path = () => decodeURIComponent(location.pathname);
	const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);
	useBeforeLeave(() => toast.dismiss());
	const navigate = useNavigate();
	const isOnline = createConnectivitySignal();
	createEffect(() => !isOnline() && navigate('/offline'));

	return (
		<>
			<ColorModeScript storageType={storageManager.type} />
			<ColorModeProvider storageManager={storageManager}>
				<AppProvider path={path()}>
					<Title>JustKanban</Title>
					<ColoredToaster />
					<div class="flex h-full flex-col overflow-hidden">
						<Nav class="full-width content-grid" />
						<div class="content-grid h-full overflow-hidden">{props.children}</div>
					</div>
					<AutoImportModals />
				</AppProvider>
			</ColorModeProvider>
		</>
	);
};

export default function App() {
	return (
		<Router
			singleFlight={false}
			root={(props) => (
				<Suspense>
					<MetaProvider>
						<RootLayout {...props} />
					</MetaProvider>
				</Suspense>
			)}
		>
			<FileRoutes />
		</Router>
	);
}

function ColoredToaster() {
	const { colorMode } = useColorMode();
	return <Toaster richColors theme={colorMode()} duration={5000} />;
}
