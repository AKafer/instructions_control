import styles from './Education.module.css';
import Button from '../../../components/Button/Button';
import {Modal} from '../../../components/Modals/Modal';
import Input from '../../../components/Input/Input';
import {CustomSelect} from '../../../components/Select/Select';
import UniversalTable from '../../../components/UTable/UTable';
import {
	getAllDivisionsUrl, getAllHistoriesPaginatedUrl,
	getAllInstructionsUrl,
	getAllProfessionsUrl,
	getAllTestsUrl
} from '../../../helpers/constants';
import {useEffect, useState} from 'react';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {CreateQuestionsByAI} from '../../../components/Modals/CreateQuestionsByAI/CreateQuestionsByAI';
import {ManageTests} from '../../../components/Modals/ManageTests/ManageTests';


export function Education () {
	const YES = 'Да';
	const NO = 'Нет';
	const UNKNOWN = '—';

	const [totalRecords, setTotalRecords] = useState(0);
	const [isQAIModalOpen, setIsQAIModalOpen] = useState(false);
	const [isManageTestsOpen, setIsManageTestsOpen] = useState(false);
	const [lastNameFilter, setLastNameFilter] = useState(undefined);
	const [selectedProfOption, setSelectedProfOption] = useState(null);
	const [selectedDivOption, setSelectedDivOption] = useState(null);
	const [selectedInsOption, setSelectedInsOption] = useState(null);
	const [selectedTestOption, setSelectedTestOption] = useState(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const {
		error: errorTests,
		options: optionsTests,
		itemDict: testsDict,
		getItems: getTests
	} = useFillSelect({
		endpoint: getAllTestsUrl,
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
		error: errorIns,
		options: optionsIns,
		itemDict: instructionDict,
		getItems: getInstructions
	} = useFillSelect({
		endpoint: getAllInstructionsUrl,
		labelField: 'title'
	});

	const openQAIModal = () => {
		setIsQAIModalOpen(true);
	};

	const openManageTestsModal = () => {
		getTests();
		setIsManageTestsOpen(true);
	};

	const passedToStatus = (passed) => {
		if (passed === true) return { text: YES, value: 1, color: '#52c41a' };
		if (passed === false) return { text: NO, value: 0, color: '#ff4d4f' };
		return { text: UNKNOWN, value: -1, color: '#8c8c8c' };
	};

	const columns = [
		{
			title: 'Работник',
			dataIndex: 'user',
			key: 'user',
			render: (user) =>
				user ? [user.last_name, user.name].filter(Boolean).join(' ') : '—',
			sorter: (a, b) => {
				const an = [a.user?.last_name, a.user?.name].filter(Boolean).join(' ');
				const bn = [b.user?.last_name, b.user?.name].filter(Boolean).join(' ');
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
			title: 'Инструкция',
			key: 'instruction',
			dataIndex: ['instruction', 'title'],
			render: (title) => title ?? '—',
			sorter: (a, b) => (a.instruction?.title || '').localeCompare(b.instruction?.title || '', 'ru')
		},
		{
			title: 'Тест',
			key: 'test',
			dataIndex: ['test', 'title'],
			render: (title) => title ?? '—',
			sorter: (a, b) => (a.test?.title || '').localeCompare(b.test?.title || '', 'ru')
		},
		{
			title: 'Дата',
			dataIndex: 'date',
			key: 'date',
			render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—',
			sorter: (a, b) => new Date(a.date) - new Date(b.date),
			align: 'center'
		},
		{
			title: 'Пройден',
			key: 'passed',
			dataIndex: ['additional_data', 'passed'],
			render: (passed) => {
				const { text, color } = passedToStatus(passed);
				return <span style={{ color, fontWeight: 600 }}>{text}</span>;
			},
			sorter: (a, b) => {
				const va = passedToStatus(a.additional_data?.passed).value;
				const vb = passedToStatus(b.additional_data?.passed).value;
				return vb - va;
			},
			align: 'center',
			width: 120
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
	if (selectedInsOption) {
		filters = {
			...filters,
			instruction_id__in: selectedInsOption.value
		};
	}
	if (selectedTestOption) {
		filters = {
			...filters,
			test_id__in: selectedTestOption.value
		};
	}

	const ClearFilters = () => {
		setSelectedProfOption(null);
		setSelectedDivOption(null);
		setLastNameFilter('');
		setSelectedInsOption(null);
		setSelectedTestOption(null);
	};

	return (
		<div className={styles.siz}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
					<Button onClick={openManageTestsModal}>
					Тесты
					</Button>
					<Modal isOpen={isManageTestsOpen} onClose={() => setIsManageTestsOpen(false)}>
						<ManageTests
							optionsTests={optionsTests}
							getTests={getTests}
						/>
					</Modal>
					<Button onClick={openQAIModal}>
					Вопросы от AI
					</Button>
					<Modal isOpen={isQAIModalOpen} onClose={() => setIsQAIModalOpen(false)}>
						<CreateQuestionsByAI
							optionsTests={optionsTests}
							testsDict={testsDict}
							setCreateModalOpen={setIsQAIModalOpen}
						/>
					</Modal>
				</div>
			</div>

			<div className={styles.outer_table}>
				{(errorTests || errorDiv || errorProf) && <div className={styles.error}>
					{errorTests ? errorTests : ''}--{errorDiv ? errorDiv : ''}--{errorProf ? errorProf : ''}
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
					<CustomSelect
						value={selectedInsOption}
						options={optionsIns}
						placeholder="Фильтр по инструкции"
						onChange={setSelectedInsOption}
					>
					</CustomSelect>
					<CustomSelect
						value={selectedTestOption}
						options={optionsTests}
						placeholder="Фильтр по тесту"
						onChange={setSelectedTestOption}
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
						endpoint={getAllHistoriesPaginatedUrl}
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
		</div>
	);
}