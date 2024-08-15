import { trackDeep } from '@solid-primitives/deep';
import { Key } from '@solid-primitives/keyed';
import { animate, spring } from 'motion';
import {
	Accessor,
	children,
	createContext,
	createEffect,
	For,
	JSXElement,
	onMount,
	untrack,
	useContext
} from 'solid-js';
import { createStore, produce, SetStoreFunction } from 'solid-js/store';
import { isServer } from 'solid-js/web';

const HTMLElement = (isServer
	? class {}
	: window.HTMLElement) as unknown as typeof window.HTMLElement;

type TDragItem = { id: string | number };
type TDragContext<T extends TDragItem> = {
	orientation: 'horizontal' | 'vertical';
	items: Array<{
		element: HTMLElement;
		top: number;
		left: number;
		width: number;
		height: number;
		offsetLeft: number;
		offsetTop: number;
		centerX: number;
		centerY: number;
		dragIndex: number;
	}>;
};
type TDragContextValue<T extends TDragItem> = [
	TDragContext<T>,
	{
		setDragContext: SetStoreFunction<TDragContext<T>>;
		updateIndex: (currentIndex: number, newIndex: number) => void;
	}
];
const DragContext = createContext<TDragContextValue<any>>();

function useDrag() {
	const value = useContext(DragContext);
	if (!value) throw new Error('useDrag must be used within an DragContextProvider');
	return value;
}

function DragProvider<T extends Array<TDragItem>>(props: {
	children: (item: Accessor<T[number]>, index: Accessor<number>) => JSXElement;
	data: T;
	orientation: 'horizontal' | 'vertical';
}) {
	const [dragContext, setDragContext] = createStore<TDragContext<T[number]>>({
		items: [],
		orientation: props.orientation
	});

	function DragItem(props: { children: JSXElement; index: number }) {
		const r = children(() => props.children);
		createEffect(() => {
			const { index } = props;
			const element = r() as HTMLElement;
			untrack(() => {
				const { top, left, width, height } = element.getBoundingClientRect();
				setDragContext('items', index, () => ({
					element,
					top,
					left,
					width,
					height,
					offsetLeft: 0,
					offsetTop: 0,
					dragIndex: props.index,
					get centerX() {
						return this.left + this.width / 2 + this.offsetLeft;
					},
					get centerY() {
						return this.top + this.height / 2 + this.offsetTop;
					}
				}));
				animate(element, { x: 0, y: 0 }, { duration: 0 }).finished.then(() => {
					const { top, left, width, height } = element.getBoundingClientRect();
					setDragContext('items', index, {
						top,
						left,
						width,
						height
					});
				});
			});
		});

		return <>{r()}</>;
	}

	const updateIndex = (currentIndex: number, newIndex: number) => {
		setDragContext(
			'items',
			produce((items) => {
				if (currentIndex === newIndex) throw new Error(`Can't move to same index ${currentIndex}`);
				let currentItem = items.find((item) => item.dragIndex === currentIndex)!;
				let totalOffset = 0;
				if (currentIndex > newIndex) {
					for (const item of items) {
						const index = item.dragIndex;
						if (index < newIndex) continue;
						else if (index >= newIndex && index < currentIndex) {
							const nextItem =
								index === currentIndex - 1
									? currentItem
									: items.find((item) => item.dragIndex === index + 1)!;
							const dx = nextItem.centerX - item.centerX;
							item.offsetLeft += dx;
							totalOffset -= dx;
							item.dragIndex += 1;
							queueMicrotask(() => {
								animate(
									item.element,
									{ x: item.offsetLeft, y: item.offsetTop },
									{ easing: spring() }
								);
							});
						} else if (index === currentIndex) {
							item.dragIndex = newIndex;
						}
					}
				} else {
					for (const item of items) {
						const index = item.dragIndex;
						if (index < currentIndex) continue;
						else if (index === currentIndex) {
							item.dragIndex = newIndex;
						} else if (index > currentIndex && index <= newIndex) {
							if (dragContext.orientation === 'horizontal') {
								const prevItem =
									index === currentIndex + 1
										? currentItem
										: items.find((item) => item.dragIndex === index - 1)!;
								const dx = prevItem.centerX - item.centerX;
								item.offsetLeft += dx;
								totalOffset -= dx;
								item.dragIndex -= 1;
								queueMicrotask(() => {
									animate(
										item.element,
										{ x: item.offsetLeft, y: item.offsetTop },
										{ easing: spring() }
									);
								});
							}
						}
					}
				}
				currentItem = items.find((item) => item.dragIndex === newIndex)!;
				if (dragContext.orientation === 'horizontal') {
					currentItem.offsetLeft += totalOffset;
				}
			})
		);
	};

	return (
		<DragContext.Provider value={[dragContext, { setDragContext, updateIndex }]}>
			<Key each={props.data as T} by={(item) => item.id}>
				{(item, index) => (
					<DragItem index={index()} data={item()}>
						{props.children(item, index)}
					</DragItem>
				)}
			</Key>
		</DragContext.Provider>
	);
}

function getNewIndex(currentIndex: number, items: TDragContext<any>['items']) {
	const currentItem = items[currentIndex];
	const { top, left, width, height } = currentItem.element.getBoundingClientRect();
	const currentCenter = { x: left + width / 2, y: top + height / 2 };
	if (!currentItem) throw new Error('No current item');

	let newIndex: number = currentItem.dragIndex;
	for (const item of items) {
		const index = item.dragIndex;
		if (item === currentItem) continue;
		const nextItem = items.find((item) => item.dragIndex === index + 1);
		if (index === 0 && currentCenter.x < item.centerX) {
			newIndex = index;
			break;
		} else if (index === items.length - 1 && currentCenter.x > item.centerX) {
			newIndex = index;
			break;
		} else if (
			index > 0 &&
			index < items.length - 1 &&
			currentCenter.x >= item.centerX &&
			currentCenter.x < nextItem!.centerX
		) {
			newIndex = index;
			break;
		}
	}
	return newIndex;
}

export { DragProvider, getNewIndex, useDrag };
export type { TDragContext, TDragContextValue };
