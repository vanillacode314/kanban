import { Key } from '@solid-primitives/keyed';
import { resolveElements } from '@solid-primitives/refs';
import { createListTransition } from '@solid-primitives/transition-group';
import { revalidate, useAction, useSubmissions } from '@solidjs/router';
import { DragGesture } from '@use-gesture/vanilla';
import { animate, spring } from 'motion';
import { Component, Show, createEffect, createSignal, onCleanup, untrack } from 'solid-js';
import { toast } from 'solid-sonner';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { useApp } from '~/context/app';
import { getNewIndex, useDrag } from '~/context/drag';
import { TBoard, TTask } from '~/db/schema';
import { deleteBoard, getBoards, moveBoard } from '~/db/utils/boards';
import { createTask, moveTask } from '~/db/utils/tasks';
import { useConfirmModal } from './modals/auto-import/ConfirmModal';
import { setCreateTaskModalOpen } from './modals/auto-import/CreateTaskModal';
import { setUpdateBoardModalOpen } from './modals/auto-import/UpdateBoardModal';
import Task from './Task';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function uniqBy<T>(arr: T[], key: (item: T) => string | number) {
	const seen = new Set();
	return arr.filter((item) => {
		const k = key(item);
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}

export const Board: Component<{
	board: TBoard & { tasks: TTask[] };
	index: number;
}> = (props) => {
	const [dragContext, { setDragContext, updateIndex }] = useDrag();
	const [boardElement, setBoardElement] = createSignal<HTMLDivElement>();
	let dragHandleEl!: HTMLElement;
	const submission = useSubmissions(createTask);
	const pendingTasks = () =>
		[...submission.values()]
			.filter(
				(submission) =>
					submission.pending && String(submission.input[0].get('boardId')) === props.board.id
			)
			.map((submission) => ({
				title: submission.input[0].get('title') + ' (pending)',
				id: String(submission.input[0].get('id')),
				index: props.board.tasks.length + 1
			}));

	const [_appContext, setAppContext] = useApp();
	const tasks = () =>
		uniqBy(props.board.tasks ? [...props.board.tasks, ...pendingTasks()] : [], (task) => task.id);

	function getCenterCoords(
		element: HTMLElement,
		{ removeOffset = false }: { removeOffset?: boolean } = {}
	): [number, number] {
		const { left, top, width, height } = element.getBoundingClientRect();
		let [offsetX, offsetY] = [0, 0];
		if (removeOffset)
			[offsetX, offsetY] = [
				element.style.getPropertyValue('--motion-translateX'),
				element.style.getPropertyValue('--motion-translateY')
			].map((value) => {
				return value === '' ? 0 : Number(value.replace('px', ''));
			});
		return [left + width / 2 - offsetX, top + height / 2 - offsetY];
	}

	createEffect(() => {
		const currentItem = dragContext.items.find((item) => item.element === boardElement())!;
		if (!currentItem) return;

		const gesture = untrack(() => {
			let offset = [0, 0];
			return new DragGesture(dragHandleEl, ({ movement: [mx, my], xy: [x, y], down, memo }) => {
				if (down) {
					const newIndex = getNewIndex(props.index, dragContext.items);
					if (newIndex !== currentItem.dragIndex) updateIndex(currentItem.dragIndex, newIndex);
					currentItem.element.classList.add('z-20');
					const animation = animate(
						currentItem.element,
						{ x: mx + offset[0], y: my + offset[1] },
						{ duration: 0 }
					);
				} else {
					currentItem.element.classList.remove('z-20');
					currentItem.element.classList.add('z-10');
					const animation = animate(
						currentItem.element,
						{ x: currentItem.offsetLeft, y: currentItem.offsetTop },
						{ easing: spring() }
					);
					animation.finished.then(() => currentItem.element.classList.remove('z-10'));
					offset = [currentItem.offsetLeft, currentItem.offsetTop];
					if (currentItem.dragIndex !== props.board.index) {
						toast.promise(
							() =>
								moveBoard(props.board.id, currentItem.dragIndex).then(() =>
									revalidate(getBoards.key)
								),
							{
								loading: 'Moving',
								success: `Moved board: ${props.board.title}`,
								error: 'Error'
							}
						);
					}
				}
			});
		});
		onCleanup(() => gesture.destroy());
	});

	return (
		<Card
			ref={setBoardElement}
			class="group/board"
			onDragOver={(event) => {
				event.preventDefault();
			}}
			onDrop={async (event) => {
				if (!event.dataTransfer) throw new Error('No data transfer');
				const taskIdToMove = String(event.dataTransfer.getData('text/plain'));

				toast.promise(
					async () => {
						const task = await moveTask(taskIdToMove, props.board.id);
						await revalidate(getBoards.key);
						return task;
					},
					{
						loading: 'Moving',
						success: `Moved task to board: ${props.board.title}`,
						error: 'Error'
					}
				);
			}}
		>
			<CardHeader>
				<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
					<CardTitle>{props.board.title}</CardTitle>
					<span
						class="i-akar-icons:drag-horizontal-fill cursor-move touch-none opacity-0 transition-opacity group-hover/board:opacity-100"
						ref={dragHandleEl}
					/>
					<div class="flex items-center justify-end gap-2">
						<Button
							class="flex items-center gap-2"
							title="Create Task"
							size="icon"
							onClick={() => {
								setCreateTaskModalOpen(true);
								setAppContext('currentBoard', props.board);
							}}
						>
							<span class="i-heroicons:plus text-lg"></span>
						</Button>
						<BoardContextMenu board={props.board} />
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div class="flex flex-col gap-2">
					<Show when={tasks().length > 0} fallback={<p>No tasks in this board</p>}>
						<AnimatedTaskList boardId={props.board.id} tasks={tasks()} />
					</Show>
				</div>
			</CardContent>
		</Card>
	);
};

function BoardContextMenu(props: { board: ReturnType<typeof getBoards> }) {
	const [_appContext, setAppContext] = useApp();
	const confirmModal = useConfirmModal();
	const $deleteBoard = useAction(deleteBoard);

	return (
		<div class="flex-col">
			<DropdownMenu>
				<DropdownMenuTrigger as={Button<'button'>} size="icon" variant="ghost">
					<span class="i-heroicons:ellipsis-vertical text-lg"></span>
				</DropdownMenuTrigger>
				<DropdownMenuContent class="w-48">
					<DropdownMenuItem
						as="button"
						class="w-full"
						onClick={() => {
							setAppContext('currentBoard', props.board);
							setUpdateBoardModalOpen(true);
						}}
					>
						<span>Edit</span>
						<DropdownMenuShortcut>
							<span class="i-heroicons:pencil-solid"></span>
						</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem
						as="button"
						class="w-full"
						onClick={() => {
							confirmModal.open({
								title: 'Delete Board',
								message: "Are you sure you want to delete this board and all it's tasks?",
								onYes: async () => {
									const formData = new FormData();
									formData.set('id', props.board.id.toString());
									toast.promise(() => $deleteBoard(formData), {
										loading: 'Deleting Board',
										success: 'Deleted Board',
										error: 'Error'
									});
								}
							});
						}}
					>
						<span>Delete</span>
						<DropdownMenuShortcut>
							<span class="i-heroicons:trash"></span>
						</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

const AnimatedTaskList = (props: {
	boardId: TBoard['id'];
	tasks: Pick<TTask, 'id' | 'title'>[];
}) => {
	const resolved = resolveElements(
		() => (
			<Key each={props.tasks} by="id">
				{(task) => <Task task={task()} boardId={props.boardId} class="origin-top" />}
			</Key>
		),
		(el): el is HTMLElement => el instanceof HTMLElement
	);
	const transition = createListTransition(resolved.toArray, {
		onChange({ list: _list, added, removed, unchanged, finishRemoved }) {
			let removedCount = removed.length;
			// the callback is called before the added elements are inserted into the DOM
			// so run the animation in the next animation frame / microtask
			for (const el of added) {
				queueMicrotask(() => {
					animate(el, { opacity: [0, 1], scaleY: [0, 1] }, { easing: spring() });
				});
			}
			for (const el of removed) {
				const { left, top, width, height } = el.getBoundingClientRect();
				queueMicrotask(() => {
					el.style.position = 'absolute';
					el.style.left = `${left}px`;
					el.style.top = `${top}px`;
					el.style.width = `${width}px`;
					el.style.height = `${height}px`;
					animate(el, { opacity: [1, 0], scaleY: [1, 0] }, { easing: spring() }).finished.then(
						() => {
							removedCount -= 1;
							if (removedCount === 0) {
								finishRemoved(removed);
							}
						}
					);
				});
			}
			for (const el of unchanged) {
				const { left: left1, top: top1 } = el.getBoundingClientRect();
				if (!el.isConnected) return;
				queueMicrotask(() => {
					const { left: left2, top: top2 } = el.getBoundingClientRect();
					animate(el, { x: [left1 - left2, 0], y: [top1 - top2, 0] }, { easing: spring() });
				});
			}
		}
	});
	return <>{transition()}</>;
};
export default Board;
