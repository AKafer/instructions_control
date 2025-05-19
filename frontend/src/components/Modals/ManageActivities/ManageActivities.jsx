import styles from './ManageActivities.module.css';
import Button from '../../Button/Button';
import {
	getAllActivitiesUrl,
	getAllBindActivitiesUrl,
	getAllUsersUrl
} from '../../../helpers/constants';
import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {
	formReducer,
	INITIAL_STATE,
	nullOption
} from './manageActivities.state';
import useApi from '../../../hooks/useApi.hook';
import {Checkbox, List} from 'antd';
import cn from 'classnames';


export function ManageActivities({optionsActivities, activitiesDict, optionsProf, getActivities}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const [valueProf, setValueProf] = useState(null);
	const [professionUsers, setProfessionUsers] = useState([]);
	const [bindedUsers, setBindedUsers] = useState([]);
	const [selectedProfUserIds, setSelectedProfUserIds] = useState([]);
	const [selectedBindUserIds, setSelectedBindUserIds] = useState([]);

	const bindedUsersIds = useMemo(
		() => bindedUsers.map(u => u.id),
		[bindedUsers]
	);

	const api = useApi();
	const {
		valueActivity,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;
	
	const optionsActivitiesWide = [
		nullOption, ...optionsActivities
	];

	const manageUsersApi = async ({prof_id, activity_id}) => {
		try {
			let response;
			if (prof_id) {
				 response = await api.get(`${getAllUsersUrl}/?profession_id__in=${prof_id}`);
			}
			if (activity_id) {
				response = await api.get(`${getAllUsersUrl}/?activities_id__in=${activity_id}`);
			}
			const { data } = response;
			return data;
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const manageActivitiesApi = async (payload, isDelete = false) => {
		try {
			let response;
			if (valueActivity?.value) {
				if (isDelete) {
					await api.delete(`${getAllActivitiesUrl}${valueActivity?.value}`);
				} else {
					response = await api.patch(`${getAllActivitiesUrl}${valueActivity?.value}`, payload);
				}
			} else {
				response = await api.post(`${getAllActivitiesUrl}`, payload);
			}
			getActivities();
			if (response) {
				const { id, title, description } = response.data;
				const newOption = { value: id, label: title };
				dispatchForm({type: 'SET_SUB_MODAL', payload: false});
				dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
				dispatchForm({type: 'SET_VALUE_ACTIVITY', payload: newOption});
				dispatchForm({type: 'RESET_VALIDITY'});
				dispatchForm({
					type: 'SET_VALUE', payload:
					{
						'title': title,
						'description': description
					}}
				);
			}
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const manageBindActivitiesApi = async ({bind, payload}) => {
		try {
			if (bind) {
				 await api.post(`${getAllBindActivitiesUrl}create`, payload);
			}
			else {
				await api.delete(`${getAllBindActivitiesUrl}delete`, {data: payload});
			}
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const selectActivity = async (option) => {
		setValueProf(null);
		setProfessionUsers([]);
		setBindedUsers([]);
		setSelectedProfUserIds([]);
		setSelectedBindUserIds([]);
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
		dispatchForm({type: 'SET_VALUE_ACTIVITY', payload: option});
		dispatchForm({type: 'RESET_VALIDITY'});
		if (option.value !== 0) {
			dispatchForm({
				type: 'SET_VALUE', payload:
					{
						'title': option.label,
						'description': activitiesDict[option.value]?.description || ''
					}}
			);
			const data = await manageUsersApi({activity_id: option?.value});
			setBindedUsers(data ?? []);
		} else {
			dispatchForm({type: 'CLEAR'});
		}
	};

	const onChange = (e) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});
		dispatchForm({type: 'SET_VALUE', payload: { [e.target.name]: e.target.value}});
		dispatchForm({type: 'RESET_VALIDITY'});
	};

	const creatEditActivity = () => {
		dispatchForm({type: 'SUBMIT'});
	};

	const deleteActivity = () => {
		manageActivitiesApi({}, true);
		dispatchForm({ type: 'CLEAR' });
		dispatchForm({type: 'SET_VALUE_ACTIVITY', payload: nullOption});
		setBindedUsers([]);
		setProfessionUsers([]);
		setValueProf(null);
	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			manageActivitiesApi(values);
			dispatchForm({ type: 'SET_SUBMIT_FALSE' });
		}
	}, [isFormReadyToSubmit]);


	const selectProf = async (option) => {
		setSelectedProfUserIds([]);
		setValueProf(option);
		const data = await manageUsersApi({prof_id: option?.value});
		setProfessionUsers(data ?? []);
	};

	const onCheckPre = (id, checked) => {
		setSelectedProfUserIds(prev => {
			if (checked) {
				return prev.includes(id) ? prev : [...prev, id];
			} else {
				return prev.filter(userId => userId !== id);
			}
		});
	};

	const onCheckAfter = (id, checked) => {
		setSelectedBindUserIds(prev => {
			if (checked) {
				return prev.includes(id) ? prev : [...prev, id];
			} else {
				return prev.filter(userId => userId !== id);
			}
		});
	};

	const bindActivity = async () => {
		if (selectedProfUserIds.length) {
			const payload = {
				activity_ids: [valueActivity?.value],
				user_ids: selectedProfUserIds
			};
			await manageBindActivitiesApi(
				{bind: true, payload: payload}
			);
			const data = await manageUsersApi(
				{activity_id: valueActivity?.value}
			);
			setBindedUsers(data ?? []);
			setSelectedProfUserIds([]);
			setSelectedBindUserIds([]);
		}
	};

	const unBindActivity = async () => {
		if (selectedBindUserIds.length) {
			const payload = {
				activity_ids: [valueActivity?.value],
				user_ids: selectedBindUserIds
			};
			await manageBindActivitiesApi(
				{bind: false, payload: payload}
			);
			const data = await manageUsersApi(
				{activity_id: valueActivity?.value}
			);
			setBindedUsers(data ?? []);
			setSelectedProfUserIds([]);
			setSelectedBindUserIds([]);
		}
	};

	return (
		<div className={styles['manage_activities']}>
			<h1 className={styles['title']}>Управление опасными факторами</h1>
			{errorApi && <div className={styles['error']}>{errorApi}</div>}
			<div className={styles['content']}>
				<div className={styles['left_panel']}>
					<span className={styles['span']}>
					Опасные факторы:
						<SelectForm
							value={valueActivity}
							options={optionsActivitiesWide}
							name="activity_id"
							onChange={selectActivity}
						/>
					</span>
					<div className={styles['box']}>
						<span className={styles['box-title']}>Параметры опасного фактора</span>
						<div className={styles['box-content']}>
							<span
								className={styles['span']}
								data-tooltip-content={errors.title}
								data-tooltip-id="errorTooltipTitle"
							>
						Наименование*:
								<InputForm
									maxLength={64}
									value={values.title}
									isValid={isValid.title}
									type="text"
									name="title"
									placeholder="Наименование"
									onChange={onChange}
								/>
								<Tooltip
									id="errorTooltipTitle"
									place="top-end"
									content={errors.title}
									isOpen={!isValid.title}
									className={styles['my-tooltip']}
								/>
							</span>
							<span className={styles['span']}>
						Описание:
								<InputForm
									value={values.description ?? ''}
									type="text"
									name="description"
									placeholder="Описание"
									onChange={onChange}
								/>
							</span>
							<div className={styles['button-box']}>
								{(Boolean(valueActivity?.value) && visibleDelButton) && <div className={styles['inline']}>
									<button className={styles.iconButton}
										onClick={() => {
											dispatchForm({type: 'SET_SUB_MODAL', payload: true});
											dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});

										}}
									>
										<img
											className={styles.iconImage}
											src="/icons/delete-icon.svg"
											alt="delete"/>
									</button>
								</div>}
								{subModalOpen && <div className={styles['submodal']}>
									<Button className={styles.button_submodal} onClick={deleteActivity}>
										Удалить
									</Button>
									<Button className={styles.button_submodal} onClick={() => {
										dispatchForm({type: 'SET_SUB_MODAL', payload: false});
										dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
									}}>
										Отмена
									</Button>
								</div>
								}
							</div>
						</div>
					</div>
					<div className={styles['button']}>
						<Button onClick={creatEditActivity}>
							{valueActivity?.value ? 'Редактировать' : 'Создать'}
						</Button>
					</div>
				</div>
				<div className={styles['right_panel']}>
					<div className={styles.firstBox}>
						<div className={styles.profSelect}>
							<span className={styles['span']}>
							Фильтр по профессии:
								<SelectForm
									value={valueProf}
									options={valueActivity?.value ? optionsProf : []}
									name="profession_id"
									onChange={selectProf}
									placeholder="Профессия"
								/>
							</span>
						</div>
						<div className={styles.listBox}>
							<List
								bordered
								dataSource={professionUsers}
								renderItem={user => (
									<List.Item >
										<Checkbox
											className={cn(styles.checkbox)}
											disabled={bindedUsersIds.includes(user.id)}
											checked={selectedProfUserIds.includes(user.id)}
											onChange={e => onCheckPre(user.id, e.target.checked)}
										>
											{user.last_name} {user.name} {user.father_name}
										</Checkbox>
									</List.Item>
								)}
							/>
						</div>
					</div>
					<div className={styles.secondBox}>
						<div className={styles.iconBox}>
							<button className={styles.iconButton} onClick={bindActivity}>
								<img className={cn(styles.iconSparrow, styles.tudaSparrow)} src="/icons/up-icon.svg" alt="tuda"/>
							</button>
							<button className={styles.iconButton} onClick={unBindActivity}>
								<img className={cn(styles.iconSparrow, styles.sudaSparrow)} src="/icons/up-icon.svg" alt="suda"/>
							</button>
						</div>

					</div>
					<div className={styles.thirdBox}>
						{Boolean(valueActivity?.value) && <h2 className={styles.bindTitleAbsolute}>
							{`Опасный фактор "${valueActivity?.label}"`}
						</h2>}
						<h2 className={styles.bindTitle}>{'Привязанные пользователи:'}</h2>
						<div className={styles.listBox2}>
							<List
								bordered
								dataSource={bindedUsers}
								renderItem={user => (
									<List.Item >
										<Checkbox
											className={styles.checkbox}
											checked={selectedBindUserIds.includes(user.id)}
											onChange={e => onCheckAfter(user.id, e.target.checked)}
										>
											{user.last_name} {user.name} {user.father_name}
										</Checkbox>
									</List.Item>
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
