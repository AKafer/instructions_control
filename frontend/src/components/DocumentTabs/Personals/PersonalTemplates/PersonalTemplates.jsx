import React, { useState, useMemo } from 'react';
import styles from './PersonalTemplates.module.css';
import {TEMPLATES_GROUPED} from '../../../../helpers/constants';
import {CustomSelect} from '../../../Select/Select';
import KeyValueItem from '../../components/KeyValueItem/KeyValueItem';

function makeRow(key = '{{}}') {
	return {
 		id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
 		key,
		value: ''
	};
}

export default function PersonalTemplates({ selectedTemplate, setSelectedTemplate, placeholders, setPlaceholders }) {
	const personalGroup = useMemo(
		() => TEMPLATES_GROUPED.find((g) => g.group === 'Персональные'),
		[]
	);

	const options = useMemo(() => {
		if (!personalGroup) return [];
		return personalGroup.templates.map((t) => ({ label: t.name, value: t.template }));
	}, [personalGroup]);

	const handleSectionChange = (optionOrValue) => {
		const value = typeof optionOrValue === 'string' ? optionOrValue : optionOrValue?.value;
		if (!value) {
			setSelectedTemplate('');
			setPlaceholders([]);
			return;
		}

		const found = personalGroup.templates.find((t) => t.template === value);
		setSelectedTemplate(value);
		setPlaceholders((found?.placeholders || []).map((p) => makeRow(p)));
	};

	const handleAddRow = () => setPlaceholders((prev) => [...prev, makeRow('')]);
	const handleEditRow = (id, patch) => setPlaceholders((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
	const handleRemoveRow = (id) => setPlaceholders((prev) => prev.filter((r) => r.id !== id));

	return (
		<div className={styles.templatesBox}>
			<CustomSelect
				options={options}
				value={options.find((o) => o.value === selectedTemplate) || null}
				onChange={handleSectionChange}
				placeholder="Выберите шаблон"
				width="100%"
			/>
			{selectedTemplate && (
				<div className={styles.kvContainer}>
					{placeholders.map((row) => (
						<KeyValueItem
							key={row.id}
							row={row}
							onEdit={handleEditRow}
							onRemove={handleRemoveRow}
						/>
					))}
					<div className={styles.controlsRow}>
						<button type="button" className={styles.addBtn} onClick={handleAddRow}>
							<img src="/icons/plus-icon.svg" alt="add" className={styles.icon} /> Добавить строку
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
