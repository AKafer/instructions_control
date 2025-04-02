import React from 'react';
import styles from './Button.module.css';
import cn from 'classnames';

const Button = ({
	children,
	onClick,
	disabled,
	className
}) => {
	const handleClick = (e) => {
		if (disabled) {
			e.preventDefault();
			return;
		}

		if (onClick) {
			onClick();
		}
	};

	return (
		<button
			className={cn(styles.button, className)}
			disabled={disabled}
			onClick={handleClick}
		>
			{children}
		</button>
	);
};

export default Button;
