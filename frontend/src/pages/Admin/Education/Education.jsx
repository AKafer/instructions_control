import styles from '../SIZ/SIZ.module.css';
import Button from '../../../components/Button/Button';
import {Modal} from '../../../components/Modals/Modal';
import {CreateSIZ} from '../../../components/Modals/CreateSIZ/CreateSIZ';
import {ManageTypes} from '../../../components/Modals/ManageTypes/ManageTypes';
import {ManageNorms} from '../../../components/Modals/ManageNorms/ManageNorms';
import {NormStatistics} from '../../../components/Modals/NormStatistics/NormStatistics';
import Input from '../../../components/Input/Input';
import {CustomSelect} from '../../../components/Select/Select';
import UniversalTable from '../../../components/UTable/UTable';
import {getAllTestsUrl} from '../../../helpers/constants';
import {DeleteSIZ} from '../../../components/Modals/DeleteSIZ/DeleteSIZ';
import {useState} from 'react';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {CreateQuestionsByAI} from '../../../components/Modals/CreateQuestionsByAI/CreateQuestionsByAI';
import {ManageTests} from '../../../components/Modals/ManageTests/ManageTests';


export function Education () {
	const [isQAIModalOpen, setIsQAIModalOpen] = useState(false);
	const [isManageTestsOpen, setIsManageTestsOpen] = useState(false);


	const {
		error: errorTests,
		options: optionsTests,
		itemDict: testsDict,
		getItems: getTests
	} = useFillSelect({
		endpoint: getAllTestsUrl,
		labelField: 'title'
	});

	const openQAIModal = () => {
		setIsQAIModalOpen(true);
	};

	const openManageTestsModal = () => {
		getTests();
		setIsManageTestsOpen(true);
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
							testsDict={testsDict}
							setCreateModalOpen={setIsManageTestsOpen}
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
				{/*	{(errorDiv || errorProf) && <div className={styles.error}>*/}
				{/*		{errorDiv ? errorDiv : ''}--{errorProf ? errorProf : ''}*/}
				{/*	</div>}*/}
				{/*	<div className={styles.filters_table}>*/}
				{/*		<Input*/}
				{/*			value={lastNameFilter}*/}
				{/*			 onChange={(e) => setLastNameFilter(e.target.value)}*/}
				{/*			placeholder="Поиск по фамилии"*/}
				{/*		/>*/}
				{/*		<CustomSelect*/}
				{/*			value={selectedProfOption}*/}
				{/*			options={optionsProf}*/}
				{/*			placeholder="Фильтр по профессии"*/}
				{/*			onChange={setSelectedProfOption}*/}
				{/*		>*/}
				{/*		</CustomSelect>*/}
				{/*		<CustomSelect*/}
				{/*			value={selectedDivOption}*/}
				{/*			options={optionsDiv}*/}
				{/*			placeholder="Фильтр по подразделению"*/}
				{/*			onChange={setSelectedDivOption}*/}
				{/*		>*/}
				{/*		</CustomSelect>*/}
				{/*		<buton className={styles.filter_button} onClick={ClearFilters}>*/}
				{/*			<img  src="/icons/drop-filters-icon.svg" alt="drop-filters"/>*/}
				{/*		</buton>*/}
				{/*	</div>*/}
				{/*	<div className={styles.table_count}>*/}
				{/*		Количество записей: {totalRecords}*/}
				{/*	</div>*/}
				{/*	<div className={styles.table}>*/}
				{/*		<UniversalTable*/}
				{/*			endpoint={getAllMaterialsPaginatedUrl}*/}
				{/*			columns={columns}*/}
				{/*			usePagination={true}*/}
				{/*			initialPage={1}*/}
				{/*			initialPageSize={10}*/}
				{/*			filters={filters}*/}
				{/*			onTotalRecordsChange={setTotalRecords}*/}
				{/*			refreshKey={refreshKey}*/}
				{/*		/>*/}
				{/*	</div>*/}
			</div>
			{/*<Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>*/}
			{/*	<DeleteSIZ*/}
			{/*		SIZ={selectedSIZ}*/}
			{/*		setDeleteModalOpen={setDeleteModalOpen}*/}
			{/*		setRefreshKey={setRefreshKey}*/}
			{/*	/>*/}
			{/*</Modal>*/}
		</div>
	);
}