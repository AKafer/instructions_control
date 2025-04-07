import styles from './Users.module.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import {CustomSelect} from '../../../components/Select/Select';
import {
	getAllDivisionsUrl,
	getAllProfessionsUrl,
	JWT_STORAGE_KEY,
	PREFIX
} from '../../../helpers/constants';
import {useEffect, useState} from 'react';
import UniversalTable from '../../../components/UTable/UTable';
import {Modal} from '../../../components/Modals/Modal';
import {EditUser} from '../../../components/Modals/EditUser/EditUser';
import {DeleteUser} from '../../../components/Modals/DeleteUser/DeleteUser';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {CreateUser} from '../../../components/Modals/CreateUser/CreateUser';


export function Users () {
	const [jwt, setJwt] = useState(localStorage.getItem(JWT_STORAGE_KEY));
	const [selectedProfOption, setSelectedProfOption] = useState(null);
	const [selectedDivOption, setSelectedDivOption] = useState(null);
	const [lastNameFilter, setLastNameFilter] = useState(undefined);
	const [isCreateModalOpen, setCreateModalOpen] = useState(false);
	const [isEditModalOpen, setEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [totalRecords, setTotalRecords] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0);

	const {
		error: errorProf,
		options: optionsProf,
		itemDict: professionDict
	} = useFillSelect({
		endpoint: getAllProfessionsUrl,
		labelField: 'title'
	});

	const {
		error: errorDiv,
		options: optionsDiv,
		itemDict: divisionDict
	} = useFillSelect({
		endpoint: getAllDivisionsUrl,
		labelField: 'title'
	});

	useEffect(() => {
		setJwt(localStorage.getItem(JWT_STORAGE_KEY));
	}, []);


	const ClearFilters = () => {
		setSelectedProfOption(null);
		setSelectedDivOption(null);
		setLastNameFilter('');
	};

	const columns = [
		{
			title: 'Фамилия',
			dataIndex: 'last_name',
			key: 'last_name',
			sorter: (a, b) => a.last_name.localeCompare(b.last_name)
		},
		{
			title: 'Имя',
			dataIndex: 'name',
			key: 'name',
			sorter: (a, b) => a.id.localeCompare(b.id)
		},
		{
			title: 'Отчество',
			dataIndex: 'father_name',
			key: 'father_name',
			sorter: (a, b) => a.id.localeCompare(b.id)
		},
		{
			title: 'Профессия',
			dataIndex: 'profession_id',
			key: 'profession_id',
			sorter: (a, b) => {
				const nameA = professionDict[a.profession_id] || '';
				const nameB = professionDict[b.profession_id] || '';
				return nameA.localeCompare(nameB);
			},
			render: (profession_id) => professionDict[profession_id] || '—'
		},
		{
			title: 'Подразделение',
			dataIndex: 'division_id',
			key: 'division_id',
			sorter: (a, b) => {
				const nameA = divisionDict[a.division_id] || '';
				const nameB = divisionDict[b.division_id] || '';
				return nameA.localeCompare(nameB);
			},
			render: (division_id) => divisionDict[division_id] || '—'
		},
		{
			title: 'Изменить',
			key: 'edit',
			align: 'center',
			render: (_, record) => (
				<button className={styles.iconButton}
					onClick={() => {
						setSelectedUser(record);
						setEditModalOpen(true);
					}}
				>
					<img
						className={styles.iconImage}
						src="/icons/edit-icon.svg"
						alt="edit"/>
				</button>
			)
		},
		{
			title: 'Удалить',
			key: 'delete',
			align: 'center',
			render: (_, record) => (
				<button className={styles.iconButton}
					onClick={() => {
						setSelectedUser(record);
						setDeleteModalOpen(true);
					}}
				>
					<img
						className={styles.iconImage}
						src="/icons/delete-icon.svg"
						alt="delete"/>
				</button>
			)
		}

	];

	const [debouncedLastName, setDebouncedLastName] = useState(lastNameFilter);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedLastName(lastNameFilter);
		}, 500);

		return () => clearTimeout(timer);
	}, [lastNameFilter]);


	let filters = {};
	if (lastNameFilter) {
		filters = {
			...filters,
			last_name__ilike: `%${debouncedLastName}%`
		};
	}
	if (selectedProfOption) {
		filters = {
			...filters,
			profession_id__in: selectedProfOption.value
		};
	}
	if (selectedDivOption) {
		filters = {
			...filters,
			division_id__in: selectedDivOption.value
		};
	}

	return (
		<div className={styles.users}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
					<Button onClick={() => setCreateModalOpen(true)}>
					Добавить сотрудника
					</Button>
					<Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
						<CreateUser
							optionsProf={optionsProf}
							optionsDiv={optionsDiv}
							setCreateModalOpen={setCreateModalOpen}
							setRefreshKey={setRefreshKey}
							setLastNameFilter={setLastNameFilter}
						/>
					</Modal>
					<Button>
					Добавить подразделение
					</Button>
					<Button>
					Удалить подразделение
					</Button>
					<Button>
					Добавить профессию
					</Button>
					<Button>
					Удалить профессию
					</Button>
				</div>
			</div>

			<div className={styles.outer_table}>
				{(errorDiv || errorProf) && <div className={styles.error}>
					{errorDiv ? errorDiv : ''}--{errorProf ? errorProf : ''}
				</div>}
				<div className={styles.filters_table}>
					<Input
						value={lastNameFilter}
						 onChange={(e) => setLastNameFilter(e.target.value)}
						placeholder="Поиск по фамилии"
					/>
					<CustomSelect
						value={selectedProfOption}
						options={optionsProf}
						placeholder="Фильтр по профессии"
						onChange={setSelectedProfOption}
					>
					</CustomSelect>
					<CustomSelect
						value={selectedDivOption}
						options={optionsDiv}
						placeholder="Фильтр по подразделению"
						onChange={setSelectedDivOption}
					>
					</CustomSelect>
					<buton className={styles.filter_button} onClick={ClearFilters}>
						<img  src="/icons/drop-filters-icon.svg" alt="drop-filters"/>
					</buton>
				</div>
				<div className={styles.table_count}>
					Количество записей: {totalRecords}
				</div>
				<div className={styles.table}>
					<UniversalTable
						endpoint={`${PREFIX}/api/v1/users/paginated`}
						columns={columns}
						usePagination={true}
						initialPage={1}
						initialPageSize={10}
						axiosOptions={{
							headers: {
								'Authorization': `Bearer ${jwt}`,
								'Content-Type': 'application/x-www-form-urlencoded'
							}
						}}
						filters={filters}
						onTotalRecordsChange={setTotalRecords}
						refreshKey={refreshKey}
					/>
				</div>
			</div>
			<Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
				<EditUser user={selectedUser} />
			</Modal>
			<Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
				<DeleteUser
					user={selectedUser}
					setDeleteModalOpen={setDeleteModalOpen}
					setRefreshKey={setRefreshKey}
					setLastNameFilter={setLastNameFilter}
				/>
			</Modal>
		</div>
	);
}