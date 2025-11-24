import React, { useState, useEffect } from 'react';
import styles from './PersonalUsers.module.css';
import UniversalTable from '../../../UTable/UTable';
import useFillSelect from '../../../../hooks/useFillSelect.hook';
import { getAllDivisionsUrl, getAllProfessionsUrl, getAllUsersPaginatedUrl } from '../../../../helpers/constants';
import { SelectMultiCheckboxSimple } from '../../../SelectMultiCheckboxSimple/SelectMultiCheckboxSimple';
import Button from '../../../Button/Button';
import {serializeFilters} from '../../../../helpers/SerializerFilters';


export default function PersonalUsers({ selectedUsers, setSelectedUsers }) {
	const { options: optionsProf } = useFillSelect({ endpoint: getAllProfessionsUrl, labelField: 'title' });
	const { options: optionsDiv } = useFillSelect({ endpoint: getAllDivisionsUrl, labelField: 'title' });

	const [selectedProfOption, setSelectedProfOption] = useState([]);
	const [selectedDivOption, setSelectedDivOption] = useState([]);
	const [filters, setFilters] = useState({});
	const [allUserIds, setAllUserIds] = useState([]);

	const applyFilters = () => {
		const newFilters = {};

		if (selectedProfOption && selectedProfOption.length) {
			// Если в селекте у тебя объекты { label, value }, возьми value; если у тебя уже простые значения — подстраивается
			const profIds = selectedProfOption
				.map(o => (typeof o === 'object' ? o.value : o))
				.filter(v => v !== undefined && v !== null && v !== '');
			if (profIds.length && (!optionsProf || profIds.length !== optionsProf.length)) {
				newFilters.profession_id__in = profIds;
			}
		}

		if (selectedDivOption && selectedDivOption.length) {
			const divIds = selectedDivOption
				.map(o => (typeof o === 'object' ? o.value : o))
				.filter(v => v !== undefined && v !== null && v !== '');
			if (divIds.length && (!optionsDiv || divIds.length !== optionsDiv.length)) {
				newFilters.division_id__in = divIds;
			}
		}

		// важный момент — сохраняем новый объект, чтобы React увидел изменение
		setFilters({ ...newFilters });
	};



	const clearFilters = () => {
		setSelectedProfOption([]);
		setSelectedDivOption([]);
		setFilters({});
		setSelectedUsers([]);
	};

	const columns = [
		{ title: 'Фамилия', dataIndex: 'last_name', key: 'last_name' },
		{ title: 'Имя', dataIndex: 'name', key: 'name' },
		{ title: 'Отчество', dataIndex: 'father_name', key: 'father_name' },
		{ title: 'Профессия', dataIndex: 'profession_title', key: 'profession_title' },
		{ title: 'Подразделение', dataIndex: 'division_title', key: 'division_title' },
		{
			title: 'Включить',
			dataIndex: 'checked',
			key: 'checked',
			render: (_, record) => (
				<input
					type="checkbox"
					checked={selectedUsers.includes(record.id)}
					onChange={(e) => {
						const checked = e.target.checked;
						setSelectedUsers(prev => {
							if (checked) return [...prev, record.id];
							return prev.filter(id => id !== record.id);
						});
					}}
				/>
			)
		}
	];

	const endpointWithQuery = Object.keys(filters || {}).length
		? `${getAllUsersPaginatedUrl}?${serializeFilters(filters)}`
		: getAllUsersPaginatedUrl;

	return (
		<div className={styles.usersBox}>
			<div className={styles.filtersTable}>
				<SelectMultiCheckboxSimple
					options={optionsProf}
					value={selectedProfOption}
					onChange={setSelectedProfOption}
					placeholder="Фильтр по профессии"
				/>
				<SelectMultiCheckboxSimple
					options={optionsDiv}
					value={selectedDivOption}
					onChange={setSelectedDivOption}
					placeholder="Фильтр по подразделению"
				/>
				<Button className={styles.filterButton} onClick={applyFilters}>Применить фильтры</Button>
				<button className={styles.filterButton} onClick={clearFilters}>
					<img src="/icons/drop-filters-icon.svg" alt="drop-filters" />
				</button>

				<label className={styles.selectAll}>
					<input
						type="checkbox"
						checked={selectedUsers.length === allUserIds.length && allUserIds.length > 0}
						onChange={(e) => {
							if (e.target.checked) setSelectedUsers(allUserIds);
							else setSelectedUsers([]);
						}}
					/>
          Включить всех
				</label>
			</div>

			<UniversalTable
				endpoint={endpointWithQuery}
				columns={columns}
				tableProps={{
					onChange: (pagination, filter, sorter, extra) => {
						const currentIds = extra.currentData?.map(u => u.id) || [];
						setAllUserIds(currentIds);
						if (selectedUsers.length === 0) setSelectedUsers(currentIds); // отмечаем всех по умолчанию
					}
				}}
			/>
		</div>
	);
}
