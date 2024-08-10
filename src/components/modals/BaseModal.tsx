import { JSXElement, createEffect, createSignal, createUniqueId } from 'solid-js';
import { Portal } from 'solid-js/web';

type Props =
	| {
			title: string;
			children: (close: () => void) => JSXElement;
			trigger: JSXElement;
	  }
	| {
			title: string;
			children: (close: () => void) => JSXElement;
			trigger?: JSXElement;
			open: boolean;
			setOpen: (open: boolean) => void;
	  };

export function Modal(props: Props) {
	const [internalOpen, setInternalOpen] = createSignal(false);

	const [el, setEl] = createSignal<HTMLDialogElement>();

	const id = createUniqueId();

	const open = () => ('open' in props ? props.open : internalOpen());
	const setOpen = (value: boolean) =>
		'open' in props ? props.setOpen(value) : setInternalOpen(value);

	createEffect(() => {
		if (open()) el()?.showModal();
		else el()?.close();
	});

	return (
		<>
			<button popovertarget={id} data-debug={props.title}>
				{props.trigger}
			</button>
			<Portal>
				<dialog
					id={id}
					ref={setEl}
					popover
					onClick={(event) => {
						const target = event.target as HTMLDialogElement;
						target !== el();
						if (target === el()) el()?.close();
					}}
					onClose={() => setOpen(false)}
					class="min-w-80 rounded-lg border bg-background p-4"
				>
					<h4 class="mb-2 text-lg font-medium">{props.title}</h4>
					<div>{props.children(() => el()?.close())}</div>
				</dialog>
			</Portal>
		</>
	);
}

export default Modal;
