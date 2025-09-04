import styles from './SIZ.module.css';
import Button from '../../../components/Button/Button';
import {Modal} from '../../../components/Modals/Modal';
import {useState} from 'react';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {
	getAllMaterialsPaginatedUrl,
	getAllMaterialTypesUrl,
	getAllNormsUrl
} from '../../../helpers/constants';
import {ManageTypes} from '../../../components/Modals/ManageTypes/ManageTypes';
import {ManageNorms} from '../../../components/Modals/ManageNorms/ManageNorms';
import {NormStatistics} from '../../../components/Modals/NormStatistics/NormStatistics';
import UniversalTable from '../../../components/UTable/UTable';



export function SIZ () {
	const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
	const [isManageNormsOpen, setIsManageNormsOpen] = useState(false);
	const [isNormStatisticsOpen, setIsNormStatisticsOpen] = useState(false);
	const [totalRecords, setTotalRecords] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0);

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

	const openModalTypes = () => {
		setIsManageTypesOpen(true);
	};

	const openModalNorms = () => {
		setIsManageNormsOpen(true);
	};

	const openModalStatistics = () => {
		setIsNormStatisticsOpen(true);
	};

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
			render: (sertificate) => sertificate ?? '—'
		},
		{
			title: 'Номер документа',
			dataIndex: 'number_of_document',
			key: 'number_of_document',
			render: (number_of_document) => number_of_document ?? '—'
		},
		{
			title: 'Дата выдачи',
			dataIndex: 'start_date',
			key: 'start_date',
			render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—',
			sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date)
		},
		{
			title: 'Дата окончания',
			dataIndex: 'end_date',
			key: 'end_date',
			render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—',
			sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date)
		},
		{
			title: 'Количество',
			dataIndex: 'quantity',
			key: 'quantity',
			render: (quantity) => quantity ?? '—',
			sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0)
		}

	];

	let filters = {};


	return (
		<div className={styles.siz}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
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
				<div className={styles.table}>
					<UniversalTable
						endpoint={getAllMaterialsPaginatedUrl}
						columns={columns}
						usePagination={true}
						initialPage={1}
						initialPageSize={10}
						filters={filters}
						onTotalRecordsChange={setTotalRecords}
						refreshKey={refreshKey}
					/>
				</div>
			</div>
		</div>
	);
}