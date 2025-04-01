import React from 'react';
import styles from './Button.module.css';

const Button = ({
	children,
	onClick,
	disabled
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
			className={styles['button']}
			disabled={disabled}
			onClick={handleClick}
		>
			{children}
		</button>
	);
};

export default Button;
