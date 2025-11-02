import styles from './SIZ.module.css';
import Button from '../../../components/Button/Button';
import {Modal} from '../../../components/Modals/Modal';
import {useEffect, useState} from 'react';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {
	getAllDivisionsUrl,
	getAllMaterialsPaginatedUrl,
	getAllMaterialTypesUrl,
	getAllNormsUrl,
	getAllProfessionsUrl,
	getAllUsersUrl
} from '../../../helpers/constants';
import {ManageTypes} from '../../../components/Modals/ManageTypes/ManageTypes';
import {ManageNorms} from '../../../components/Modals/ManageNorms/ManageNorms';
import {NormStatistics} from '../../../components/Modals/NormStatistics/NormStatistics';
import UniversalTable from '../../../components/UTable/UTable';
import Input from '../../../components/Input/Input';
import {CustomSelect} from '../../../components/Select/Select';
import {DeleteSIZ} from '../../../components/Modals/DeleteSIZ/DeleteSIZ';
import {CreateSIZ} from '../../../components/Modals/CreateSIZ/CreateSIZ';


export function SIZ () {
	const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
	const [isManageNormsOpen, setIsManageNormsOpen] = useState(false);
	const [isNormStatisticsOpen, setIsNormStatisticsOpen] = useState(false);
	const [totalRecords, setTotalRecords] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0);
	const [lastNameFilter, setLastNameFilter] = useState(undefined);
	const [selectedProfOption, setSelectedProfOption] = useState(null);
	const [selectedDivOption, setSelectedDivOption] = useState(null);
	const [selectedSIZ, setSelectedSIZ] = useState(null);
	const [isCreateModalOpen, setCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

	const {
		error: errorTypes,
		options: optionsTypes,
		itemDict: typesDict,
		getItems: getTypes
	} = useFillSelect({
		endpoint: getAllMaterialTypesUrl,
		labelField: 'title'
	});

	const {
		error: errorNorms,
		options: optionsNorms,
		itemDict: normsDict,
		getItems: getNorms
	} = useFillSelect({
		endpoint: getAllNormsUrl,
		labelField: 'title'
	});

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

	const {
		error: errorUser,
		options: optionsUser,
		itemDict: userDict,
		getItems: getUsers
	} = useFillSelect({
		endpoint: `${getAllUsersUrl}/`,
		labelBuilder: (u) => {
			return [u.last_name, u.name, u.father_name].filter(Boolean).join(' ');
		}
	});

	const openModalTypes = () => {
		setIsManageTypesOpen(true);
	};

	const openModalNorms = () => {
		setIsManageNormsOpen(true);
	};

	const openModalStatistics = () => {
		setIsNormStatisticsOpen(true);
	};

	const toKey = (v) => (v === null || v === undefined || v === '' ? null : String(v));
	const normalizeForEditor = (r) => ({
		...r,
		user_id: toKey(r.user_id ?? r.user?.id),
		material_type_id: toKey(r.material_type_id ?? r.material_type?.id)
	});
	const columns = [
		{
			title: 'Тип материала',
			dataIndex: ['material_type', 'title'],
			key: 'material_type',
			render: (title) => title ?? '—',
			sorter: (a, b) => (a.material_type?.title || '').localeCompare(b.material_type?.title || '', 'ru')
		},
		{
			title: 'Работник',
			dataIndex: 'user',
			key: 'user',
			render: (user) =>
				user ? [user.last_name, user.name, user.father_name].filter(Boolean).join(' ') : '—',
			sorter: (a, b) => {
				const an = [a.user?.last_name, a.user?.name, a.user?.father_name].filter(Boolean).join(' ');
				const bn = [b.user?.last_name, b.user?.name, b.user?.father_name].filter(Boolean).join(' ');
				return an.localeCompare(bn, 'ru');
			}
		},
		{
			title: 'Подразделение',
			dataIndex: ['user', 'division', 'title'],
			key: 'division',
			render: (title) => title ?? '—',
			sorter: (a, b) => (a.user?.division?.title || '').localeCompare(b.user?.division?.title || '', 'ru')
		},
		{
			title: 'Профессия',
			key: 'profession',
			dataIndex: ['user', 'profession', 'title'],   
			render: (text, record) =>
				(text ?? record.user?.profession?.title ?? '—')?.trim(),
			sorter: (a, b) =>
				((a.user?.profession?.title ?? '').trim())
					.localeCompare((b.user?.profession?.title ?? '').trim(), 'ru')
		},
		{
			title: 'Сертификат',
			key: 'sertificate',
			dataIndex: 'sertificate',
			render: (sertificate) => sertificate ?? '—',
			align: 'center'
		},
		{
			title: 'Номер документа',
			dataIndex: 'number_of_document',
			key: 'number_of_document',
			render: (number_of_document) => number_of_document ?? '—',
			align: 'center'
		},
		{
			title: 'Дата выдачи',
			dataIndex: 'start_date',
			key: 'start_date',
			render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—',
			sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
			align: 'center'
		},
		{
			title: 'Дата окончания',
			dataIndex: 'end_date',
			key: 'end_date',
			render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—',
			sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date),
			align: 'center'
		},
		{
			title: 'Контроль через (дней)',
			dataIndex: 'term_to_control',
			key: 'term_to_control',
			render: (term_to_control) => term_to_control ?? '—',
			sorter: (a, b) => (a.term_to_control || 0) - (b.term_to_control || 0),
			align: 'center'
		},
		{
			title: 'Количество',
			dataIndex: 'quantity',
			key: 'quantity',
			render: (quantity) => quantity ?? '—',
			sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
			align: 'center'
		},
		{
			title: 'Изменить',
			key: 'edit',
			align: 'center',
			render: (_, record) => (
				<button
					className={styles.iconButton}
					onClick={() => {
						setSelectedSIZ(normalizeForEditor(record));
						setCreateModalOpen(true);
					}}
				>
					<img className={styles.iconImage} src="/icons/edit-icon.svg" alt="edit" />
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
						setSelectedSIZ(record);
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
			user__last_name__ilike: `%${debouncedLastName}%`
		};
	}
	if (selectedProfOption) {
		filters = {
			...filters,
			user__profession_id__in: selectedProfOption.value
		};
	}
	if (selectedDivOption) {
		filters = {
			...filters,
			user__division_id__in: selectedDivOption.value
		};
	}

	const ClearFilters = () => {
		setSelectedProfOption(null);
		setSelectedDivOption(null);
		setLastNameFilter('');
	};

	const openCreateModal = () => {
		setSelectedSIZ(null);
		setCreateModalOpen(true);
	};

	return (
		<div className={styles.siz}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
					<Button onClick={openCreateModal}>
					Выдать СИЗ
					</Button>
					<Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
						<CreateSIZ
							optionsUser={optionsUser}
							userDict={userDict}
							optionsTypes={optionsTypes}
							typesDict={typesDict}
							setCreateModalOpen={setCreateModalOpen}
							setRefreshKey={setRefreshKey}
							currentSIZ={selectedSIZ}
						/>
					</Modal>
					<Button onClick={openModalTypes}>
					Типы материалов
					</Button>
					<Modal isOpen={isManageTypesOpen} onClose={() => setIsManageTypesOpen(false)}>
						<ManageTypes
							optionsTypes={optionsTypes}
							typesDict={typesDict}
							getTypes={getTypes}
						/>
					</Modal>
					<Button onClick={openModalNorms}>
					Нормы
					</Button>
					<Modal isOpen={isManageNormsOpen} onClose={() => setIsManageNormsOpen(false)}>
						<ManageNorms
							optionsNorms={optionsNorms}
							normsDict={normsDict}
							optionsTypes={optionsTypes}
							getNorms={getNorms}
						/>
					</Modal>
					<Button onClick={openModalStatistics}>
					Статистика
					</Button>
					<Modal isOpen={isNormStatisticsOpen} onClose={() => setIsNormStatisticsOpen(false)}>
						<NormStatistics
						/>
					</Modal>
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
						endpoint={getAllMaterialsPaginatedUrl}
						columns={columns}
						usePagination={true}
						initialPage={1}
						initialPageSize={20}
						filters={filters}
						onTotalRecordsChange={setTotalRecords}
						refreshKey={refreshKey}
					/>
				</div>
			</div>
			<Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
				<DeleteSIZ
					SIZ={selectedSIZ}
					setDeleteModalOpen={setDeleteModalOpen}
					setRefreshKey={setRefreshKey}
				/>
			</Modal>
		</div>
	);
}