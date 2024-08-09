import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, Suspense } from 'solid-js';
import 'virtual:uno.css';
import Nav from '~/components/Nav';
import './app.css';

export default function App() {
	return (
		<Router
			root={(props) => (
				<>
					<Nav />
					<ErrorBoundary fallback={(error) => <div>{error.message}</div>}>
						<Suspense>
							<div class="container mx-auto">{props.children}</div>
						</Suspense>
					</ErrorBoundary>
				</>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
