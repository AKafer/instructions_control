import React, { useState, useEffect } from 'react';
import styles from './PersonalUsers.module.css';
import UniversalTable from '../../../UTable/UTable';
import useFillSelect from '../../../../hooks/useFillSelect.hook';
import { getAllDivisionsUrl, getAllProfessionsUrl, getAllUsersPaginatedUrl } from '../../../../helpers/constants';
import { SelectMultiCheckboxSimple } from '../../../SelectMultiCheckboxSimple/SelectMultiCheckboxSimple';
import Button from '../../../Button/Button';
import {serializeFilters} from '../../../../helpers/SerializerFilters';
import useApi from '../../../../hooks/useApi.hook';


export default function PersonalUsers({ selectedUsers, setSelectedUsers }) {
	const api = useApi();

	const [selectedProfOption, setSelectedProfOption] = useState([]);
	const [selectedDivOption, setSelectedDivOption] = useState([]);
	const [filters, setFilters] = useState({});
	const [allUserIds, setAllUserIds] = useState([]);
	const [refreshKey, setRefreshKey] = useState(0);

	const {
		error: errorProf,
		options: optionsProf,
		itemDict: professionDict,
		getItems: getProfessions
	} = useFillSelect({
		endpoint: getAllProfessionsUrl,
		labelField: 'title'
	});
	const {
		error: errorDiv,
		options: optionsDiv,
		itemDict: divisionDict,
		getItems: getDivisions
	} = useFillSelect({
		endpoint: getAllDivisionsUrl,
		labelField: 'title'
	});

	async function fetchAllUserIds(filters) {
		try {
			const query = serializeFilters(filters);
			const { data } = await api.get(`/users/user_uuids?${query}`);
			return Array.isArray(data) ? data : data?.results || [];
		} catch (e) {
			console.error('Ошибка при получении всех ID пользователей', e);
			return [];
		}
	}

	const applyFilters = async () => {
		const newFilters = {};

		if (selectedProfOption && selectedProfOption.length) {
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
		setFilters({ ...newFilters });
		setSelectedUsers([]);

		const ids = await fetchAllUserIds(newFilters);
		setAllUserIds(ids);
	};

	const clearFilters = () => {
		setSelectedProfOption([]);
		setSelectedDivOption([]);
		setFilters({});
		setSelectedUsers([]);
	};

	const columns = [
		{
			title: 'Фамилия',
			dataIndex: 'last_name',
			key: 'last_name',
			sorter: (a, b) => a.last_name.localeCompare(b.last_name)
		},
		{ title: 'Имя', dataIndex: 'name', key: 'name' },
		{ title: 'Отчество', dataIndex: 'father_name', key: 'father_name' },
		{
			title: 'Профессия',
			dataIndex: 'profession_id',
			key: 'profession_id',
			sorter: (a, b) => {
				const nameA = professionDict[a.profession_id]?.['title'] || '';
				const nameB = professionDict[b.profession_id]?.['title'] || '';
				return nameA.localeCompare(nameB);
			},
			render: (profession_id) => professionDict[profession_id]?.['title'] ?? '—'
		},
		{
			title: 'Подразделение',
			dataIndex: 'division_id',
			key: 'division_id',
			sorter: (a, b) => {
				const nameA = divisionDict[a.division_id]?.['title'] || '';
				const nameB = divisionDict[b.division_id]?.['title'] || '';
				return nameA.localeCompare(nameB);
			},
			render: (division_id) => divisionDict[division_id]?.['title'] ?? '—'
		}
	];

	const endpointWithQuery = Object.keys(filters || {}).length
		? `${getAllUsersPaginatedUrl}?${serializeFilters(filters)}`
		: getAllUsersPaginatedUrl;


	const normalize = id => (id === undefined || id === null) ? id : String(id);
	const getSelectedNormalized = () => Array.isArray(selectedUsers) ? selectedUsers.map(normalize) : [];

	const addIds = (ids) => {
		console.log('[addIds] incoming ids:', ids);
		setSelectedUsers(prev => {
			const prevArr = Array.isArray(prev) ? prev.map(normalize) : [];
			console.log('[addIds] before prev normalized:', prevArr);
			const set = new Set(prevArr);
			ids.forEach(id => {
				const n = normalize(id);
				if (n !== undefined && n !== null) set.add(n);
			});
			const result = Array.from(set);
			console.log('[addIds] result selectedUsers:', result);
			return result;
		});
	};

	const removeIds = (ids) => {
		console.log('[removeIds] incoming ids:', ids);
		setSelectedUsers(prev => {
			const prevArr = Array.isArray(prev) ? prev.map(normalize) : [];
			console.log('[removeIds] before prev normalized:', prevArr);
			const set = new Set(prevArr);
			ids.forEach(id => {
				const n = normalize(id);
				set.delete(n);
			});
			const result = Array.from(set);
			console.log('[removeIds] result selectedUsers:', result);
			return result;
		});
	};

	const rowSelection = {
		selectedRowKeys: getSelectedNormalized(),

		onSelect: (record, selected) => {
			const id = record.id ?? record.key;
			console.log('[onSelect] record.id:', id, 'selected:', selected);
			if (selected) addIds([id]);
			else removeIds([id]);
		},

		onSelectAll: (selected, selectedRows, changeRows) => {
			const rows = (changeRows && changeRows.length) ? changeRows : (selectedRows || []);
			const ids = rows.map(r => r.id ?? r.key);
			console.log('[onSelectAll] selected:', selected, 'ids:', ids);
			if (selected) addIds(ids);
			else removeIds(ids);
		}
	};

	const toggleSelectAllMatching = () => {
		console.log('[toggleSelectAllMatching] allUserIds:', allUserIds, 'selectedUsers:', selectedUsers);
		const normalizedAll = Array.isArray(allUserIds) ? allUserIds.map(normalize) : [];
		const normalizedSelected = getSelectedNormalized();
		const allSelected = normalizedAll.length > 0 && normalizedAll.every(id => normalizedSelected.includes(id));

		console.log('[toggleSelectAllMatching] normalizedAll:', normalizedAll, 'normalizedSelected:', normalizedSelected, 'allSelected:', allSelected);

		if (allSelected) {
			removeIds(allUserIds);
		} else {
			addIds(allUserIds);
		}
	};

	return (
		<div className={styles.usersBox}>
			<div className={styles.filtersTable}>
				<label>Профессии</label>
				<SelectMultiCheckboxSimple
					options={optionsProf}
					value={selectedProfOption}
					onChange={setSelectedProfOption}
					placeholder="Фильтр по профессии"
				/>
				<label>Подразделения</label>
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
			</div>

			<div className={styles.labelCount}>
				<label className={styles.selectAllCheckbox}>
					<input
						type="checkbox"
						checked={allUserIds.length > 0 && allUserIds.every(id => getSelectedNormalized().includes(normalize(id)))}
						onChange={toggleSelectAllMatching}
					/>
					{allUserIds.length > 0 && allUserIds.every(id => getSelectedNormalized().includes(normalize(id)))
						? 'Снять все'
						: 'Выделить все'}
				</label>

				<span>
    Всего: {allUserIds.length} Выбрано: {getSelectedNormalized().length}
				</span>
			</div>
			<UniversalTable
				endpoint={endpointWithQuery}
				columns={columns}
				usePagination={true}
				initialPage={1}
				initialPageSize={10}
				refreshKey={refreshKey}
				tableProps={{rowSelection}}
			/>
		</div>
	);
}
