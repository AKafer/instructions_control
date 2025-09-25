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


export function Education () {
	const [isCreateModalOpen, setCreateModalOpen] = useState(false);

	const {
		error: errorTests,
		options: optionsTests,
		itemDict: testsDict,
		getItems: getTypes
	} = useFillSelect({
		endpoint: getAllTestsUrl,
		labelField: 'title'
	});

	const openCreateModal = () => {
		// setSelectedSIZ(null);
		setCreateModalOpen(true);
	};

	return (
		<div className={styles.siz}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
					<Button onClick={openCreateModal}>
					Вопросы от AI
					</Button>
					<Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
						<CreateQuestionsByAI
							optionsTests={optionsTests}
							testsDict={testsDict}
							setCreateModalOpen={setCreateModalOpen}
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