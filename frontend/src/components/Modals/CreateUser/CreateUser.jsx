import styles from './CreateUser.module.css';
import Button from '../../Button/Button';
import axios, {AxiosError} from 'axios';
import {deleteUserUrl, JWT_STORAGE_KEY, PREFIX} from '../../../helpers/constants';
import {useState} from 'react';
import InputForm from '../../InputForm/InputForm';
import {SelectForm} from '../../SelectForm/SelectForm';


export function CreateUser(setCreateModalOpen, setLastNameFilter) {
	const [error, setError] = useState(undefined);

	const jwt = localStorage.getItem(JWT_STORAGE_KEY);

	const createUser = async (id, last_name) => {
		try {

			await axios.delete(`${PREFIX}${deleteUserUrl}/${id}`, {
				headers: {
					'Authorization': `Bearer ${jwt}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});
			setCreateModalOpen(false);
			setLastNameFilter(last_name ? last_name : '');
		} catch (e) {
			if (e instanceof AxiosError) {
				setError(e.response?.data.detail || e.response?.data.message || 'Неизвестная ошибка логина');
			} else {
				setError(`Неизвестная ошибка ${e}`);
			}
		}
	};

	return (
		<div className={styles['create_user']}>
			<h1 className={styles['title']}>Создать нового сотрудника</h1>
			{error && <div className={styles['error']}>{error}</div>}
			<div className={styles['content']}>
				<div className={styles['left_panel']}>
					<span className={styles['span']}>
						Фамилия:
						<InputForm
							value={''}
							type="text"
							name='last_name'
							placeholder='Фамилия'
						/>
					</span>
					<span className={styles['span']}>
						Имя:
						<InputForm
							value={''}
							type="text"
							name='name'
							placeholder='Имя'
						/>
					</span>
					<span className={styles['span']}>
						Отчество:
						<InputForm
							value={''}
							type="text"
							name='father_name'
							placeholder='Отчество'
						/>
					</span>
					<span className={styles['span']}>
						Профессия:
						<SelectForm
							// value={selectedProfOption}
							// options={optionsProf}
							placeholder="Профессия"
						/>
					</span>
					<span className={styles['span']}>
						Подразделение:
						<SelectForm
							// value={selectedDivOption}
							// options={optionsDiv}
							placeholder="Подразделение"
						/>
					</span>
					<span className={styles['span']}>
						Табельный номер:
						<InputForm
							value={''}
							type="text"
							name='number'
							placeholder='Табельный номер'
						/>
					</span>
					<span className={styles['span']}>
						Дата приема на работу:
						<InputForm
							value={''}
							type="date"
							name='started_work'
							placeholder='Дата приема на работу'
						/>
					</span>
					<span className={styles['span']}>
						Дата рождения:
						<InputForm
							value={''}
							type="date"
							name='date_of_birth'
							placeholder='Дата рождения'
						/>
					</span>
					<span className={styles['span']}>
						Логин:
						<InputForm
							value={''}
							type="text"
							name='email'
							placeholder='Логин'
						/>
					</span>

				</div>
				<div className={styles['right_panel']}>
					<span className={styles['span']}>
						Телефон:
						<InputForm
							value={''}
							type="text"
							name='phone_number'
							placeholder='Телефон'
						/>
					</span>
					<span className={styles['span']}>
						Телеграм ID:
						<InputForm
							value={''}
							type="text"
							name='telegram_id'
							placeholder='Телеграм ID'
						/>
					</span>
					<span className={styles['span']}>
						Рост, см:
						<InputForm
							value={''}
							type="number"
							name='height'
							placeholder='Рост'
						/>
					</span>
					<span className={styles['span']}>
						Размер одежды:
						<InputForm
							value={''}
							type="number"
							name='clothing_size'
							placeholder='Размер одежды'
						/>
					</span>
					<span className={styles['span']}>
						Размер обуви:
						<InputForm
							value={''}
							type="number"
							name='shoe_size'
							placeholder='Размер обуви'
						/>
					</span>
					<span className={styles['span']}>
						Размер головного убора:
						<InputForm
							value={''}
							type="number"
							name='head_size'
							placeholder='Размер головного убора'
						/>
					</span>
					<span className={styles['span']}>
						Размер респиратора:
						<InputForm
							value={''}
							type="number"
							name='mask_size'
							placeholder='Размер респиратора'
						/>
					</span>
					<span className={styles['span']}>
						Размер перчаток:
						<InputForm
							value={''}
							type="number"
							name='gloves_size'
							placeholder='Размер перчаток'
						/>
					</span>
					<span className={styles['span']}>
						Размер рукавиц:
						<InputForm
							value={''}
							type="number"
							name='mitten_size'
							placeholder='Размер рукавиц'
						/>
					</span>
				</div>
			</div>

			<div className={styles['button']}>
				<Button onClick={() => createUser()}>
					Создать
				</Button>
			</div>
		</div>
	);
}