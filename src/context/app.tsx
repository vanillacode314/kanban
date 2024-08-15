import * as v from '@valibot/valibot';
import { createContext, JSXElement, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { boardSchema, taskSchema } from '~/db/schema';

const appContextSchema = v.optional(
	v.object({
		currentBoard: v.nullish(boardSchema, null),
		currentTask: v.nullish(taskSchema, null)
	}),
	{}
);
type TAppContext = v.InferOutput<typeof appContextSchema>;
const AppContext =
	createContext<[appContext: TAppContext, setAppContext: SetStoreFunction<TAppContext>]>();

function useApp() {
	const value = useContext(AppContext);
	if (!value) throw new Error('useApp must be used within an AppContextProvider');
	return value;
}

function AppContextProvider(props: { children: JSXElement }) {
	const [appContext, setAppContext] = createStore<TAppContext>(
		v.parse(appContextSchema, undefined)
	);

	return (
		<AppContext.Provider value={[appContext, setAppContext]}>{props.children}</AppContext.Provider>
	);
}

export { AppContextProvider, useApp };
