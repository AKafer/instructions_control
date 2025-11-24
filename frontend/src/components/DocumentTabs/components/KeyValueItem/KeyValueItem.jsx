import React from 'react';
import styles from './KeyValueItem.module.css';
import Input from '../../../Input/Input';

export default function KeyValueItem({ row, onEdit, onRemove }) {
	return (
		<div className={styles.kvRow}>
			<Input
				className={styles.kvKey}
				placeholder="ключ (например {{дата документа}})"
				value={row.key}
				onChange={(e) => onEdit && onEdit(row.id, { key: e.target.value })}
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
