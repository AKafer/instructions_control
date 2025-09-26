import React from 'react';
import styles from './Textarea.module.css';
import cn from 'classnames';


export function Textarea({
	text,
	setText,
	placeholder,
	disabled,
	className,
	...rest
}) {
	return (
		<textarea
			value={text ?? ''}
			placeholder={placeholder}
			onChange={(e) => setText?.(e.target.value)}
			disabled={disabled}
			className={cn(styles.base, className)}
			{...rest}
		/>
	);
}
