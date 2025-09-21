import styles from './DeleteSIZ.module.css';
import Button from '../../Button/Button';
import {getAllMaterialsUrl} from '../../../helpers/constants';
import {useState} from 'react';
import useApi from '../../../hooks/useApi.hook';


export function DeleteSIZ({SIZ, setDeleteModalOpen, setRefreshKey}) {
	const [error, setError] = useState(undefined);

	const api = useApi();
	const materialTitle =
		SIZ?.material_type?.title ??
		(typeof SIZ?.material_type === 'string' ? SIZ.material_type : '') ??
		'—';

	const deleteSIZ = async (id) => {
		try {
			await api.delete(`${getAllMaterialsUrl}${id}`);
			setDeleteModalOpen(false);
			setRefreshKey((prev) => prev + 1);
		} catch (e) {
			setError(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	return (
		<div className={styles['help']}>
			<div className={styles['content']}>
				<div className={styles['title']}>
					<p>Вы действительно хотите удалить материал:</p>
					<p className={styles.user_bold}>{`${materialTitle}`}</p>
				</div>
			</div>
			{error && <div className={styles['error']}>{error}</div>}
			<div className={styles['button']}>
				<Button onClick={() => deleteSIZ(SIZ.id)}>
					Да, удалить
				</Button>
			</div>
		</div>
	);
}