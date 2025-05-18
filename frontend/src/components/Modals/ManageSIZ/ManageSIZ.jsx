import styles from './ManageSIZ.module.css';
import Button from '../../Button/Button';
import {
	getAllMaterialTypesUrl, typeSizes,
	unitsOfMeasurements
} from '../../../helpers/constants';
import React, {useEffect, useReducer, useState} from 'react';
import {SelectForm} from '../../SelectForm/SelectForm';
import {Tooltip} from 'react-tooltip';
import InputForm from '../../InputForm/InputForm';
import {
	formReducer,
	INITIAL_STATE,
	nullOption
} from './manageSIZ.state';
import useApi from '../../../hooks/useApi.hook';


export function ManageSIZ({optionsSIZ, SIZDict, getSIZ}) {
	const [errorApi, setErrorApi] = useState(undefined);
	const [state, dispatchForm] = useReducer(formReducer, INITIAL_STATE);
	const api = useApi();

	const {
		valueSIZ,
		subModalOpen,
		visibleDelButton,
		values,
		isValid,
		errors,
		isFormReadyToSubmit
	} = state;
	
	const optionsSIZWide = [
		nullOption, ...optionsSIZ
	];

	const manageSIZApi = async (payload, isDelete = false) => {
		try {
			let response;
			if (valueSIZ?.value) {
				if (isDelete) {
					await api.delete(`${getAllMaterialTypesUrl}${valueSIZ?.value}`);
				} else {
					response = await api.patch(`${getAllMaterialTypesUrl}${valueSIZ?.value}`, payload);
				}
			} else {
				response = await api.post(`${getAllMaterialTypesUrl}`, payload);
			}
			getSIZ();
			if (response) {
				const { id, title, unit_of_measurement, size_type  } = response.data;
				const newOption = { value: id, label: title };
				dispatchForm({type: 'SET_SUB_MODAL', payload: false});
				dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
				dispatchForm({type: 'SET_VALUE_SIZ', payload: newOption});
				dispatchForm({type: 'RESET_VALIDITY'});
				dispatchForm({
					type: 'SET_VALUE', payload:
					{
						'title': title,
						'unit_of_measurement': unit_of_measurement,
						'size_type': size_type
					}}
				);
			}
		} catch (e) {
			setErrorApi(
				e.response?.data?.detail || e.response?.data?.message || 'Неизвестная ошибка'
			);
		}
	};


	const selectSIZ = async (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: true});
		dispatchForm({type: 'SET_VALUE_SIZ', payload: option});
		dispatchForm({type: 'RESET_VALIDITY'});
		setErrorApi(undefined);
		if (option.value !== 0) {
			dispatchForm({
				type: 'SET_VALUE', payload:
					{
						'title': option.label,
						'unit_of_measurement': SIZDict[option.value]?.unit_of_measurement || '',
						'size_type': SIZDict[option.value]?.size_type || ''
					}}
			);
		} else {
			dispatchForm({type: 'CLEAR'});
		}
	};

	const onChange = (e) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});
		dispatchForm({type: 'SET_VALUE', payload: { [e.target.name]: e.target.value}});
		dispatchForm({type: 'RESET_VALIDITY'});
		setErrorApi(undefined);
	};

	const creatEditSIZ = () => {
		dispatchForm({type: 'SUBMIT'});
	};

	const deleteSIZ = () => {
		manageSIZApi({}, true);
		dispatchForm({ type: 'CLEAR' });
		dispatchForm({type: 'SET_VALUE_SIZ', payload: nullOption});
	};

	useEffect(() => {
		if (isFormReadyToSubmit) {
			manageSIZApi(values);
			dispatchForm({ type: 'SET_SUBMIT_FALSE' });
		}
	}, [isFormReadyToSubmit]);

	const selectUnit = (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});
		dispatchForm({type: 'SET_VALUE', payload: { 'unit_of_measurement': option.value}});
		dispatchForm({type: 'RESET_VALIDITY'});
		setErrorApi(undefined);
	};

	const selectType = (option) => {
		dispatchForm({type: 'SET_SUB_MODAL', payload: false});
		dispatchForm({type: 'SET_VISIBLE_DEL_BUTTON', payload: false});
		dispatchForm({type: 'SET_VALUE', payload: { 'size_type': option.value}});
		setErrorApi(undefined);
	};

	return (
		<div className={styles['manage_siz']} >
			<h1 className={styles['title']}>Управление типами материалов</h1>
			{errorApi && <div className={styles['error']}>{errorApi}</div>}
			<div className={styles['content']}>
				<span className={styles['span']}>
					Опасные факторы:
					<SelectForm
						value={valueSIZ}
						options={optionsSIZWide}
						name="SIZ_id"
						onChange={selectSIZ}
					/>
				</span>
				<div className={styles['box']}>
					<span className={styles['box-title']}>Параметры типа материала</span>
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
						<span
							className={styles['span']}
							data-tooltip-content={errors.unit_of_measurement}
							data-tooltip-id="errorTooltipUnit"
						>
							Единица измерения:
							<SelectForm
								isValid={isValid.unit_of_measurement}
								value={unitsOfMeasurements.find(u => u.value === values.unit_of_measurement) ?? null}
								options={unitsOfMeasurements}
								name="SIZ_id"
								onChange={selectUnit}
								placeholder={'Единица измерения'}
							/>
							<Tooltip
								id="errorTooltipUnit"
								place="top-end"
								content={errors.unit_of_measurement}
								isOpen={!isValid.unit_of_measurement}
								className={styles['my-tooltip']}
							/>
						</span>
						<span className={styles['span']}>
							Тип:
							<SelectForm
								value={typeSizes.find(u => u.value === values.size_type) ?? null}
								options={typeSizes}
								name="SIZ_id"
								onChange={selectType}
								placeholder={'Тип'}
							/>
						</span>
						<div className={styles['button-box']}>
							{(Boolean(valueSIZ?.value) && visibleDelButton) && <div className={styles['inline']}>
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
								<Button className={styles.button_submodal} onClick={deleteSIZ}>
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
					<Button onClick={creatEditSIZ}>
						{valueSIZ?.value ? 'Редактировать' : 'Создать'}
					</Button>
				</div>
			</div>
		</div>
	);
};
