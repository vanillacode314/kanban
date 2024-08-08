import { createAsync, revalidate } from '@solidjs/router';
import { Component, For } from 'solid-js';
import type { TBoard, TTask } from '~/db/schema';
import { createBoard, deleteBoard, getBoards } from '~/db/utils/boards';
import { createTask, deleteTask, moveTask } from '~/db/utils/tasks';

export const route = {
	load: () => getBoards()
};

export default function Home() {
	const boards = createAsync(() => getBoards());

	return (
		<div class="flex flex-col gap-4 p-4">
			<div>
				<button
					class="flex items-center gap-1 rounded bg-neutral-700 px-4 py-2 text-sm font-semibold uppercase"
					onClick={async () => {
						await createBoard({ title: 'New Board' });
						await revalidate(getBoards.key);
					}}
				>
					<span class="i-heroicons:plus"></span>
					<span>Create Board</span>
				</button>
			</div>
			<div class="grid h-full grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
				<For each={boards()}>{(board) => <Board board={board} />}</For>
			</div>
		</div>
	);
}

const Task: Component<{ boardId: TBoard['id']; task: TTask }> = (props) => {
	return (
		<div
			class="flex flex-wrap items-center justify-between rounded bg-gray-900 p-4"
			draggable="true"
			onDragStart={(event) => {
				if (!event.dataTransfer) throw new Error('No data transfer');
				event.dataTransfer.setData('text/plain', `${props.boardId}:${props.task.id}`);
			}}
		>
			<span>{props.task.title}</span>
			<button
				class="flex items-center gap-1 rounded bg-red-800 px-4 py-2 text-sm font-semibold uppercase"
				onClick={async () => {
					await deleteTask(props.task.id);
					await revalidate(getBoards.key);
				}}
			>
				<span class="i-heroicons:trash"></span>
				<span>Delete</span>
			</button>
		</div>
	);
};

const Board: Component<{ board: ReturnType<typeof getBoards> }> = (props) => {
	return (
		<div
			class="flex min-h-32 flex-1 flex-col gap-2 self-start rounded bg-gray-800 p-4"
			onDragOver={(event) => {
				event.preventDefault();
			}}
			onDrop={async (event) => {
				if (!event.dataTransfer) throw new Error('No data transfer');
				const [fromBoardId, taskIdToMove] = event.dataTransfer
					.getData('text/plain')
					.split(':')
					.map(Number);

				await moveTask(taskIdToMove, fromBoardId, props.board.id);
				await revalidate(getBoards.key);
			}}
		>
			<div class="flex gap-1">
				<h3 class="text-center font-bold">{props.board.title}</h3>
				<span class="grow" />
				<button
					class="flex items-center gap-1 rounded bg-neutral-700 px-4 py-2 text-sm font-semibold uppercase"
					onClick={async () => {
						await createTask({
							title: 'New Task',
							boardId: props.board.id
						});
						await revalidate(getBoards.key);
					}}
				>
					<span class="i-heroicons:document-plus"></span>
					<span>Create Task</span>
				</button>
				<button
					class="flex items-center gap-1 rounded bg-red-800 px-4 py-2 text-sm font-semibold uppercase"
					onClick={async () => {
						await deleteBoard(props.board.id);
						await revalidate(getBoards.key);
					}}
				>
					<span class="i-heroicons:trash"></span>
					<span>Delete</span>
				</button>{' '}
			</div>
			<For each={props.board.tasks}>{(task) => <Task task={task} boardId={props.board.id} />}</For>
		</div>
	);
};
