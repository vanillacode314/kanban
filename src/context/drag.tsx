import { Key } from '@solid-primitives/keyed';
import { animate, spring } from 'motion';
import {
	Accessor,
	children,
	createContext,
	createEffect,
	JSXElement,
	untrack,
	useContext
} from 'solid-js';
import { createStore, produce, SetStoreFunction } from 'solid-js/store';

type TDragItem = { id: string | number };
type TDragContext = {
	orientation: 'horizontal' | 'vertical';
	items: Array<{
		element: HTMLElement;
		top: number;
		left: number;
		width: number;
		height: number;
		offsetLeft: number;
		offsetTop: number;
		readonly centerX: number;
		readonly centerY: number;
		dragIndex: number;
	}>;
};
type TDragContextValue = [
	TDragContext,
	{
		setDragContext: SetStoreFunction<TDragContext>;
		updateIndex: (currentIndex: number, newIndex: number) => void;
		getNewDragIndex: (currentIndex: number) => number;
	}
];
const DragContext = createContext<TDragContextValue>();

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
	const [dragContext, setDragContext] = createStore<TDragContext>({
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
							let dx: number;
							if (dragContext.orientation === 'horizontal') {
								dx = nextItem.centerX - item.centerX;
								item.offsetLeft += dx;
							} else {
								dx = nextItem.centerY - item.centerY;
								item.offsetTop += dx;
							}
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
								let dx: number;
								if (dragContext.orientation === 'horizontal') {
									dx = prevItem.centerX - item.centerX;
									item.offsetLeft += dx;
								} else {
									dx = prevItem.centerY - item.centerY;
									item.offsetTop += dx;
								}
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
				} else {
					currentItem.offsetTop += totalOffset;
				}
			})
		);
	};

	function getNewDragIndex(currentIndex: number) {
		const currentItem = dragContext.items[currentIndex];
		const { top, left, width, height } = currentItem.element.getBoundingClientRect();
		const currentCenter = { x: left + width / 2, y: top + height / 2 };
		if (!currentItem) throw new Error('No current item');

		let newIndex: number = currentItem.dragIndex;
		for (const item of dragContext.items) {
			if (item === currentItem) continue;

			const index = item.dragIndex;
			const nextItem = dragContext.items.find((item) => item.dragIndex === index + 1);
			const isFirstElement = index === 0;
			const isMiddleElement = index > 0 && index < dragContext.items.length - 1;
			const isLastElement = index === dragContext.items.length - 1;

			if (dragContext.orientation === 'horizontal') {
				if (isFirstElement && currentCenter.x < item.centerX) {
					newIndex = index;
					break;
				} else if (isLastElement && currentCenter.x > item.centerX) {
					newIndex = index;
					break;
				} else if (
					isMiddleElement &&
					currentCenter.x >= item.centerX &&
					currentCenter.x < nextItem!.centerX
				) {
					newIndex = index;
					break;
				}
			} else {
				if (isFirstElement && currentCenter.y < item.centerY) {
					newIndex = index;
					break;
				} else if (isLastElement && currentCenter.y > item.centerY) {
					newIndex = index;
					break;
				} else if (
					isMiddleElement &&
					currentCenter.y >= item.centerY &&
					currentCenter.y < nextItem!.centerY
				) {
					newIndex = index;
					break;
				}
			}
		}
		return newIndex;
	}

	return (
		<DragContext.Provider value={[dragContext, { setDragContext, updateIndex, getNewDragIndex }]}>
			<Key each={props.data as T} by={(item) => item.id}>
				{(item, index) => <DragItem index={index()}>{props.children(item, index)}</DragItem>}
			</Key>
		</DragContext.Provider>
	);
}

export { DragProvider, useDrag };
export type { TDragContext, TDragContextValue };
