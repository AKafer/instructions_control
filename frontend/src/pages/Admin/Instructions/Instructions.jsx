import styles from './Instructions.module.css';
import UniversalTable from '../../../components/UTable/UTable';
import {JWT_STORAGE_KEY, PREFIX} from '../../../helpers/constants';
import {useEffect, useState} from 'react';
import Button from '../../../components/Button/Button';
import {ManageDiv} from '../../../components/Modals/ManageDiv/ManageDiv';
import {Modal} from '../../../components/Modals/Modal';
import {ManageIns} from '../../../components/Modals/ManageIns/ManageIns';


export function Instructions () {
	const [jwt, setJwt] = useState(localStorage.getItem(JWT_STORAGE_KEY));
	const [selectedIns, setSelectedIns] = useState(null);
	const [isCreateModalOpen, setCreateModalOpen] = useState(false);
	const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
	const [totalRecords, setTotalRecords] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isCreateInsModalOpen, setCreateInsModalOpen] = useState(false);

	useEffect(() => {
		setJwt(localStorage.getItem(JWT_STORAGE_KEY));
	}, []);

	const columns = [
		{
			title: 'Название',
			dataIndex: 'title',
			key: 'title',
			sorter: (a, b) => a.title.localeCompare(b.title)
		},
		{
			title: 'Номер',
			dataIndex: 'number',
			key: 'number',
			sorter: (a, b) => a.number.localeCompare(b.number)
		},
		{
			title: 'Файл',
			key: 'link',
			align: 'center',
			render: (_, record) => (
				<a className={styles.iconButton}
				   target={'_blank'}
				   href={record.link} rel="noreferrer"
				>
					<img
						className={styles.iconImage}
						src="/icons/doc-icon.svg"
						alt="edit"/>
				</a>
			)
		},
		{
			title: 'Изменить',
			key: 'edit',
			align: 'center',
			render: (_, record) => (
				<button className={styles.iconButton}
					onClick={() => {
						setSelectedIns(record);
						setCreateModalOpen(true);
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
						setSelectedIns(record);
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

	let filters = {};

	return (
		<div className={styles.ins}>
			<div className={styles.leftSide}>
				<div className={styles.buttonWrapper}>
					<Button
						className={styles.button}
						onClick={() => setCreateInsModalOpen(true)}
					>
				Добавить инструкцию
					</Button>
				</div>
				<div className={styles.table}>
					<UniversalTable
						endpoint={`${PREFIX}/api/v1/instructions`}
						columns={columns}
						usePagination={false}
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
						height={400}
					/>
				</div>
			</div>
			<div>
		Some information about the instructions
			</div>
			<Modal isOpen={isCreateInsModalOpen} onClose={() => setCreateInsModalOpen(false)}>
				<ManageIns
					optionsDiv={[]}
					setManageDivModalOpen={setCreateInsModalOpen}
					getDivisions={() => {}}
					setSelectedDivOption={() => {}}
				/>
			</Modal>
		</div>

	);
}