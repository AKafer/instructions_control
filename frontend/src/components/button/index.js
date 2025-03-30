import React from 'react';
import cn from 'classnames';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';

const Button = ({
	children,
	modifier = 'style_light-blue',
	href,
	to,
	clickHandler,
	className,
	disabled,
	type = 'button'
}) => {
	const navigate = useNavigate();

	const handleClick = (e) => {
		if (disabled) {
			e.preventDefault();
			return;
		}

		if (to) {
			navigate(to);
		}

		if (clickHandler) {
			clickHandler();
		}
	};

	const classNames = cn(styles.button, className, {
		[styles[`button_${modifier}`]]: modifier,
		[styles.button_disabled]: disabled
	});

	if (href) {
		return (
			<a
				className={classNames}
				href={href}
				onClick={handleClick}
			>
				{children}
			</a>
		);
	}

	return (
		<button
			className={classNames}
			disabled={disabled}
			onClick={handleClick}
			type={type}
		>
			{children}
		</button>
	);
};

export default Button;
