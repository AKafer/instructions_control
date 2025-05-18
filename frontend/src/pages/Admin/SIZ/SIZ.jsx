import styles from './SIZ.module.css';
import Button from '../../../components/Button/Button';
import {Modal} from '../../../components/Modals/Modal';
import {useState} from 'react';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import {getAllMaterialTypesUrl} from '../../../helpers/constants';
import {ManageSIZ} from '../../../components/Modals/ManageSIZ/ManageSIZ';



export function SIZ () {
	const [isManageSIZOpen, setIsManageSIZOpen] = useState(false);

	const {
		error: errorSIZ,
		options: optionsSIZ,
		itemDict: SIZDict,
		getItems: getSIZ
	} = useFillSelect({
		endpoint: getAllMaterialTypesUrl,
		labelField: 'title'
	});

	const openCreateModal = () => {
		setIsManageSIZOpen(true);
	};

	return (
		<div className={styles.siz}>
			<div className={styles.outer_manage}>
				<div className={styles.manage}>
					<h1 className={styles.title}>Управление</h1>
					<Button onClick={openCreateModal}>
					Тип материала
					</Button>
					<Modal isOpen={isManageSIZOpen} onClose={() => setIsManageSIZOpen(false)}>
						<ManageSIZ
							optionsSIZ={optionsSIZ}
							SIZDict={SIZDict}
							getSIZ={getSIZ}
						/>
					</Modal>
				</div>
			</div>
		</div>
	);
}