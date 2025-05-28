import styles from './ManageNorms.module.css';
import Button from '../../Button/Button';
import {
	getAllActivitiesUrl,
	getAllNormsUrl,
	getAllProfessionsUrl
} from '../../../helpers/constants';
import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';

import {
	formReducer,
	INITIAL_STATE
} from './manageNorms.state';
import useApi from '../../../hooks/useApi.hook';
import cn from 'classnames';
import useFillSelect from '../../../hooks/useFillSelect.hook';
import ToggleSwitch from '../../Switch/Switch';
import NormMaterial from '../../NormMaterial/NormMaterial';
import Spinner from '../../Spinner/Spinner';


export function ManageNorms({optionsNorms, normsDict, optionsTypes, getNorms}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [loading, setLoading] = useState(false);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const [bindedTypeMaterials, setBindedTypeMaterials] = useState([]);
	const [triggerBindNormsApi, setTriggerBindNormsApi] = useState(false);

	const {
		error: errorProf,
		options: optionsProf,
		itemDict: professionDict,
		getItems: getProfessions
	} = useFillSelect({
		endpoint: getAllProfessionsUrl,
		labelField: 'title'
	});

	const {
		error: errorActivities,
		options: optionsActivities,
		itemDict: activitiesDict,
		getItems: getActivities
	} = useFillSelect({
		endpoint: getAllActivitiesUrl,
		labelField: 'title'
	});


	const api = useApi();
	const {
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		checkedNormsType,
		isFormReadyToSubmit
	} = state;

	const normsByProf = useMemo(() => {
		return Object.entries(normsDict).reduce((acc, [normId, norm]) => {
			const prof = norm.profession;
			if (prof) {
				acc[String(prof.id)] = {
					title: norm.title,
					norm_id: normId
				};
			}
			return acc;
		}, {});
	}, [normsDict]);

	const normsByActivity = useMemo(() => {
		return Object.entries(normsDict).reduce((acc, [normId, norm]) => {
			const activity = norm.activity;
			if (activity) {
				acc[String(activity.id)] = {
					title: norm.title,
					norm_id: normId
				};
			}
			return acc;

		}, {});
	}, [normsDict]);

	const currentNorm = useMemo(() => {
		if (values?.prof_id) {
			return normsByProf[String(values.prof_id)] ?? null;
		}
		if (values?.activity_id) {
			return normsByActivity[String(values.activity_id)] ?? null;
		}
		return null;
	}, [
		values?.prof_id,
		values?.activity_id,
		normsByProf,
		normsByActivity
	]);

	useEffect(() => {
		if (!currentNorm) {
			setBindedTypeMaterials([]);
			return;
		};
		setBindedTypeMaterials([]);
		const fetchMaterials = async () => {
			setErrorApi(null);
      		setLoading(true);
			await new Promise(res => setTimeout(res, 100));
			const data = await manageBindNormsApi({
				method: 'GET',
				payload: {}
			});
			setBindedTypeMaterials(data || []);
			setLoading(false);
		};
		fetchMaterials();
	}, [currentNorm, triggerBindNormsApi]);

	const currentItemTitle = useMemo(() => {
		if (values?.prof_id) {
			return professionDict[String(values.prof_id)].title ?? null;
		}
		if (values?.activity_id) {
			return activitiesDict[String(values.activity_id)].title ?? null;
		}
		return null;
	}, [
		values?.prof_id,
		values?.activity_id,
		values?.type_id
	]);

	const actualOptionsTypes = useMemo(() => {
		let opt = [];
		if (values?.prof_id || values?.activity_id) {
			const boundIds = new Set(bindedTypeMaterials.map(m => m.material_type.id));
			opt =  optionsTypes.filter(o => !boundIds.has(o.value));
		}
		return opt;
	}, [values?.prof_id, values?.activity_id, optionsTypes, bindedTypeMaterials]);

	const manageNormsApi = async (payload, isDelete = false) => {
		try {
			if (Boolean(currentNorm)) {
				if (isDelete) {
					await api.delete(`${getAllNormsUrl}${currentNorm['norm_id']}`);
				}
			} else {
				await api.post(`${getAllNormsUrl}`, payload);
			}
			getNorms();
			dispatchForm({type: 'SET_SUB_MODAL', payload: false});
			dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
			dispatchForm({type: 'RESET_VALIDITY'});
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};

	const manageBindNormsApi = async ({method, payload, norm_material_id, trig}) => {
		let response;
		try {
			if (method === 'GET') {
				await setLoading(true);
				response = await api.get(`/norms/get_norm_material_by_norm/${currentNorm.norm_id}`);
				return response.data;
			}
			if (method === 'POST') {
				 await api.post(`/norms/add_materials/${currentNorm.norm_id}`, payload);
				 setTriggerBindNormsApi(v => !v);
			}
			if (method === 'PATCH') {
				 await api.patch(`/norms/change_materials/${norm_material_id}`, payload);
				 if (trig) {
					setTriggerBindNormsApi(v => !v);
				}
			}
			if (method === 'DELETE') {
				await api.delete(`/norms/delete_materials/${currentNorm.norm_id}`, {data: payload});
				setTriggerBindNormsApi(v => !v);
				dispatchForm({type: 'SET_VALUE', payload: { 'type_id': null}});
			}
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		} finally {
			setLoading(false);
		}
	};

	const creatEditNorm = () => {
		let payload = {
			title: `Норма для "${currentItemTitle}"`
		};
		if (!Boolean(currentNorm)) {
			if (checkedNormsType) {
				payload = {...payload, 'activity_id': values.activity_id};
			} else {
				payload = {...payload, 'profession_id': values.prof_id};
			}
		}
		manageNormsApi(payload);
	};

	const deleteNorm = () => {
		manageNormsApi({}, true);
		dispatchForm({ type: 'CLEAR' });
	};

	
	const selectProf = async (option) => {
		setBindedTypeMaterials([]);
		dispatchForm({
			type: 'SET_VALUE', payload:
					{prof_id: option.value, activity_id: '', type_id: ''}
		});
		setErrorApi(undefined);
	};

	const selectActivity = async (option) => {
		setBindedTypeMaterials([]);
		dispatchForm({
			type: 'SET_VALUE', payload:
					{activity_id: option.value, prof_id: '', type_id: ''}
		});
		setErrorApi(undefined);
	};

	const setCheck = (value) => {
		dispatchForm({type: 'SET_CHECKED_NORMS_TYPE', payload: value});
		dispatchForm({
			type: 'SET_VALUE', payload:
				{prof_id: '', activity_id: ''}
		});
		setErrorApi(undefined);
	};

	const selectType = async (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VALUE', payload: { 'type_id': option.value}});
		dispatchForm({type: 'RESET_VALIDITY'});
		setErrorApi(undefined);
	};

	const bindNormMaterial = async () => {
		await manageBindNormsApi({
			method: 'POST',
			payload: [{
				'material_type_id': values.type_id,
				'quantity': 1,
				'period': 365,
				'npa_link': ' ',
				'description': `created at ${new Date().toLocaleString()}`
			}]
		});
	};

	return (
		<div className={styles['manage_norms']}>
			<h1 className={styles['title']}>Управление нормами</h1>
			{errorApi && <div className={styles.error}>{errorApi}</div>}
			<div className={styles['content']}>
				<div className={styles['left_panel']}>
					<div className={styles['box']}>
						<span className={styles['box-title']}>Параметры нормы</span>
						<div className={styles['box-content']}>
							<div className={styles.container}>
								<span className={cn(styles.label,{
									[styles['disabled']]: checkedNormsType
								})}>Профессии</span>
								<ToggleSwitch
									checked={checkedNormsType}
									onChange={() => {setCheck(!checkedNormsType);}}
									className={styles.alwaysOn}
									aria-label="Переключатель сущностей"
								/>
								<span className={cn(styles.label, {
									[styles['disabled']]: !checkedNormsType
								})}>Опасные факторы</span>
							</div>
							<span className={cn(styles['span'], {
								[styles['disabled']]: checkedNormsType
							})}>
							Профессии:
								<SelectForm
									value={optionsProf.find(u => u.value === values?.prof_id) ?? null}
									options={optionsProf}
									name="prof_id"
									onChange={selectProf}
									placeholder="Профессии"
									isDisabled={checkedNormsType}
								/>
							</span>
							<span
								className={cn(styles['span'],
									{[styles['disabled']]: !checkedNormsType}
								)}
							>
								Опасные факторы:
								<SelectForm
									value={optionsActivities.find(u => u.value === values?.activity_id) ?? null}
									options={optionsActivities}
									name="activity_id"
									onChange={selectActivity}
									placeholder="Опасные факторы"
									isDisabled={!checkedNormsType}
								/>
							</span>
							<div className={styles.normContainer}>
								{currentNorm?.['title']	&&
									<div className={styles.normBox}>
										<span className={styles.textNorm}>{currentNorm?.['title']}</span>
									</div>
								}
								{!currentNorm?.['title'] &&
									<div className={styles.absentNorm}>
										<span className={styles.textNorm}>Нет нормы</span>
									</div>
								}
							</div>
					
							<div className={styles.button_box}>
								{(Boolean(currentNorm) && visibleDelButton) && <div className={styles['inline']}>
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
								{subModalOpen && <div className={styles.submodal}>
									<Button className={styles.button_submodal} onClick={deleteNorm}>
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
						<Button
							onClick={creatEditNorm}
							className={(currentNorm || !currentItemTitle) ? styles.hiddenButton : ''}
						>
								Создать
						</Button>
					</div>
				</div>
				<div className={styles['right_panel']}>
					<div className={styles.containerBind}>
						<div className={styles.typeSelect}>
							<span className={styles['span']}>
							Типы материалов:
								<SelectForm
									value={actualOptionsTypes.find(u => u.value === values?.type_id) ?? null}
									options={actualOptionsTypes}
									name="type_id"
									onChange={selectType}
									placeholder="Тип материала"
								/>
							</span>
						</div>
						<div className={styles['buttonBind']}>
							<Button
								className={cn( {
									[styles.disabledButton]: !Boolean(values?.type_id)
								})}
								onClick={bindNormMaterial}
							>
								Привязать
							</Button>
						</div>
						<div className={styles.bindedBox}>
							{ loading
								? <Spinner />
								: bindedTypeMaterials.map(item => {
									return (
										<div key={item.id} className={styles.bindedItem}>
											<NormMaterial
												item={item}
												manageBindNormsApi={manageBindNormsApi}
											/>
										</div>
									);
								})
							}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
