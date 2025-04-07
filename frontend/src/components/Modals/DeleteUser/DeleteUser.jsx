import styles from './DeleteUser.module.css';
import Button from '../../Button/Button';
import axios, {AxiosError} from 'axios';
import {deleteUserUrl, JWT_STORAGE_KEY, PREFIX} from '../../../helpers/constants';
import {useState} from 'react';


export function DeleteUser({user, setDeleteModalOpen, setRefreshKey, setLastNameFilter}) {
	const [error, setError] = useState(undefined);

	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	const deleteUser = async (id, last_name) => {
		try {
			await axios.delete(`${PREFIX}${deleteUserUrl}/${id}`, {
				headers: {
					'Authorization': `Bearer ${jwt}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});
			setDeleteModalOpen(false);
			setLastNameFilter(last_name ? last_name : '');
			setRefreshKey((prev) => prev + 1);
		} catch (e) {
			if (e instanceof AxiosError) {
				setError(e.response?.data.detail || e.response?.data.message || 'Неизвестная ошибка логина');
			} else {
				setError(`Неизвестная ошибка ${e}`);
			}
		}
	};

	return (
		<div className={styles['help']}>
			<div className={styles['content']}>
				<div className={styles['title']}>
					<p>Вы действительно хотите удалить работника:</p>
					<p className={styles.user_bold}>{`${user.last_name ? user.last_name : ''} ${user.name ? user.name : ''} ${user.father_name ? user.father_name : ''}`}</p>
				</div>
			</div>
			{error && <div className={styles['error']}>{error}</div>}
			<div className={styles['button']}>
				<Button onClick={() => deleteUser(user.id, user.last_name)}>
					Да, удалить
				</Button>
			</div>
		</div>
	);
}