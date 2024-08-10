import { Component } from 'solid-js';
import { TBoard, TTask } from '~/db/schema';
import { deleteTask, updateTask } from '~/db/utils/tasks';
import BaseModal from './modals/BaseModal';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TextField, TextFieldInput, TextFieldLabel } from './ui/text-field';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export const Task: Component<{ boardId: TBoard['id']; task: TTask }> = (props) => {
	return (
		<Card
			class="grid grid-rows-[auto_auto] gap-2 rounded p-4"
			draggable="true"
			onDragStart={(event) => {
				if (!event.dataTransfer) throw new Error('No data transfer');
				event.dataTransfer.setData('text/plain', String(props.task.id));
			}}
		>
			<span>{props.task.title}</span>
			<div class="flex flex-wrap items-center justify-end gap-2">
				<BaseModal
					title="Update Task"
					trigger={
						<Button
							as="div"
							variant="outline"
							class="flex items-center gap-2"
							title="Update"
							size="icon"
						>
							<span class="i-heroicons:pencil text-lg"></span>
						</Button>
					}
				>
					{(close) => (
						<form action={updateTask} method="post" class="flex flex-col gap-4">
							<input type="hidden" name="id" value={props.task.id} />
							<TextField class="grid w-full items-center gap-1.5">
								<TextFieldLabel for="title">Title</TextFieldLabel>
								<TextFieldInput
									type="text"
									id="title"
									name="title"
									placeholder="Title"
									value={props.task.title}
								/>
							</TextField>
							<Button type="submit" class="self-end" onClick={() => close()}>
								Submit
							</Button>
						</form>
					)}
				</BaseModal>
				<form action={deleteTask} method="post">
					<input type="hidden" value={props.task.id} name="id" />
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
		</Card>
	);
};

export default Task;
