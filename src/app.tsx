import {
	ColorModeProvider,
	ColorModeScript,
	cookieStorageManagerSSR,
	useColorMode
} from '@kobalte/core/color-mode';
import { RouteSectionProps, Router, useBeforeLeave } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { For, JSXElement, Suspense, createEffect, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';
import { Toaster, toast } from 'solid-sonner';
import { getCookie } from 'vinxi/http';
import 'virtual:uno.css';
import Nav from '~/components/Nav';
import './app.css';
import { AppContextProvider } from './context/app';
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

function RootLayout(props: RouteSectionProps) {
	const storageManager = cookieStorageManagerSSR(isServer ? getServerCookies() : document.cookie);
	useBeforeLeave(() => toast.dismiss());

	return (
		<>
			<Suspense>
				<ColorModeScript storageType={storageManager.type} />
				<ColorModeProvider storageManager={storageManager}>
					<AppContextProvider>
						<ColoredToaster />
						<div class="flex h-full flex-col">
							<Nav class="full-width content-grid" />
							<div class="content-grid h-full">{props.children}</div>
						</div>
						<MouseCoords />
						<AutoImportModals />
					</AppContextProvider>
				</ColorModeProvider>
			</Suspense>
		</>
	);
}

function MouseCoords() {
	const [pos, setPos] = createStore({ x: 0, y: 0 });
	onMount(() => {
		document.addEventListener('mousemove', (e) => {
			setPos({ x: e.clientX, y: e.clientY });
		});
	});
	return (
		<p
			class="pointer-events-none absolute rounded bg-white p-1 text-sm font-bold uppercase text-black"
			style={{
				transform: 'translate(-100%, -100%)',
				left: `${pos.x}px`,
				top: `${pos.y}px`
			}}
		>
			{pos.x}, {pos.y}
		</p>
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
	return <Toaster richColors theme={colorMode()} duration={5000} />;
}
