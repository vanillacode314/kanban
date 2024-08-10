import { createAsync, useSubmissions } from '@solidjs/router';
import { For } from 'solid-js';
import Board from '~/components/Board';
import BaseModal from '~/components/modals/BaseModal';
import { Button } from '~/components/ui/button';
import { TextField, TextFieldInput, TextFieldLabel } from '~/components/ui/text-field';
import { createBoard, getBoards } from '~/db/utils/boards';

export const route = {
	preload: () => getBoards()
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
			<div class="flex justify-end gap-4">
				<BaseModal
					title="Create Board"
					trigger={
						<Button class="flex items-center gap-2" as="div">
							<span class="i-heroicons:plus text-lg"></span>
							<span>Create Board</span>
						</Button>
					}
				>
					{(close) => (
						<form
							action={createBoard}
							method="post"
							class="flex flex-col gap-4"
							onSubmit={() => close()}
						>
							<TextField class="grid w-full items-center gap-1.5">
								<TextFieldLabel for="title">Title</TextFieldLabel>
								<TextFieldInput type="text" id="title" name="title" placeholder="Title" />
							</TextField>
							<Button type="submit" class="self-end">
								Submit
							</Button>
						</form>
					)}
				</BaseModal>
			</div>
			<div class="grid h-full grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4">
				<For each={boards()}>{(board) => <Board board={board} />}</For>
			</div>
		</div>
	);
}
