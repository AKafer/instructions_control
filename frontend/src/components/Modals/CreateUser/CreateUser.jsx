import styles from './CreateUser.module.css';
import Button from '../../Button/Button';
import {getAllUsersUrl, PREFIX, registerUrl} from '../../../helpers/constants';
import {useEffect, useReducer, useState} from 'react';
import InputForm from '../../InputForm/InputForm';
import {SelectForm} from '../../SelectForm/SelectForm';
import {formReducer, INITIAL_STATE} from './CreateUser.state';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import useApi from '../../../hooks/useApi.hook';


export function CreateUser({
	optionsProf, optionsDiv, setCreateModalOpen, setRefreshKey, setLastNameFilter, currentUser
}) {
	const api = useApi();
	const [error, setError] = useState(undefined);
	const [formState, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const { values, isValid, additional_features, isFormReadyToSubmit} = formState;

	const manageUser = async (payload) => {
		try {
			if (currentUser) {
				await api.patch(`${getAllUsersUrl}/${currentUser.id}`, payload);
			} else{
				await api.post(`${registerUrl}`, payload);
			}
			setCreateModalOpen(false);
			setLastNameFilter(payload.last_name ? payload.last_name : '');
			setRefreshKey((prev) => prev + 1);
		} catch (e) {
			setError(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	useEffect(() => {
		if (currentUser) {
			dispatchForm({type: 'SET_FROM_USER', payload: Object.entries(currentUser)});
		}
	}, [currentUser]);

	const onChange = (e) => {
		dispatchForm({type: 'SET_VALUE', payload: { [e.target.name]: e.target.value}});
		dispatchForm({type: 'SET_VALIDITY_FOR_FIELD', payload: e.target.name});
	};

	const addAdditionalFeature = (e) => {
		dispatchForm({type: 'SET_ADDITIONAL_FEATURE', payload: { [e.target.name]: e.target.value}});
	};

	const selectProf = (e) => {
		dispatchForm({type: 'SET_VALUE', payload: { 'profession_id': e.value}});
		dispatchForm({type: 'SET_VALIDITY_FOR_FIELD', payload: 'profession_id'});
	};

	const selectDiv = (e) => {
		dispatchForm({type: 'SET_VALUE', payload: { 'division_id': e.value}});
		dispatchForm({type: 'SET_VALIDITY_FOR_FIELD', payload: 'division_id'});
	};

	const selectGender = (e) => {
		dispatchForm({type: 'SET_ADDITIONAL_FEATURE', payload: { 'gender': e.label}});
	};

	const addUser = (e) => {
		e.preventDefault();
		dispatchForm({type: 'SUBMIT'});
	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			 const payload = {
				...values,
				password: '1111',
				additional_features: Object.keys(additional_features).length > 0 ? additional_features : undefined,
				date_of_birth: values.date_of_birth ? values.date_of_birth + 'T06:00:00Z' : undefined,
				started_work: values.started_work ? values.started_work + 'T06:00:00Z' : undefined,
				changed_profession: values.changed_profession ? values.changed_profession + 'T06:00:00Z' : undefined
			};
			manageUser(payload);
			dispatchForm({ type: 'CLEAR' });
		}
	}, [isFormReadyToSubmit, values, additional_features]);

	const optionsGender = [
		{ value: '1', label: 'Мужской' },
		{ value: '2', label: 'Женский' }
	];

	const errorMessage = 'Обязательное поле';

	return (
		<div className={styles['create_user']}>
			<h1 className={styles['title']}>{currentUser ? 'Редактировать' : 'Создать нового'} сотрудника</h1>
			{error && <div className={styles['error']}>{error}</div>}
			<form onSubmit={addUser} className={styles['form']}>
				<div className={styles['content']} >
					<div className={styles['left_panel']}>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipEmail"
						>
						Логин*:
							<InputForm
								value={values.email}
								isValid={isValid.email}
								type="text"
								name='email'
								placeholder='Email'
								onChange={onChange}
							/>
							<Tooltip
								id="errorTooltipEmail"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.email}
								className={styles['my-tooltip']}
							/>
						</span>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipLastName"
						>
						Фамилия*:
							<InputForm
								value={values.last_name}
								type="text"
								name='last_name'
								isValid={isValid.last_name}
								placeholder='Фамилия'
								onChange={onChange}

							/>
							<Tooltip
								id="errorTooltipLastName"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.last_name}
								className={styles['my-tooltip']}
							/>
						</span>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipName"
						>
						Имя*:
							<InputForm
								value={values.name}
								type="text"
								name='name'
								isValid={isValid.name}
								placeholder='Имя'
								onChange={onChange}
							/>
							<Tooltip
								id="errorTooltipName"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.name}
								className={styles['my-tooltip']}
							/>
						</span>
						<span className={styles['span']}>
						Отчество:
							<InputForm
								value={values.father_name || ''}
								type="text"
								name='father_name'
								placeholder='Отчество'
								onChange={onChange}
							/>
						</span>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipProf"
						>
						Профессия*:
							<SelectForm
								value={optionsProf.find(option => option.value === values.profession_id) || null}
								options={optionsProf}
								placeholder="Профессия"
								name='profession_id'
								onChange={selectProf}
								isValid={isValid.profession_id}
							/>
							<Tooltip
								id="errorTooltipProf"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.profession_id}
								className={styles['my-tooltip']}
							/>
						</span>
						<span
							className={styles['span']}
							data-tooltip-content={errorMessage}
							data-tooltip-id="errorTooltipDiv"
						>
						Подразделение*:
							<SelectForm
								value={optionsDiv.find(option => option.value === values.division_id) || null}
								options={optionsDiv}
								placeholder="Подразделение"
								name='division_id'
								onChange={selectDiv}
								isValid={isValid.division_id}
							/>
							<Tooltip
								id="errorTooltipDiv"
								place="top-end"
								content={errorMessage}
								isOpen={!isValid.division_id}
								className={styles['my-tooltip']}
							/>
						</span>
						<span className={styles['span']}>
						Табельный номер:
							<InputForm
								value={values.number  || ''}
								type="text"
								name='number'
								placeholder='Табельный номер'
								onChange={onChange}
							/>
						</span>
					</div>
					<div className={styles['left_panel']}>
						<span className={styles['span']}>
						ИНН:
							<InputForm
								value={values.inn  || ''}
								type="text"
								name='inn'
								placeholder='ИНН'
								onChange={onChange}
							/>
						</span>
						<span className={styles['span']}>
						СНИЛС:
							<InputForm
								value={values.snils  || ''}
								type="text"
								name='snils'
								placeholder='СНИЛС'
								onChange={onChange}
							/>
						</span>
						<span className={styles['span']}>
						Телефон:
							<InputForm
								value={values.phone_number || ''}
								type="text"
								name='phone_number'
								placeholder='Телефон'
								onChange={onChange}
							/>
						</span>
						<span className={styles['span']}>
						Телеграм ID:
							<InputForm
								value={values.telegram_id || ''}
								type="text"
								name='telegram_id'
								placeholder='Телеграм ID'
								onChange={onChange}
							/>
						</span>
						<span className={styles['span']}>
						Дата приема на работу:
							<InputForm
								value={values.started_work || ''}
								type="date"
								name='started_work'
								placeholder='Дата приема на работу'
								onChange={onChange}
							/>
						</span>
						<span className={styles['span']}>
						Дата рождения:
							<InputForm
								value={values.date_of_birth  || ''}
								type="date"
								name='date_of_birth'
								placeholder='Дата рождения'
								onChange={onChange}
							/>
						</span>
						<span className={styles['span']}>
						Дата смены должности/подразделения:
							<InputForm
								value={values.changed_profession  || ''}
								type="date"
								name='changed_profession'
								placeholder='Дата смены должности/подразделения'
								onChange={onChange}
							/>
						</span>
					</div>
					<div className={styles['right_panel']}>

						<span className={styles['span']}>
						Пол:
							<SelectForm
								value={optionsGender.find(
									option => option.label === additional_features.gender)
									|| null}
								options={optionsGender}
								placeholder="Пол"
								name='gender'
								onChange={selectGender}
							/>
						</span>
						<span className={styles['span']}>
						Рост, см:
							<InputForm
								value={additional_features.height || ''}
								type="number"
								name='height'
								placeholder='Рост'
								onChange={addAdditionalFeature}
							/>
						</span>
						<span className={styles['span']}>
						Размер одежды:
							<InputForm
								value={additional_features.clothing_size || ''}
								type="number"
								name='clothing_size'
								placeholder='Размер одежды'
								onChange={addAdditionalFeature}
							/>
						</span>
						<span className={styles['span']}>
						Размер обуви:
							<InputForm
								value={additional_features.shoe_size || ''}
								type="number"
								name='shoe_size'
								placeholder='Размер обуви'
								onChange={addAdditionalFeature}
							/>
						</span>
						<span className={styles['span']}>
						Размер головного убора:
							<InputForm
								value={additional_features.head_size || ''}
								type="number"
								name='head_size'
								placeholder='Размер головного убора'
								onChange={addAdditionalFeature}
							/>
						</span>
						<span className={styles['span']}>
						Размер респиратора:
							<InputForm
								value={additional_features.mask_size || ''}
								type="number"
								name='mask_size'
								placeholder='Размер респиратора'
								onChange={addAdditionalFeature}
							/>
						</span>
						<span className={styles['span']}>
						Размер перчаток:
							<InputForm
								value={additional_features.gloves_size || ''}
								type="number"
								name='gloves_size'
								placeholder='Размер перчаток'
								onChange={addAdditionalFeature}
							/>
						</span>
					</div>
				</div>

				<div className={styles['button']}>
					<Button>{currentUser ? 'Редактировать' : 'Создать'}</Button>
				</div>
			</form>
		</div>
	);
}