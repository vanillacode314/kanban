import { revalidate, useSubmissions } from '@solidjs/router';
import { Component, For, Show } from 'solid-js';
import { deleteBoard, getBoards, updateBoard } from '~/db/utils/boards';
import { createTask, moveTask } from '~/db/utils/tasks';
import BaseModal from './modals/BaseModal';
import Task from './Task';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TextField, TextFieldInput, TextFieldLabel } from './ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export const Board: Component<{ board: ReturnType<typeof getBoards> }> = (props) => {
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
		<Card
			class="flex flex-col gap-4 p-4"
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
			<div class="flex items-center gap-2">
				<h3 class="text-center font-bold">{props.board.title}</h3>
				<span class="grow" />
				<BaseModal
					title="Create Task"
					trigger={
						<Button class="flex items-center gap-2" as="div" title="Create Task" size="icon">
							<span class="i-heroicons:plus text-lg"></span>
						</Button>
					}
				>
					{(close) => (
						<form action={createTask} method="post" class="flex flex-col gap-4">
							<input type="hidden" name="boardId" value={props.board.id} />
							<TextField class="grid w-full items-center gap-1.5">
								<TextFieldLabel for="title">Title</TextFieldLabel>
								<TextFieldInput type="text" id="title" name="title" placeholder="Title" />
							</TextField>
							<Button type="submit" class="self-end" onClick={() => close()}>
								Submit
							</Button>
						</form>
					)}
				</BaseModal>
				<BaseModal
					title="Update Board"
					trigger={
						<Button
							as="div"
							variant="outline"
							class="flex items-center gap-2"
							title="Update Board"
							size="icon"
						>
							<span class="i-heroicons:pencil text-lg"></span>
						</Button>
					}
				>
					{(close) => (
						<form action={updateBoard} method="post" class="flex flex-col gap-4">
							<input type="hidden" name="id" value={props.board.id} />
							<TextField class="grid w-full items-center gap-1.5">
								<TextFieldLabel for="title">Title</TextFieldLabel>
								<TextFieldInput
									type="text"
									id="title"
									name="title"
									placeholder="Title"
									value={props.board.title}
								/>
							</TextField>
							<Button type="submit" class="self-end" onClick={() => close()}>
								Submit
							</Button>
						</form>
					)}
				</BaseModal>
				<form action={deleteBoard} method="post">
					<input type="hidden" name="id" value={props.board.id} />
					<Tooltip>
						<TooltipTrigger
							as={Button}
							variant="destructive"
							class="flex items-center gap-2"
							type="submit"
							size="icon"
						>
							<span class="i-heroicons:trash text-lg"></span>
						</TooltipTrigger>
						<TooltipContent>
							<span>Delete</span>
						</TooltipContent>
					</Tooltip>
				</form>
			</div>

			<div class="flex flex-col gap-2">
				<Show when={tasks().length > 0} fallback={<p>No tasks in this board</p>}>
					<For each={tasks()}>{(task) => <Task task={task} boardId={props.board.id} />}</For>
				</Show>
			</div>
		</Card>
	);
};

export default Board;
