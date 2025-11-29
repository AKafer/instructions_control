import React, { useRef } from 'react';
import styles from './KeyValueItem.module.css';
import Input from '../../../Input/Input';

export default function KeyValueItem({ row, onEdit, onRemove }) {
	const inputRef = useRef(null);

	const handleFocus = (e) => {
		// Если ключ пустой или равен '{{}}', ставим курсор внутрь
		if (row.key === '{{}}' && inputRef.current) {
			const pos = 2; // после {{
			inputRef.current.setSelectionRange(pos, pos);
		}
	};

	return (
		<div className={styles.kvRow}>
			<Input
				ref={inputRef}
				className={styles.kvKey}
				placeholder="{{ключ}}"
				value={row.key}
				onChange={(e) => onEdit && onEdit(row.id, { key: e.target.value })}
				onFocus={handleFocus}
			/>
			<Input
				className={styles.kvValue}
				placeholder="значение"
				value={row.value}
				onChange={(e) => onEdit && onEdit(row.id, { value: e.target.value })}
			/>

			<button
				type="button"
				className={styles.removeBtn}
				onClick={() => onRemove && onRemove(row.id)}
				aria-label="Удалить"
			>
        ×
			</button>
		</div>
	);
}
