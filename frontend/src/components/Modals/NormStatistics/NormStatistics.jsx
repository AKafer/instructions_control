import styles from './NormStatistics.module.css';
import { getCalculateNeedUrl} from '../../../helpers/constants';
import UniversalTable from '../../UTable/UTable';
import {useState} from 'react';
import {Modal} from '../Modal';
import {NormCalc} from '../NormCalc/NormCalc';

export function NormStatistics() {
	const [totalRecords, setTotalRecords] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0);
	const [selectedTypeMaterial, setSelectedTypeMaterial] = useState(null);
	const [calcModalOpen, setCalcModalOpen] = useState(false);

	const columns = [
		{
			title: 'Наименование',
			dataIndex: 'name',
			key: 'name',
			sorter: (a, b) => a.name.localeCompare(b.name)
		},
		{
			title: 'Норма',
			dataIndex: 'norm',
			key: 'norm',
			sorter: (a, b) => a.norm - b.norm
		},
		{
			title: 'Выдано',
			dataIndex: 'given',
			key: 'given',
			sorter: (a, b) => a.given - b.given
		},
		{
			title: 'Нужно',
			dataIndex: 'need',
			key: 'need',
			sorter: (a, b) => a.need - b.need
		},
		{
			title: 'Расчёт',
			key: 'calc',
			align: 'center',
			render: (_, record) => (
				<button className={styles.iconButton}
					onClick={() => {
						setSelectedTypeMaterial(record);
						setCalcModalOpen(true);
					}}
				>
					<img
						className={styles.iconImage}
						src="/icons/calc-icon.svg"
						alt="edit"/>
				</button>
			)
		}
	];

	function transformRawToRows(raw) {
		return Object.entries(raw).map(([itemName, {id, data}]) => ({
			key: itemName,
			name: itemName,
			id,
			norm: data.norm,
			given: data.given,
			need: data.need
		}));
	}


	return (
		<div className={styles.table}>
			<UniversalTable
				endpoint={getCalculateNeedUrl}
				columns={columns}
				usePagination={false}
				onTotalRecordsChange={setTotalRecords}
				formatData={transformRawToRows}
				refreshKey={refreshKey}
			/>
			<Modal isOpen={calcModalOpen} onClose={() => setCalcModalOpen(false)}>
				<NormCalc
					selectedTypeMaterial={selectedTypeMaterial}
				/>
			</Modal>
		</div>
	);
}