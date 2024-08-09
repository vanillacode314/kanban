import { createAsync, revalidate, useSubmissions } from '@solidjs/router';
import { Component, For } from 'solid-js';
import type { TBoard, TTask } from '~/db/schema';
import { createBoard, deleteBoard, getBoards } from '~/db/utils/boards';
import { createTask, deleteTask, moveTask } from '~/db/utils/tasks';

export const route = {
	load: () => getBoards()
};

export default function Home() {
	const serverBoards = createAsync(() => getBoards());
	const submissions = useSubmissions(createBoard);

	const pendingBoards = () =>
		[...submissions.values()]
			.filter((submission) => submission.pending)
			.map((submission) => ({
				title: submission.input[0].get('title') + ' (pending)'
			}));

	const boards = () => (serverBoards() ? [...serverBoards()!, ...pendingBoards()] : []);

	return (
		<div class="flex flex-col gap-4 p-4">
			<div>
				<form action={createBoard} method="post">
					<input type="hidden" value="Test Board" name="title" />
					<button class="flex items-center gap-1 rounded bg-neutral-700 px-4 py-2 text-sm font-semibold uppercase">
						<span class="i-heroicons:plus"></span>
						<span>Create Board</span>
					</button>
				</form>
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
				event.dataTransfer.setData('text/plain', String(props.task.id));
			}}
		>
			<span>{props.task.title}</span>
			<form action={deleteTask} method="post">
				<input type="hidden" value={props.task.id} name="id" />
				<button class="flex items-center gap-1 rounded bg-red-800 px-4 py-2 text-sm font-semibold uppercase">
					<span class="i-heroicons:trash"></span>
					<span>Delete</span>
				</button>
			</form>
		</div>
	);
};

const Board: Component<{ board: ReturnType<typeof getBoards> }> = (props) => {
	const submission = useSubmissions(createTask);
	const pendingTasks = () =>
		[...submission.values()]
			.filter(
				(submission) =>
					submission.pending && Number(submission.input[0].get('boardId')) === props.board.id
			)
			.map((submission) => ({ title: submission.input[0].get('title') + ' (pending)' }));

	const tasks = () => (props.board.tasks ? [...props.board.tasks, ...pendingTasks()] : []);

	return (
		<div
			class="flex min-h-32 flex-1 flex-col gap-2 self-start rounded bg-gray-800 p-4"
			onDragOver={(event) => {
				event.preventDefault();
			}}
			onDrop={async (event) => {
				if (!event.dataTransfer) throw new Error('No data transfer');
				const taskIdToMove = Number(event.dataTransfer.getData('text/plain'));

				await moveTask(taskIdToMove, props.board.id);
				await revalidate(getBoards.key);
			}}
		>
			<div class="flex gap-1">
				<h3 class="text-center font-bold">{props.board.title}</h3>
				<span class="grow" />
				<form action={createTask} method="post">
					<input type="hidden" value={props.board.id} name="boardId" />
					<input type="hidden" value="Test Task" name="title" />
					<button class="flex items-center gap-1 rounded bg-neutral-700 px-4 py-2 text-sm font-semibold uppercase">
						<span class="i-heroicons:document-plus"></span>
						<span>Create Task</span>
					</button>
				</form>
				<form action={deleteBoard} method="post">
					<input type="hidden" name="id" value={props.board.id} />
					<button class="flex items-center gap-1 rounded bg-red-800 px-4 py-2 text-sm font-semibold uppercase">
						<span class="i-heroicons:trash"></span>
						<span>Delete</span>
					</button>
				</form>
			</div>
			<For each={tasks()}>{(task) => <Task task={task} boardId={props.board.id} />}</For>
		</div>
	);
};
