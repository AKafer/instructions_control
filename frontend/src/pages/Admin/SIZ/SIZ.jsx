import styles from './SIZ.module.css';
import Button from '../../../components/Button/Button';
import {Modal} from '../../../components/Modals/Modal';
import {useState} from 'react';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {
	getAllMaterialTypesUrl,
	getAllNormsUrl
} from '../../../helpers/constants';
import {ManageTypes} from '../../../components/Modals/ManageTypes/ManageTypes';
import {ManageNorms} from '../../../components/Modals/ManageNorms/ManageNorms';



export function SIZ () {
	const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
	const [isManageNormsOpen, setIsManageNormsOpen] = useState(false);

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
				</div>
			</div>
		</div>
	);
}