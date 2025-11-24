// SelectMultiCheckboxSimple.jsx
import React from 'react';
import styles from './SelectMultiCheckboxSimple.module.css';

export function SelectMultiCheckboxSimple({ options, value, onChange, placeholder }) {
	const toggleItem = (item) => {
		if (value.includes(item.value)) {
			onChange(value.filter(v => v !== item.value));
		} else {
			onChange([...value, item.value]);
		}
	};

	const toggleAll = () => {
		if (value.length === options.length) onChange([]);
		else onChange(options.map(o => o.value));
	};

	return (
		<div className={styles.selectBox}>
			<div className={styles.option} onClick={toggleAll}>
				<input
					type="checkbox"
					checked={value.length === options.length && options.length > 0}
					readOnly
				/>
				<span>Выбрать все</span>
			</div>
			{options.map(option => (
				<div key={option.value} className={styles.option} onClick={() => toggleItem(option)}>
					<input
						type="checkbox"
						checked={value.includes(option.value)}
						readOnly
					/>
					<span>{option.label}</span>
				</div>
			))}
		</div>
	);
}
