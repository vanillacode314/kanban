import { createContext, JSXElement, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { TBoard, TTask } from '~/db/schema';

const DEFAULT_APP_CONTEXT = {
	currentBoard: null,
	currentTask: null
} satisfies TAppContext;
type TAppContext = { currentBoard: null | TBoard; currentTask: null | TTask };
const AppContext =
	createContext<[appContext: TAppContext, setAppContext: SetStoreFunction<TAppContext>]>();

function useApp() {
	const value = useContext(AppContext);
	if (!value) throw new Error('useApp must be used within an AppProvider');
	return value;
}

function AppProvider(props: { children: JSXElement }) {
	const [appContext, setAppContext] = createStore<TAppContext>(
		structuredClone(DEFAULT_APP_CONTEXT)
	);

	return (
		<AppContext.Provider value={[appContext, setAppContext]}>{props.children}</AppContext.Provider>
	);
}

export { AppProvider, useApp };
